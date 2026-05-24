/**
 * URL builders for the sign-in / sign-out endpoints.
 *
 * Provided so consumers can construct redirect URLs without hardcoding
 * the basePath — matching the `signInUrl` / `signOutUrl` helpers
 * exposed by the other SDKs in this family (next, remix, sveltekit,
 * solidstart, tanstack, qwik, astro).
 *
 * The basePath defaults to `/api/auth`, which matches the
 * `baseURL` default the nuxt-auth module mounts at. Consumers who
 * configure a custom basePath should pass it explicitly.
 *
 * @example
 * ```ts
 * // app/middleware/auth.ts
 * import { signInUrl } from '@zitadel/nuxt-auth/urls';
 *
 * export default defineNuxtRouteMiddleware((to) => {
 *   const { status } = useAuth();
 *   if (status.value === 'unauthenticated') {
 *     return navigateTo(signInUrl({ redirectTo: to.path }));
 *   }
 * });
 * ```
 */

const DEFAULT_BASE_PATH = '/api/auth';

export function signInUrl(
  options: { redirectTo?: string; basePath?: string } = {},
): string {
  const basePath = (options.basePath ?? DEFAULT_BASE_PATH).replace(/\/$/, '');
  const params = new URLSearchParams();
  if (options.redirectTo) params.set('callbackUrl', options.redirectTo);
  const paramStr = params.toString();
  return `${basePath}/signin${paramStr ? `?${paramStr}` : ''}`;
}

export function signOutUrl(
  options: { redirectTo?: string; basePath?: string } = {},
): string {
  const basePath = (options.basePath ?? DEFAULT_BASE_PATH).replace(/\/$/, '');
  const params = new URLSearchParams();
  if (options.redirectTo) params.set('callbackUrl', options.redirectTo);
  const paramStr = params.toString();
  return `${basePath}/signout${paramStr ? `?${paramStr}` : ''}`;
}
