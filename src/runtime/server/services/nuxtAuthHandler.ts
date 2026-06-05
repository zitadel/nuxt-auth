/* eslint-disable no-undef */
import type { H3Event } from 'h3';
import {
  appendResponseHeader,
  eventHandler,
  getHeaders,
  getQuery,
  getRequestURL,
  setResponseStatus,
  splitCookiesString,
  toWebRequest,
} from 'h3';
import { Auth, createActionURL, setEnvDefaults } from '@auth/core';
import type { AuthConfig, Session } from '@auth/core/types';
import { defu } from 'defu';
import { useRuntimeConfig } from '#imports';

/**
 * Some environments (e.g. Vitest nuxt) polyfill Request with a class whose
 * Headers constructor cannot consume the Headers instance carried by an H3
 * event — class-identity mismatches between the polyfill's Headers and the
 * host's native Headers cause the init to be silently discarded.
 *
 * Under Vitest 3 this only affected `cookie` (stripped per the Fetch spec's
 * forbidden request-header rules); under Vitest 4 every header is dropped.
 * Either way Node's native Request preserves them, so production runtime is
 * unaffected.
 *
 * Re-copy every header present on the H3 event onto the web Request when
 * it's missing. Skip the forbidden headers the spec disallows on a Request
 * so the polyfill doesn't reject the patched Headers entirely.
 */
const FORBIDDEN_REQUEST_HEADERS = new Set([
  'accept-charset',
  'accept-encoding',
  'access-control-request-headers',
  'access-control-request-method',
  'connection',
  'content-length',
  'cookie2',
  'date',
  'dnt',
  'expect',
  'host',
  'keep-alive',
  'origin',
  'referer',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'via',
]);

function patchRequestHeaders(request: Request, event: H3Event): void {
  const patched = new Headers(request.headers);
  let changed = false;
  event.headers.forEach((value, name) => {
    const lower = name.toLowerCase();
    if (FORBIDDEN_REQUEST_HEADERS.has(lower)) return;
    if (lower.startsWith('proxy-') || lower.startsWith('sec-')) return;
    if (patched.has(name)) return;
    patched.set(name, value);
    changed = true;
  });
  if (!changed) return;
  Object.defineProperty(request, 'headers', {
    value: patched,
    writable: false,
    configurable: true,
  });
}

/**
 * Creates the Nuxt Auth instance.
 *
 * Mirrors the factory shape used by every other SDK in this family
 * (next-auth, remix-auth, sveltekit-auth, solidstart-auth, tanstack-auth,
 * qwik-auth, astro-auth): a single call returns both the catch-all
 * `handlers` to mount on the auth route and the `getSession` helper to
 * read the current session.
 *
 * Because both are produced inside the same factory call, they close
 * over the same resolved `AuthConfig`. There is no module-level mutable
 * state, no lazy `$fetch` bootstrap, and no recursion guard — calling
 * `getSession` requires importing the module that called the factory,
 * which by ES-module semantics guarantees the factory has already run.
 *
 * @example
 * ```ts
 * // server/auth.ts
 * import { NuxtAuth } from '@zitadel/nuxt-auth';
 * import { authOptions } from './auth.config';
 *
 * export const { handlers, getSession } = NuxtAuth(authOptions);
 * ```
 *
 * ```ts
 * // server/api/auth/[...].ts
 * import { handlers } from '~~/server/auth';
 * export default handlers;
 * ```
 *
 * ```ts
 * // anywhere on the server (page loaders, API routes, middleware)
 * import { getSession } from '~~/server/auth';
 * ```
 *
 * @public
 */
export function NuxtAuth(nuxtAuthOptions?: AuthConfig): {
  handlers: ReturnType<typeof eventHandler>;
  getSession: (event: H3Event) => Promise<Session | null>;
  /** @deprecated Use `getSession` instead. */
  getServerSession: (event: H3Event) => Promise<Session | null>;
} {
  const isProduction = process.env.NODE_ENV === 'production';
  const runtimeConfig = useRuntimeConfig();
  const trustHostUserPreference = runtimeConfig.public.auth.provider.trustHost;

  const secret = nuxtAuthOptions?.secret || process.env.AUTH_SECRET;
  if (!secret) {
    if (isProduction) {
      throw new Error(
        'AUTH_NO_SECRET: No `secret` - this is an error in production. You can ignore this during development',
      );
    } else {
      console.warn(
        '[@zitadel/nuxt-auth] AUTH_NO_SECRET: No `secret` - this is an error in production. You can ignore this during development',
      );
    }
  }

  const authOptions = defu(nuxtAuthOptions, {
    secret,
    providers: [],
    trustHost: trustHostUserPreference || !isProduction,
    basePath: runtimeConfig.public.auth.baseURL,
  }) as AuthConfig;

  setEnvDefaults(process.env, authOptions);

  const handlers = eventHandler(async (event: H3Event) => {
    const request = toWebRequest(event);

    patchRequestHeaders(request, event);

    const response = await Auth(request, authOptions);

    // Auth.js builds its Response with the environment's Headers class.
    // Some environments (e.g. happy-dom in vitest-nuxt) combine multiple
    // Set-Cookie values into a single header entry, making getSetCookie()
    // unreliable. Use h3's splitCookiesString for robust cookie extraction.
    const setCookieHeaders = splitCookiesString(
      response.headers.get('set-cookie') ?? '',
    );

    // Auth.js returns redirects after sign-in/sign-out. When the client
    // requests JSON (via the composable), return the target URL as data
    // instead of a 302 so the client can handle navigation.
    const location = response.headers.get('location');
    if (location && response.status >= 300 && response.status < 400) {
      if (getQuery(event).json === 'true') {
        for (const cookie of setCookieHeaders) {
          appendResponseHeader(event, 'set-cookie', cookie);
        }
        return { url: location };
      }
    }

    // For JSON responses (session, providers, csrf): preserve the
    // original status code and headers (e.g. cache-control), transfer
    // cookies, and return the parsed body. Returning the parsed value
    // lets h3 send 204 for null (empty sessions).
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      setResponseStatus(event, response.status);
      response.headers.forEach((headerValue, headerName) => {
        if (headerName.toLowerCase() !== 'set-cookie') {
          appendResponseHeader(event, headerName, headerValue);
        }
      });
      for (const cookie of setCookieHeaders) {
        appendResponseHeader(event, 'set-cookie', cookie);
      }
      return await response.json();
    }

    // For all other responses (HTML sign-in/sign-out pages, non-JSON
    // redirects), return the Response — h3 handles it via sendWebResponse.
    return response;
  });

  async function getSession(event: H3Event): Promise<Session | null> {
    const headers = new Headers(getHeaders(event) as HeadersInit);
    const origin = getRequestURL(event, {
      xForwardedHost: trustHostUserPreference,
      xForwardedProto: trustHostUserPreference || undefined,
    });

    const url = createActionURL(
      'session',
      origin.protocol.slice(0, -1) as 'http' | 'https',
      headers,
      process.env,
      authOptions,
    );

    const request = new Request(url, { headers });
    patchRequestHeaders(request, event);

    const response = await Auth(request, authOptions);
    const data = (await response.json()) as Record<string, unknown> | null;

    // An empty session is `{}` with status 200; non-200 responses (e.g.
    // 401/500) typically carry `{ message: "..." }` and must NOT be
    // returned as a Session — that would let callers mistake an error
    // payload for a valid logged-in session. Match the status check the
    // other 7 SDK getSession implementations use.
    if (!data || !Object.keys(data).length) {
      return null;
    }
    if (response.status === 200) {
      return data as unknown as Session;
    }
    throw new Error((data as { message?: string }).message ?? 'Session error');
  }

  return {
    handlers,
    getSession,
    // Pre-rename alias. Kept so consumers on the old name still compile;
    // see the @deprecated tag on the factory return type.
    getServerSession: getSession,
  };
}
