/**
 * Pure unit tests for the `useAuth` composable.
 *
 * These tests run without the Nuxt runtime. The Nuxt primitives (`useState`,
 * `useNuxtApp`, etc.) are provided by `tests/helpers/nuxt-env.ts` via vitest
 * `resolve.alias`. A real h3 HTTP server acts as the auth backend, and a
 * real `AuthJsClient` makes real HTTP calls via ofetch.
 */
import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  createApp,
  createRouter as createH3Router,
  eventHandler,
  getQuery,
  toNodeListener,
} from 'h3'
import { $fetch } from 'ofetch'
import { AuthJsClient } from '../src/runtime/shared/authJsClient'
import {
  _resetState,
  _setNuxtApp,
  _setRuntimeConfig,
  type NuxtApp,
} from './helpers/nuxt-env'
import { useAuth } from '../src/runtime/app/composables/useAuth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).$fetch = $fetch

const responses = {
  providers: {} as Record<string, unknown> | null,
  csrf: { csrfToken: 'test-csrf-token' } as { csrfToken: string | null },
  session: {} as Record<string, unknown>,
  signIn: { url: 'http://localhost:3000/' } as Record<string, unknown>,
  signOut: { url: '/' } as { url: string },
}

let server: Server
let baseURL: string
let nuxtApp: NuxtApp
let lastSignInQuery: Record<string, string> = {}

const PROVIDERS = {
  credentials: {
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
  },
  github: {
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
  },
  email: {
    id: 'email',
    name: 'Email',
    type: 'email',
  },
}

const AUTHENTICATED_SESSION = {
  user: { name: 'J Smith', email: 'jsmith@example.com' },
  expires: new Date(Date.now() + 86400000).toISOString(),
}

beforeAll(async () => {
  const app = createApp()
  const router = createH3Router()

  router.get(
    '/api/auth/providers',
    eventHandler(() => responses.providers),
  )
  router.get(
    '/api/auth/csrf',
    eventHandler(() => responses.csrf),
  )
  router.get(
    '/api/auth/session',
    eventHandler(() => responses.session),
  )
  router.post(
    '/api/auth/callback/**',
    eventHandler(() => responses.signIn),
  )
  router.post(
    '/api/auth/signin/**',
    eventHandler((event) => {
      lastSignInQuery = getQuery(event) as Record<string, string>
      return responses.signIn
    }),
  )
  router.post(
    '/api/auth/signout',
    eventHandler(() => responses.signOut),
  )

  app.use(router)

  server = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const addr = server.address() as { port: number }
  baseURL = `http://localhost:${addr.port}/api/auth`
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  _resetState()

  responses.providers = PROVIDERS
  responses.csrf = { csrfToken: 'test-csrf-token' }
  responses.session = {}
  responses.signIn = { url: 'http://localhost:3000/' }
  responses.signOut = { url: '/' }
  lastSignInQuery = {}

  const client = new AuthJsClient(baseURL, {
    nuxt: { ssrContext: {} },
    getRequestCookies: async () => undefined,
    appendResponseCookies: () => {},
  })

  nuxtApp = {
    $authClient: client,
    ssrContext: {},
    _processingMiddleware: false,
    callHook: async () => {},
  }

  _setNuxtApp(nuxtApp)
  _setRuntimeConfig({
    public: {
      auth: {
        baseURL,
        disableInternalRouting: true,
        originEnvKey: 'AUTH_ORIGIN',
        provider: {
          defaultProvider: '',
          addDefaultCallbackUrl: true,
          trustHost: false,
        },
        sessionRefresh: {},
      },
    },
  })
})

describe('useAuth', () => {
  describe('getProviders', () => {
    it('returns all configured providers', async () => {
      const { getProviders } = useAuth()
      const providers = await getProviders()

      expect(providers).toHaveProperty('credentials')
      expect(providers).toHaveProperty('github')
      expect(providers.credentials).toMatchObject({
        id: 'credentials',
        name: 'Credentials',
      })
    })
  })

  describe('getCsrfToken', () => {
    it('returns the token string', async () => {
      const { getCsrfToken } = useAuth()
      const token = await getCsrfToken()

      expect(token).toBe('test-csrf-token')
    })
  })

  describe('getSession', () => {
    it('sets unauthenticated status for empty session', async () => {
      const { getSession, data, status } = useAuth()
      await getSession()

      expect(data.value).toBeNull()
      expect(status.value).toBe('unauthenticated')
    })

    it('returns session data when authenticated', async () => {
      responses.session = AUTHENTICATED_SESSION

      const { getSession, data, status } = useAuth()
      await getSession()

      expect(data.value).toEqual(AUTHENTICATED_SESSION)
      expect(status.value).toBe('authenticated')
    })

    it('updates lastRefreshedAt after fetch', async () => {
      const before = Date.now()

      const { getSession, lastRefreshedAt } = useAuth()
      await getSession()

      expect(lastRefreshedAt.value).toBeInstanceOf(Date)
      expect(lastRefreshedAt.value!.getTime()).toBeGreaterThanOrEqual(before)
    })

    it('transitions from authenticated to unauthenticated', async () => {
      responses.session = AUTHENTICATED_SESSION

      const { getSession, status } = useAuth()
      await getSession()
      expect(status.value).toBe('authenticated')

      responses.session = {}
      await getSession()
      expect(status.value).toBe('unauthenticated')
    })

    it('calls onUnauthenticated when required and session is empty', async () => {
      let called = false

      const { getSession } = useAuth()
      await getSession({
        required: true,
        onUnauthenticated: () => {
          called = true
        },
      })

      expect(called).toBe(true)
    })
  })

  describe('signIn', () => {
    describe('with credentials provider', () => {
      it('returns success for valid credentials with redirect: false', async () => {
        responses.signIn = { url: 'http://localhost:3000/' }
        responses.session = AUTHENTICATED_SESSION

        const { signIn } = useAuth()
        const result = await signIn('credentials', {
          username: 'jsmith',
          password: 'hunter2',
          redirect: false,
        })

        expect(result).toMatchObject({
          ok: true,
          status: 200,
          error: null,
          url: 'http://localhost:3000/',
        })
      })

      it('reports credential errors with redirect: false', async () => {
        responses.signIn = {
          url: 'http://localhost:3000/api/auth/signin?error=CredentialsSignin',
        }

        const { signIn } = useAuth()
        const result = await signIn('credentials', {
          username: 'wrong',
          password: 'wrong',
          redirect: false,
        })

        expect(result).toMatchObject({
          ok: true,
          status: 200,
          error: 'CredentialsSignin',
          url: null,
        })
      })

      it('updates reactive state after successful sign-in', async () => {
        responses.signIn = { url: 'http://localhost:3000/' }
        responses.session = AUTHENTICATED_SESSION

        const { signIn, status, data } = useAuth()
        await signIn('credentials', {
          username: 'jsmith',
          password: 'hunter2',
          redirect: false,
        })

        expect(status.value).toBe('authenticated')
        expect(data.value).toEqual(AUTHENTICATED_SESSION)
      })

      it('sets SSR redirect when redirect is true (default)', async () => {
        responses.signIn = { url: 'http://localhost:3000/' }

        const { signIn } = useAuth()
        const result = await signIn('credentials', {
          username: 'jsmith',
          password: 'hunter2',
        })

        expect(result).toMatchObject({
          ok: true,
          status: 302,
          error: null,
          url: 'http://localhost:3000/',
        })
        expect(nuxtApp.ssrContext?._renderResponse).toMatchObject({
          statusCode: 302,
          headers: { location: 'http://localhost:3000/' },
        })
      })

      it('falls back to callbackUrl when server returns no url', async () => {
        responses.signIn = {}

        const { signIn } = useAuth()
        const result = await signIn('credentials', {
          username: 'jsmith',
          password: 'hunter2',
          redirect: true,
        })

        expect(result).toMatchObject({
          ok: true,
          status: 302,
        })
        // Falls back to callbackUrl (inferred from current page)
        expect(result.url).toBeDefined()
      })

      it('uses custom callbackUrl when provided', async () => {
        responses.signIn = { url: 'http://localhost:3000/' }
        responses.session = AUTHENTICATED_SESSION

        const { signIn } = useAuth()
        const result = await signIn('credentials', {
          username: 'jsmith',
          password: 'hunter2',
          redirect: false,
          callbackUrl: '/dashboard',
        })

        expect(result).toMatchObject({ ok: true, status: 200 })
      })
    })

    describe('with OAuth provider', () => {
      it('sets SSR redirect to OAuth authorisation URL', async () => {
        responses.signIn = { url: 'https://github.com/login/oauth/authorize' }

        const { signIn } = useAuth()
        const result = await signIn('github')

        expect(result).toMatchObject({
          ok: true,
          status: 302,
          url: 'https://github.com/login/oauth/authorize',
        })
        expect(nuxtApp.ssrContext?._renderResponse).toMatchObject({
          statusCode: 302,
          headers: {
            location: 'https://github.com/login/oauth/authorize',
          },
        })
      })

      it('always redirects even when redirect: false is passed', async () => {
        responses.signIn = { url: 'https://github.com/login/oauth/authorize' }

        const { signIn } = useAuth()
        const result = await signIn('github', { redirect: false })

        // OAuth providers do not support redirect: false, so it redirects anyway
        expect(result).toMatchObject({
          ok: true,
          status: 302,
          url: 'https://github.com/login/oauth/authorize',
        })
      })

      it('forwards authorisationParams as query parameters', async () => {
        responses.signIn = { url: 'https://github.com/login/oauth/authorize' }

        const { signIn } = useAuth()
        await signIn('github', {}, { scope: 'read:user read:org' })

        expect(lastSignInQuery).toMatchObject({
          scope: 'read:user read:org',
        })
      })

      it('falls back to callbackUrl when server returns no url', async () => {
        responses.signIn = {}

        const { signIn } = useAuth()
        const result = await signIn('github')

        expect(result).toMatchObject({
          ok: true,
          status: 302,
        })
        expect(result.url).toBeDefined()
        expect(nuxtApp.ssrContext?._renderResponse).toMatchObject({
          statusCode: 302,
        })
      })
    })

    describe('with email provider', () => {
      it('returns success with redirect: false', async () => {
        responses.signIn = { url: 'http://localhost:3000/verify' }
        responses.session = AUTHENTICATED_SESSION

        const { signIn } = useAuth()
        const result = await signIn('email', {
          email: 'jsmith@example.com',
          redirect: false,
        })

        expect(result).toMatchObject({
          ok: true,
          status: 200,
          url: 'http://localhost:3000/verify',
        })
      })

      it('sets SSR redirect when redirect is true', async () => {
        responses.signIn = { url: 'http://localhost:3000/verify' }

        const { signIn } = useAuth()
        const result = await signIn('email', {
          email: 'jsmith@example.com',
        })

        expect(result).toMatchObject({
          ok: true,
          status: 302,
          url: 'http://localhost:3000/verify',
        })
        expect(nuxtApp.ssrContext?._renderResponse).toMatchObject({
          statusCode: 302,
        })
      })
    })

    describe('with undefined provider', () => {
      it('redirects to all-providers page when no defaultProvider', async () => {
        const { signIn } = useAuth()
        const result = await signIn(undefined)

        expect(result).toMatchObject({
          error: 'InvalidProvider',
          ok: false,
          status: 400,
        })
        expect(result.url).toContain('/signin')
      })

      it('uses defaultProvider when configured', async () => {
        _setRuntimeConfig({
          public: {
            auth: {
              baseURL,
              disableInternalRouting: true,
              originEnvKey: 'AUTH_ORIGIN',
              provider: {
                defaultProvider: 'credentials',
                addDefaultCallbackUrl: true,
                trustHost: false,
              },
              sessionRefresh: {},
            },
          },
        })

        responses.signIn = { url: 'http://localhost:3000/' }
        responses.session = AUTHENTICATED_SESSION

        const { signIn } = useAuth()
        const result = await signIn(undefined, {
          username: 'jsmith',
          password: 'hunter2',
          redirect: false,
        })

        expect(result).toMatchObject({
          ok: true,
          status: 200,
          url: 'http://localhost:3000/',
        })
      })
    })

    describe('with invalid provider', () => {
      it('returns InvalidProvider with status 400', async () => {
        const { signIn } = useAuth()
        const result = await signIn('nonexistent')

        expect(result.error).toBe('InvalidProvider')
        expect(result.ok).toBe(false)
        expect(result.status).toBe(400)
      })
    })

    describe('when server returns no providers', () => {
      it('returns InvalidProvider with status 500', async () => {
        responses.providers = null

        const { signIn } = useAuth()
        const result = await signIn('credentials', {
          username: 'jsmith',
          password: 'hunter2',
        })

        expect(result).toMatchObject({
          error: 'InvalidProvider',
          ok: false,
          status: 500,
        })
        expect(result.url).toContain('/error')
      })
    })

    describe('response url with error query param', () => {
      it('extracts error from redirect url for credentials', async () => {
        responses.signIn = {
          url: 'http://localhost:3000/api/auth/signin?error=CredentialsSignin',
        }

        const { signIn } = useAuth()
        const result = await signIn('credentials', { redirect: true })

        expect(result).toMatchObject({
          ok: true,
          status: 302,
          error: 'CredentialsSignin',
        })
      })

      it('extracts error from redirect url for OAuth', async () => {
        responses.signIn = {
          url: 'http://localhost:3000/api/auth/signin?error=OAuthSignin',
        }

        const { signIn } = useAuth()
        const result = await signIn('github')

        expect(result).toMatchObject({
          ok: true,
          status: 302,
          error: 'OAuthSignin',
        })
      })

      it('extracts error from response url with redirect: false', async () => {
        responses.signIn = {
          url: 'http://localhost:3000/api/auth/signin?error=CredentialsSignin',
        }

        const { signIn } = useAuth()
        const result = await signIn('credentials', {
          username: 'wrong',
          password: 'wrong',
          redirect: false,
        })

        expect(result).toMatchObject({
          ok: true,
          status: 200,
          error: 'CredentialsSignin',
          url: null,
        })
      })

      it('returns null error when url has no error param', async () => {
        responses.signIn = { url: 'http://localhost:3000/' }
        responses.session = AUTHENTICATED_SESSION

        const { signIn } = useAuth()
        const result = await signIn('credentials', {
          username: 'jsmith',
          password: 'hunter2',
          redirect: false,
        })

        expect(result).toMatchObject({
          ok: true,
          status: 200,
          error: null,
          url: 'http://localhost:3000/',
        })
      })
    })
  })

  describe('signOut', () => {
    describe('with redirect: false', () => {
      it('clears session data and returns signout response', async () => {
        responses.session = AUTHENTICATED_SESSION
        const { getSession, signOut, status } = useAuth()
        await getSession()
        expect(status.value).toBe('authenticated')

        responses.signOut = { url: '/goodbye' }
        responses.session = {}
        const result = await signOut({ redirect: false })

        expect(status.value).toBe('unauthenticated')
        expect(result).toEqual({ url: '/goodbye' })
      })

      it('uses custom callbackUrl', async () => {
        responses.signOut = { url: '/custom-bye' }
        responses.session = {}

        const { signOut } = useAuth()
        const result = await signOut({
          redirect: false,
          callbackUrl: '/custom-bye',
        })

        expect(result).toEqual({ url: '/custom-bye' })
      })
    })

    describe('with redirect: true (default)', () => {
      it('sets SSR redirect to signout url', async () => {
        responses.signOut = { url: '/goodbye' }

        const { signOut } = useAuth()
        await signOut()

        expect(nuxtApp.ssrContext?._renderResponse).toMatchObject({
          statusCode: 302,
          headers: { location: '/goodbye' },
        })
      })

      it('falls back to callbackUrl when server returns no url', async () => {
        responses.signOut = {} as { url: string }

        const { signOut } = useAuth()
        await signOut({ callbackUrl: '/fallback' })

        expect(nuxtApp.ssrContext?._renderResponse).toMatchObject({
          statusCode: 302,
        })
      })

      it('uses custom callbackUrl for redirect', async () => {
        responses.signOut = { url: '/custom-logout' }

        const { signOut } = useAuth()
        await signOut({ callbackUrl: '/custom-logout' })

        expect(nuxtApp.ssrContext?._renderResponse).toMatchObject({
          statusCode: 302,
          headers: { location: '/custom-logout' },
        })
      })
    })

    describe('with missing CSRF token', () => {
      it('throws an error', async () => {
        responses.csrf = { csrfToken: null }

        const { signOut } = useAuth()
        await expect(signOut()).rejects.toThrow(
          'Could not fetch CSRF Token for signing out',
        )
      })
    })
  })

  describe('refresh', () => {
    it('is an alias for getSession', async () => {
      responses.session = AUTHENTICATED_SESSION

      const { refresh, status } = useAuth()
      await refresh()

      expect(status.value).toBe('authenticated')
    })
  })
})
