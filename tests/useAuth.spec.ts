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
  providers: {} as Record<string, unknown>,
  csrf: { csrfToken: 'test-csrf-token' },
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
    it('authenticates with valid credentials', async () => {
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

    it('reports credential errors', async () => {
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

    it('returns InvalidProvider for unknown provider', async () => {
      const { signIn } = useAuth()
      const result = await signIn('nonexistent')

      expect(result.error).toBe('InvalidProvider')
      expect(result.ok).toBe(false)
      expect(result.status).toBe(400)
    })

    it('forwards authorisationParams as query parameters', async () => {
      responses.signIn = { url: 'https://github.com/login/oauth/authorize' }

      const { signIn } = useAuth()
      await signIn('github', {}, { scope: 'read:user read:org' })

      expect(lastSignInQuery).toMatchObject({ scope: 'read:user read:org' })
    })

    it('sets SSR redirect for OAuth providers', async () => {
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
        headers: { location: 'https://github.com/login/oauth/authorize' },
      })
    })
  })

  describe('signOut', () => {
    it('clears session data', async () => {
      responses.session = AUTHENTICATED_SESSION
      const { getSession, signOut, status } = useAuth()
      await getSession()
      expect(status.value).toBe('authenticated')

      responses.signOut = { url: '/' }
      responses.session = {}
      await signOut({ redirect: false })
      expect(status.value).toBe('unauthenticated')
    })

    it('returns signout response', async () => {
      responses.signOut = { url: '/goodbye' }
      const { signOut } = useAuth()
      const result = await signOut({ redirect: false })

      expect(result).toEqual({ url: '/goodbye' })
    })

    it('sets SSR redirect when redirect is true', async () => {
      responses.signOut = { url: '/goodbye' }

      const { signOut } = useAuth()
      await signOut()

      expect(nuxtApp.ssrContext?._renderResponse).toMatchObject({
        statusCode: 302,
        headers: { location: '/goodbye' },
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
