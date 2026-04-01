import { defu } from 'defu'
import { computed, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { Session } from '@auth/core/types'
import type { AuthJsClient, ProviderInfo } from '../../shared/authJsClient'
import type { SessionLastRefreshedAt, SessionStatus } from '../../shared/types'
import { getQuery, hasProtocol, isScriptProtocol, parseURL } from 'ufo'
import { determineCallbackUrl } from '../utils/callbackUrl'
import type { NuxtApp } from '#app/nuxt'
import { callWithNuxt } from '#app/nuxt'
import {
  createError,
  useNuxtApp,
  useRequestURL,
  useRouter,
  useRuntimeConfig,
  useState,
} from '#imports'

/**
 * The session data structure returned by Auth.js.
 *
 * @see {@link https://authjs.dev/getting-started/session-management}
 */
export type SessionData = Session

/**
 * Provides direct access to the writable reactive authentication state.
 * Used internally by plugins that need to set `loading`, reset `data`
 * on unmount, etc. Application code should use {@link useAuth} instead.
 *
 * @internal
 */
export function useAuthState() {
  const data = useState<SessionData | undefined | null>(
    'auth:data',
    () => undefined,
  )

  const lastRefreshedAt = useState<SessionLastRefreshedAt>(
    'auth:lastRefreshedAt',
    () => {
      if (data.value) {
        return new Date()
      }
      return undefined
    },
  )

  const loading = useState<boolean>('auth:loading', () => false)
  const status = computed<SessionStatus>(() => {
    if (loading.value) {
      return 'loading'
    }
    if (data.value) {
      return 'authenticated'
    }
    return 'unauthenticated'
  })

  return { data, loading, lastRefreshedAt, status }
}

interface SecondarySignInOptions extends Record<string, unknown> {
  /** URL to redirect to after signing in. Defaults to current page. */
  readonly callbackUrl?: string
  /** Whether to redirect after sign-in. @default true */
  readonly redirect?: boolean
  /** Whether to call getSession after sign-in. @default true */
  readonly callGetSession?: boolean
}

interface SignOutOptions {
  /** URL to redirect to after signing out. */
  readonly callbackUrl?: string
  /** Whether to redirect after sign-out. @default true */
  readonly redirect?: boolean
}

interface GetSessionOptions {
  /** If true, redirects to sign-in when not authenticated. */
  readonly required?: boolean
  /** URL to redirect to after sign-in (when required is true). */
  readonly callbackUrl?: string
  /** Custom handler when unauthenticated and required is true. */
  readonly onUnauthenticated?: () => void
  /** Refetch session even if token is null. @default false */
  readonly force?: boolean
}

/**
 * The result object returned after attempting to sign in a user. This object
 * contains information about whether the sign-in was successful, any errors
 * that occurred, and navigation details for handling redirects.
 *
 * When using OAuth providers, a successful sign-in typically results in a
 * redirect to the provider's authorisation page. For credentials-based
 * authentication, the result indicates whether the credentials were valid.
 *
 * @example
 * ```ts
 * const result = await signIn('credentials', {
 *   username: 'user@example.com',
 *   password: 'secret'
 * })
 *
 * if (result.error) {
 *   console.error('Sign-in failed:', result.error)
 * } else {
 *   console.log('Sign-in successful, redirecting to:', result.url)
 * }
 * ```
 */
export interface SignInResult {
  /**
   * The error code if the sign-in failed. This will be null when the sign-in
   * was successful. Common error codes include "CredentialsSignin" for invalid
   * credentials and "InvalidProvider" when the specified provider doesn't
   * exist or isn't configured.
   */
  readonly error: string | null

  /**
   * The HTTP status code from the sign-in response. A status of 200 indicates
   * success without redirect, 302 indicates a successful redirect, and 4xx/5xx
   * codes indicate various error conditions.
   */
  readonly status: number

  /**
   * Indicates whether the sign-in request completed without server errors.
   * Note that this being true doesn't necessarily mean the user is
   * authenticated; check the error property for authentication failures.
   */
  readonly ok: boolean

  /**
   * The URL to redirect to after sign-in. For OAuth providers, this is the
   * provider's authorisation URL. For credentials, this is typically the
   * callback URL or the page the user was trying to access.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly url: any

  /**
   * The result from the internal navigation handler. This value should be
   * returned from route middleware to ensure vue-router processes the
   * navigation correctly. This is particularly important when using the
   * composable within middleware contexts.
   *
   * @see https://github.com/zitadel/nuxt-auth/pull/1057
   */
  readonly navigationResult: boolean | string | void | undefined
}

export type { ProviderInfo }

/**
 * The return type of the `useAuth` composable.
 */
export interface UseAuthReturn {
  /**
   * Reactive reference containing the current session data. This includes
   * user information, expiration time, and any custom session properties
   * configured in your Auth.js callbacks. The value is `null` when not
   * authenticated and `undefined` during initial loading.
   */
  data: Readonly<Ref<SessionData | null | undefined>>

  /**
   * Computed property indicating the current authentication status.
   *
   * - `'loading'` - Session is being fetched
   * - `'authenticated'` - User has a valid session
   * - `'unauthenticated'` - No valid session exists
   */
  status: ComputedRef<SessionStatus>

  /**
   * Timestamp of the last session refresh, or `undefined` if never fetched.
   */
  lastRefreshedAt: Readonly<Ref<SessionLastRefreshedAt>>

  /**
   * Initiates authentication with the specified provider.
   *
   * @param provider - Provider ID (e.g., "github", "credentials")
   * @param options - Sign-in options including credentials for password auth
   * @param authorisationParams - Additional OAuth query parameters
   */
  signIn: (
    provider?: string,
    options?: {
      callbackUrl?: string
      redirect?: boolean
      callGetSession?: boolean
    } & Record<string, unknown>,
    authorisationParams?: Record<string, string>,
  ) => Promise<SignInResult>

  /**
   * Signs out the current user and optionally redirects.
   *
   * @param options - Sign-out options including `callbackUrl` and `redirect`
   */
  signOut: (options?: {
    callbackUrl?: string
    redirect?: boolean
  }) => Promise<unknown>

  /**
   * Fetches the current session from the server.
   *
   * @param getSessionOptions - Options including `required` to enforce auth
   */
  getSession: (getSessionOptions?: {
    required?: boolean
    callbackUrl?: string
    onUnauthenticated?: () => void
    force?: boolean
  }) => Promise<SessionData | null>

  /** Retrieves the CSRF token for custom auth requests. */
  getCsrfToken: () => Promise<string>

  /** Fetches all configured authentication providers. */
  getProviders: () => Promise<Record<string, ProviderInfo | undefined>>

  /** Alias for `getSession`. */
  refresh: (getSessionOptions?: {
    required?: boolean
    callbackUrl?: string
    onUnauthenticated?: () => void
    force?: boolean
  }) => Promise<SessionData | null>
}

/**
 * The primary authentication composable for client-side authentication in
 * Nuxt applications using Auth.js. This composable provides a complete set
 * of methods and reactive state for managing user authentication, including
 * sign-in, sign-out, session management, and provider discovery.
 *
 * This composable is automatically imported by Nuxt when the auth module is
 * installed. It integrates seamlessly with both client-side and server-side
 * rendering, handling cookie proxying and session hydration automatically.
 *
 * The composable maintains reactive state that updates automatically when
 * authentication status changes. The `status` computed property provides a
 * simple way to check if the user is authenticated, unauthenticated, or if
 * the session is still loading.
 *
 * @returns An object containing reactive authentication state and methods
 *          for managing the user's session
 *
 * @example
 * Checking authentication status in a component:
 * ```vue
 * <script setup>
 * const { status, data, signIn, signOut } = useAuth()
 *
 * const user = computed(() => data.value?.user)
 * const isLoggedIn = computed(() => status.value === 'authenticated')
 * </script>
 *
 * <template>
 *   <div v-if="status === 'loading'">Loading...</div>
 *   <div v-else-if="isLoggedIn">
 *     Welcome, {{ user?.name }}!
 *     <button @click="signOut()">Sign Out</button>
 *   </div>
 *   <div v-else>
 *     <button @click="signIn('github')">Sign in with GitHub</button>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Using credentials authentication with error handling:
 * ```ts
 * const { signIn, status } = useAuth()
 *
 * async function handleLogin(email: string, password: string) {
 *   const result = await signIn('credentials', {
 *     email,
 *     password,
 *     redirect: false
 *   })
 *
 *   if (result.error) {
 *     showError('Invalid email or password')
 *     return
 *   }
 *
 *   navigateTo('/dashboard')
 * }
 * ```
 *
 * @example
 * Protecting a page with required authentication:
 * ```ts
 * const { getSession } = useAuth()
 *
 * // This will redirect to sign-in if not authenticated
 * await getSession({ required: true })
 * ```
 *
 * @example
 * Building a custom provider selection page:
 * ```ts
 * const { getProviders, signIn } = useAuth()
 *
 * const providers = await getProviders()
 * // Render buttons for each provider
 * for (const provider of Object.values(providers)) {
 *   // Create button that calls signIn(provider.id)
 * }
 * ```
 *
 * @see {@link https://authjs.dev/} for Auth.js documentation
 */
export function useAuth(): UseAuthReturn {
  const nuxt = useNuxtApp()
  const client = nuxt.$authClient as AuthJsClient
  const runtimeConfig = useRuntimeConfig()
  const { data, loading, status, lastRefreshedAt } = useAuthState()

  /**
   * Initiates the authentication flow for the specified provider. This method
   * handles both OAuth-based providers (like GitHub, Google) and credentials-
   * based authentication. The behavior varies depending on the provider type:
   *
   * For OAuth providers, the user is redirected to the provider's login page.
   * After successful authentication, they are redirected back to your
   * application with the session established.
   *
   * For credentials providers, the username and password (or other
   * credentials) are validated server-side. If valid, a session is created
   * without any external redirects.
   *
   * If no provider is specified and no default provider is configured, the
   * user is shown a page listing all available authentication options.
   *
   * @param provider - The ID of the provider to use for authentication. Pass
   *                   undefined to show all providers or use the configured
   *                   default. Examples: "github", "google", "credentials"
   *
   * @param options - Configuration options for the sign-in flow. For OAuth
   *                  providers, use `callbackUrl` to specify where to redirect
   *                  after authentication. For credentials providers, include
   *                  the authentication fields (e.g., email, password). Set
   *                  `redirect: false` to handle the result programmatically
   *                  instead of redirecting.
   *
   * @param authorisationParams - Additional query parameters to include in the
   *                              OAuth authorisation URL. Use this for OAuth
   *                              scopes, prompts, or provider-specific params.
   *                              Example: `{ scope: "read:user user:email" }`
   *
   * @returns A promise that resolves to a SignInResult object containing the
   *          outcome of the authentication attempt, including any errors and
   *          the redirect URL.
   *
   * @example
   * Sign in with an OAuth provider:
   * ```ts
   * await signIn('github')
   * ```
   *
   * @example
   * Sign in with credentials and handle the result:
   * ```ts
   * const result = await signIn('credentials', {
   *   email: 'user@example.com',
   *   password: 'secretpassword',
   *   redirect: false
   * })
   * if (result.error) {
   *   alert('Invalid credentials')
   * }
   * ```
   *
   * @example
   * Sign in with custom OAuth scopes:
   * ```ts
   * await signIn('github', {}, { scope: 'read:user read:org' })
   * ```
   */
  async function signIn(
    provider?: string,
    options?: SecondarySignInOptions,
    authorisationParams?: Record<string, string>,
  ): Promise<SignInResult> {
    const configuredProviders = await callWithNuxt(nuxt, () =>
      client.getProviders(),
    )
    if (!configuredProviders) {
      const errorUrl = client.getErrorPageUrl()
      const navigationResult = await navigateToAuthPageWN(nuxt, errorUrl, true)

      return {
        error: 'InvalidProvider',
        ok: false,
        status: 500,
        url: errorUrl,
        navigationResult,
      }
    }

    const resolvedProvider =
      provider ?? runtimeConfig.public.auth.provider.defaultProvider

    const { redirect = true } = options ?? {}

    const callbackUrl = await callWithNuxt(nuxt, () =>
      determineCallbackUrl(runtimeConfig.public.auth, options?.callbackUrl),
    )

    const selectedProvider =
      resolvedProvider && configuredProviders[resolvedProvider]
    if (!selectedProvider) {
      const hrefSignInAllProviderPage = client.getSignInPageUrl(callbackUrl)
      const navigationResult = await navigateToAuthPageWN(
        nuxt,
        hrefSignInAllProviderPage,
        true,
      )

      return {
        error: 'InvalidProvider',
        ok: false,
        status: 400,
        url: hrefSignInAllProviderPage,
        navigationResult,
      }
    }

    const isCredentials = selectedProvider.type === 'credentials'
    const isEmail = selectedProvider.type === 'email'
    const isSupportingReturn = isCredentials || isEmail

    const csrfToken = await callWithNuxt(nuxt, () => client.getCsrfToken())

    // @ts-expect-error `options` is typed as any, but is a valid parameter for URLSearchParams
    const body = new URLSearchParams({
      ...options,
      csrfToken,
      callbackUrl,
      json: true,
    })

    const signInData = await callWithNuxt(nuxt, () =>
      client.signIn(
        resolvedProvider!,
        selectedProvider.type,
        body,
        authorisationParams,
      ),
    )

    if (redirect || !isSupportingReturn) {
      const href = signInData.url ?? callbackUrl
      const navigationResult = await navigateToAuthPageWN(nuxt, href)

      const error = (getQuery(href).error as string) ?? null

      return {
        error,
        ok: true,
        status: 302,
        url: href,
        navigationResult,
      }
    }

    const error = (getQuery(signInData.url).error as string) ?? null
    await getSessionWithNuxt(nuxt)

    return {
      error,
      status: 200,
      ok: true,
      url: error ? null : signInData.url,
      navigationResult: undefined,
    }
  }

  /**
   * Fetches all authentication providers configured on the server. This is
   * useful for building custom sign-in pages that display buttons or links
   * for each available authentication method.
   *
   * The returned object maps provider IDs to their configuration, including
   * the display name, provider type, and sign-in URLs. You can iterate over
   * this to dynamically render authentication options.
   *
   * @returns A promise that resolves to a record of provider configurations.
   *          Each key is the provider ID and each value contains the
   *          provider's display information.
   *
   * @example
   * Building a custom provider selection UI:
   * ```ts
   * const providers = await getProviders()
   *
   * for (const [id, provider] of Object.entries(providers)) {
   *   console.log(`${provider.name}: ${provider.signinUrl}`)
   * }
   * ```
   */
  async function getProviders() {
    return callWithNuxt(nuxt, () => client.getProviders())
  }

  /**
   * Fetches the current session from the authentication server and updates
   * the local session state. This method is useful for refreshing session
   * data after it may have changed, or for enforcing that a valid session
   * exists before proceeding.
   *
   * When called, this method makes a request to the session endpoint and
   * updates the reactive `data` and `status` properties. If the session has
   * expired or is invalid, the status will change to "unauthenticated".
   *
   * The `required` option provides a declarative way to enforce
   * authentication. When set to true, unauthenticated users are automatically
   * redirected to the sign-in page. You can customize this behavior with
   * the `onUnauthenticated` callback.
   *
   * This method also serves as the implementation for the `refresh` alias,
   * allowing you to use either name interchangeably.
   *
   * @param getSessionOptions - Optional configuration for the session fetch:
   *
   *        `required` - When true, redirects to sign-in if not authenticated.
   *        This is useful for protecting pages that require authentication.
   *
   *        `callbackUrl` - The URL to redirect to after successful sign-in
   *        when using `required: true`. Defaults to the current page URL.
   *
   *        `onUnauthenticated` - A custom callback invoked when required is
   *        true and no valid session exists. Overrides the default redirect
   *        behavior.
   *
   * @returns A promise that resolves to the session data if authenticated,
   *          or null if no valid session exists.
   *
   * @example
   * Refreshing the session data:
   * ```ts
   * const session = await getSession()
   * console.log('Current user:', session?.user?.name)
   * ```
   *
   * @example
   * Requiring authentication on a page:
   * ```ts
   * // Redirects to sign-in if not authenticated
   * await getSession({ required: true })
   * // This code only runs if authenticated
   * ```
   *
   * @example
   * Custom handling for unauthenticated users:
   * ```ts
   * await getSession({
   *   required: true,
   *   onUnauthenticated: () => {
   *     showLoginModal()
   *   }
   * })
   * ```
   */
  async function getSession(
    getSessionOptions?: GetSessionOptions,
  ): Promise<SessionData | null> {
    const callbackUrlFallback = useRequestURL().href
    const { required, callbackUrl, onUnauthenticated } = defu(
      getSessionOptions || {},
      {
        required: false,
        callbackUrl: undefined,
        onUnauthenticated: () =>
          signIn(undefined, {
            callbackUrl: getSessionOptions?.callbackUrl || callbackUrlFallback,
          }),
      },
    )

    lastRefreshedAt.value = new Date()

    try {
      const sessionData = await callWithNuxt(nuxt, () =>
        client.getSession(callbackUrl || callbackUrlFallback),
      )

      if (
        typeof sessionData === 'object' &&
        sessionData !== null &&
        Object.keys(sessionData).length > 0
      ) {
        data.value = sessionData as unknown as SessionData
      } else {
        data.value = null
      }
      loading.value = false

      if (required && status.value === 'unauthenticated') {
        await onUnauthenticated()
        return data.value ?? null
      }

      return data.value ?? null
    } catch (error) {
      loading.value = false
      throw error
    }
  }
  function getSessionWithNuxt(nuxt: NuxtApp) {
    return callWithNuxt(nuxt, getSession)
  }

  /**
   * Signs out the current user by invalidating their session on the server.
   * This clears the session cookie and updates the local authentication
   * state to reflect that the user is no longer authenticated.
   *
   * By default, after signing out the user is redirected to the home page
   * or a configured callback URL. You can disable this redirect by setting
   * `redirect: false` to handle post-sign-out navigation manually.
   *
   * The sign-out process includes CSRF protection. A valid CSRF token is
   * automatically fetched and included in the sign-out request to prevent
   * cross-site request forgery attacks.
   *
   * @param options - Configuration options for the sign-out process:
   *
   *        `callbackUrl` - The URL to redirect to after successful sign-out.
   *        Defaults to the application's base URL or the configured callback.
   *
   *        `redirect` - Whether to redirect after sign-out. Defaults to true.
   *        Set to false to handle navigation manually in your application.
   *
   * @returns A promise that resolves when sign-out is complete. If redirect
   *          is true, the promise resolves after initiating the redirect.
   *          If redirect is false, it resolves with the sign-out response.
   *
   * @throws Will throw an error if the CSRF token cannot be fetched.
   *
   * @example
   * Basic sign-out with default redirect:
   * ```ts
   * await signOut()
   * // User is redirected to the home page
   * ```
   *
   * @example
   * Sign-out without redirect for custom handling:
   * ```ts
   * await signOut({ redirect: false })
   * // Handle post-sign-out logic manually
   * showGoodbyeMessage()
   * navigateTo('/goodbye')
   * ```
   *
   * @example
   * Sign-out with custom redirect URL:
   * ```ts
   * await signOut({ callbackUrl: '/login?message=logged-out' })
   * ```
   */
  async function signOut(options?: SignOutOptions) {
    const { callbackUrl: userCallbackUrl, redirect = true } = options ?? {}

    const csrfToken = await callWithNuxt(nuxt, () => client.getCsrfToken())

    const callbackUrl = await determineCallbackUrl(
      runtimeConfig.public.auth,
      userCallbackUrl,
      true,
    )

    if (!csrfToken) {
      throw createError({
        status: 400,
        message: 'Could not fetch CSRF Token for signing out',
      })
    }

    const signoutData = await callWithNuxt(nuxt, () =>
      client.signOut(csrfToken, callbackUrl),
    )

    if (redirect) {
      const url = signoutData.url ?? callbackUrl
      return navigateToAuthPageWN(nuxt, url)
    }

    await getSessionWithNuxt(nuxt)
    return signoutData
  }

  /**
   * Retrieves the current Cross-Site Request Forgery (CSRF) token from the
   * authentication server. This token is used to protect against CSRF attacks
   * by ensuring that form submissions and API calls originate from your
   * application.
   *
   * In most cases, you won't need to call this method directly. The signIn
   * and signOut methods automatically fetch and include the CSRF token. This
   * method is provided for advanced use cases where you need to make custom
   * requests to the authentication endpoints.
   *
   * The CSRF token is session-specific and should be included in the body of
   * POST requests to authentication endpoints. It's automatically rotated
   * periodically for security.
   *
   * @returns A promise that resolves to the current CSRF token string.
   *
   * @example
   * Using the CSRF token in a custom authentication request:
   * ```ts
   * const csrfToken = await getCsrfToken()
   *
   * await fetch('/api/auth/custom-action', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ csrfToken, ...otherData })
   * })
   * ```
   */
  async function getCsrfToken() {
    return callWithNuxt(nuxt, () => client.getCsrfToken())
  }

  return {
    status,
    data: readonly(data) as Readonly<Ref<SessionData | null | undefined>>,
    lastRefreshedAt: readonly(lastRefreshedAt),
    getSession,
    getCsrfToken,
    getProviders,
    signIn,
    signOut,
    refresh: getSession,
  }
}

function navigateToAuthPageWN(
  nuxt: NuxtApp,
  href: string,
  isInternalRouting?: boolean,
) {
  return callWithNuxt(nuxt, navigateToAuthPage, [nuxt, href, isInternalRouting])
}

/**
 * Encodes a URL for safe use in HTTP Location headers and HTML meta refresh tags.
 *
 * For internal (same-host) URLs, returns only the path + search + hash,
 * stripping the origin. For external URLs, returns the full URL string.
 * Protocol-relative URLs (starting with `//`) are preserved without a protocol.
 *
 * Adapted from https://github.com/nuxt/nuxt/blob/16d213bbdcc69c0cc72afb355755ff877654a374/packages/nuxt/src/app/composables/router.ts#L270-L282
 */
function encodeURL(location: string, isExternalHost = false) {
  const url = new URL(location, 'http://localhost')
  if (!isExternalHost) {
    return url.pathname + url.search + url.hash
  }
  if (location.startsWith('//')) {
    return url.toString().replace(url.protocol, '')
  }
  return url.toString()
}

/**
 * Custom navigation utility for Auth.js routes.
 *
 * This is a workaround for two Nuxt bugs that prevent `navigateTo` from
 * handling Auth.js callback URLs correctly. It should be removed once the
 * upstream issues are resolved — tracked in
 * {@link https://github.com/zitadel/nuxt-auth/issues/5}.
 *
 * ### Why not `navigateTo`?
 *
 * 1. **Malformed `Location` header on SSR.** `navigateTo` writes raw URLs
 *    into the HTTP `Location` header. Auth.js callback URLs contain
 *    percent-encoded characters (e.g. `?callbackUrl=https%3A%2F%2F...`)
 *    that produce malformed redirects. The {@link encodeURL} helper used
 *    here handles this correctly.
 *
 * 2. **Broken deferred redirect in middleware.** During SSR middleware,
 *    `navigateTo` defers the redirect with
 *    `router.afterEach(final => final.fullPath === fullPath ? redirect() : undefined)`.
 *    The equality check never passes for Auth.js routes because vue-router
 *    percent-decodes `fullPath`, breaking the comparison. This is a
 *    confirmed Nuxt bug:
 *    {@link https://github.com/nuxt/nuxt/issues/33273 | nuxt/nuxt#33273}
 *    (filed Sep 2025, still unresolved). This implementation calls
 *    `redirect()` immediately, bypassing the broken path.
 *
 * ### Differences from `navigateTo`
 *
 * - Does **not** prepend `app.baseURL` — all callers are responsible for
 *   providing fully resolved paths.
 * - Skips vue-router resolution for internal routing to avoid `No match
 *   found` warnings for non-router routes like `/api/auth/signin`.
 * - On the client, always performs a full-page navigation via
 *   `window.location.href` (never `router.push`) because Auth.js routes
 *   are not registered with vue-router.
 *
 * @param nuxtApp - The current Nuxt application instance.
 * @param href - The URL to navigate to (absolute or relative path).
 * @param isInternalRouting - When `true`, skip vue-router resolution.
 *
 * @see {@link https://github.com/nuxt/nuxt/blob/v4.4.2/packages/nuxt/src/app/composables/router.ts#L141-L251 | Nuxt 4.4.2 navigateTo} — the upstream implementation this is adapted from.
 * @see {@link https://github.com/zitadel/nuxt-auth/issues/5} — tracking issue for removing this workaround.
 */
function navigateToAuthPage(
  nuxtApp: NuxtApp,
  href: string,
  isInternalRouting = false,
) {
  const router = useRouter()

  // https://github.com/nuxt/nuxt/blob/dc69e26c5b9adebab3bf4e39417288718b8ddf07/packages/nuxt/src/app/composables/router.ts#L84-L93
  const inMiddleware = Boolean(nuxtApp._processingMiddleware)

  // https://github.com/nuxt/nuxt/blob/v4.4.2/packages/nuxt/src/app/composables/router.ts#L167-L172
  const isExternalHost = hasProtocol(href, { acceptRelative: true })
  if (isExternalHost) {
    const { protocol } = parseURL(href)
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`)
    }
  }

  if (import.meta.server) {
    if (nuxtApp.ssrContext) {
      const location =
        isExternalHost || isInternalRouting
          ? href
          : router.resolve(href).fullPath || '/'

      async function redirect(response: false | undefined) {
        // Matches upstream navigateTo — remove if Nuxt deprecates `app:redirected`
        await nuxtApp.callHook('app:redirected')
        const encodedLoc = location.replace(/"/g, '%22')
        const encodedHeader = encodeURL(location, isExternalHost)

        nuxtApp.ssrContext!._renderResponse = {
          statusCode: 302,
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader },
        }
        return response
      }

      // `final.fullPath` is not percent-encoded, so comparing it to `location` always fails.
      // See: https://github.com/nuxt/nuxt/issues/33273
      if (!isExternalHost && inMiddleware) {
        return redirect(undefined)
      }
      return redirect(!inMiddleware ? undefined : false)
    }
  }

  // https://github.com/nuxt/nuxt/blob/v4.4.2/packages/nuxt/src/app/composables/router.ts#L199
  nuxtApp._scope.stop()
  window.location.href = href
  if (href.includes('#')) {
    window.location.reload()
  }

  return new Promise<void>(() => {})
}
