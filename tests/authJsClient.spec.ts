/**
 * Direct unit tests for the AuthJsClient class.
 *
 * Uses a real h3 server (same pattern as useAuth.spec.ts) to test class
 * methods directly without going through the useAuth composable layer.
 */
import { createServer, type Server } from 'node:http'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  createApp,
  createRouter as createH3Router,
  eventHandler,
  getQuery,
  getHeader,
  readBody,
  setCookie,
  toNodeListener,
} from 'h3'
import { $fetch } from 'ofetch'
import {
  AuthJsClient,
  FetchConfigurationError,
  type AuthJsClientDeps,
} from '../src/runtime/shared/authJsClient'
;(globalThis as unknown as Record<string, unknown>).$fetch = $fetch

const responses = {
  providers: {} as Record<string, unknown>,
  csrf: { csrfToken: 'test-csrf' },
  session: {} as Record<string, unknown>,
  sessionCookie: undefined as string | undefined,
  signIn: { url: 'http://localhost:3000/' } as Record<string, unknown>,
  signOut: { url: '/' } as { url: string },
}

let lastSignInEndpoint = ''
let lastSignInQuery: Record<string, string> = {}
let lastSessionQuery: Record<string, string> = {}
let lastRequestHeaders: Record<string, string | undefined> = {}
let lastSignOutBody: Record<string, string> = {}
let server: Server
let baseURL: string

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
    eventHandler((event) => {
      lastRequestHeaders = {
        cookie: getHeader(event, 'cookie'),
        host: getHeader(event, 'host'),
      }
      lastSessionQuery = getQuery(event) as Record<string, string>
      if (responses.sessionCookie) {
        setCookie(event, 'authjs.session-token', 'abc', {
          path: '/',
          httpOnly: true,
        })
      }
      return responses.session
    }),
  )
  router.post(
    '/api/auth/callback/**',
    eventHandler((event) => {
      lastSignInEndpoint = 'callback'
      lastSignInQuery = getQuery(event) as Record<string, string>
      return responses.signIn
    }),
  )
  router.post(
    '/api/auth/signin/**',
    eventHandler((event) => {
      lastSignInEndpoint = 'signin'
      lastSignInQuery = getQuery(event) as Record<string, string>
      return responses.signIn
    }),
  )
  router.post(
    '/api/auth/signout',
    eventHandler(async (event) => {
      const body = await readBody(event)
      lastSignOutBody =
        typeof body === 'string'
          ? Object.fromEntries(new URLSearchParams(body))
          : body
      return responses.signOut
    }),
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

function makeDeps(overrides: Partial<AuthJsClientDeps> = {}): AuthJsClientDeps {
  return {
    nuxt: { ssrContext: {} },
    getRequestCookies: async () => undefined,
    appendResponseCookies: () => {},
    ...overrides,
  }
}

beforeEach(() => {
  responses.providers = {
    credentials: {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
    },
    github: { id: 'github', name: 'GitHub', type: 'oauth' },
  }
  responses.csrf = { csrfToken: 'test-csrf' }
  responses.session = {}
  responses.signIn = { url: 'http://localhost:3000/' }
  responses.signOut = { url: '/' }
  lastSignInEndpoint = ''
  lastSignInQuery = {}
  lastSessionQuery = {}
  lastRequestHeaders = {}
  lastSignOutBody = {}
})

describe('AuthJsClient', () => {
  describe('URL helpers', () => {
    it('getErrorPageUrl returns correct path for internal routing', () => {
      const client = new AuthJsClient('/api/auth', makeDeps())
      expect(client.getErrorPageUrl()).toBe('/api/auth/error')
    })

    it('getSignInPageUrl returns signin path', () => {
      const client = new AuthJsClient('/api/auth', makeDeps())
      expect(client.getSignInPageUrl()).toBe('/api/auth/signin')
    })

    it('getSignInPageUrl appends callbackUrl query param', () => {
      const client = new AuthJsClient('/api/auth', makeDeps())
      const url = client.getSignInPageUrl('/dashboard')
      expect(url).toBe('/api/auth/signin?callbackUrl=%2Fdashboard')
    })

    it('returns full href for external routing', () => {
      const client = new AuthJsClient(
        'https://auth.example.com/api/auth',
        makeDeps(),
      )
      expect(client.getErrorPageUrl()).toBe(
        'https://auth.example.com/api/auth/error',
      )
      expect(client.getSignInPageUrl()).toBe(
        'https://auth.example.com/api/auth/signin',
      )
    })
  })

  describe('fetch behavior', () => {
    it('detects recursion for internal routing', async () => {
      const client = new AuthJsClient('/api/auth', {
        ...makeDeps(),
        nuxt: { ssrContext: { event: { path: '/api/auth/session' } } },
      })

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(client.getSession()).rejects.toThrow(FetchConfigurationError)

      errorSpy.mockRestore()
    })

    it('skips recursion detection for external routing', async () => {
      const client = new AuthJsClient(baseURL, {
        ...makeDeps(),
        nuxt: { ssrContext: { event: { path: '/api/auth/session' } } },
      })

      responses.session = { user: 'test' }
      const session = await client.getSession()
      expect(session).toEqual({ user: 'test' })
    })

    it('proxies cookies from request on server', async () => {
      const client = new AuthJsClient(baseURL, {
        ...makeDeps(),
        getRequestCookies: async () => 'session=abc123; csrf=xyz',
      })

      await client.getSession()

      expect(lastRequestHeaders.cookie).toBe('session=abc123; csrf=xyz')
    })

    it('forwards response cookies from session fetch', async () => {
      responses.session = { user: 'test' }
      responses.sessionCookie = 'authjs.session-token=abc; Path=/; HttpOnly'

      const appendSpy = vi.fn()
      const client = new AuthJsClient(baseURL, {
        ...makeDeps(),
        appendResponseCookies: appendSpy,
      })

      await client.getSession()

      expect(appendSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('authjs.session-token=abc'),
        ]),
      )

      responses.sessionCookie = undefined
    })
  })

  describe('getProviders', () => {
    it('returns the provider map', async () => {
      const client = new AuthJsClient(baseURL, makeDeps())
      const providers = await client.getProviders()

      expect(providers).toEqual({
        credentials: {
          id: 'credentials',
          name: 'Credentials',
          type: 'credentials',
        },
        github: { id: 'github', name: 'GitHub', type: 'oauth' },
      })
    })
  })

  describe('getSession', () => {
    it('returns session data', async () => {
      responses.session = {
        user: { name: 'Test' },
        expires: '2099-01-01',
      }

      const client = new AuthJsClient(baseURL, makeDeps())
      const session = await client.getSession()

      expect(session).toEqual({
        user: { name: 'Test' },
        expires: '2099-01-01',
      })
    })

    it('passes callbackUrl as query param', async () => {
      const client = new AuthJsClient(baseURL, makeDeps())
      await client.getSession('/after-signin')

      expect(lastSessionQuery.callbackUrl).toBe('/after-signin')
    })
  })

  describe('getCsrfToken', () => {
    it('returns just the token string', async () => {
      responses.csrf = { csrfToken: 'my-csrf-token-123' }

      const client = new AuthJsClient(baseURL, makeDeps())
      const token = await client.getCsrfToken()

      expect(token).toBe('my-csrf-token-123')
    })
  })

  describe('signIn', () => {
    it('uses /callback endpoint for credentials provider', async () => {
      const client = new AuthJsClient(baseURL, makeDeps())
      const body = new URLSearchParams({
        csrfToken: 'test',
        callbackUrl: '/',
        json: 'true',
      })

      await client.signIn('credentials', 'credentials', body)

      expect(lastSignInEndpoint).toBe('callback')
    })

    it('uses /signin endpoint for OAuth providers', async () => {
      const client = new AuthJsClient(baseURL, makeDeps())
      const body = new URLSearchParams({
        csrfToken: 'test',
        callbackUrl: '/',
        json: 'true',
      })

      await client.signIn('github', 'oauth', body)

      expect(lastSignInEndpoint).toBe('signin')
    })

    it('passes authorizationParams as query parameters', async () => {
      const client = new AuthJsClient(baseURL, makeDeps())
      const body = new URLSearchParams({
        csrfToken: 'test',
        callbackUrl: '/',
        json: 'true',
      })

      await client.signIn('github', 'oauth', body, {
        scope: 'read:user',
        prompt: 'consent',
      })

      expect(lastSignInQuery).toMatchObject({
        scope: 'read:user',
        prompt: 'consent',
      })
    })

    it('returns sign-in response data', async () => {
      responses.signIn = { url: 'https://github.com/login/oauth' }

      const client = new AuthJsClient(baseURL, makeDeps())
      const body = new URLSearchParams({
        csrfToken: 'test',
        callbackUrl: '/',
        json: 'true',
      })

      const result = await client.signIn('github', 'oauth', body)
      expect(result).toEqual({ url: 'https://github.com/login/oauth' })
    })
  })

  describe('signOut', () => {
    it('posts csrf token and callbackUrl', async () => {
      const client = new AuthJsClient(baseURL, makeDeps())
      await client.signOut('my-csrf', '/goodbye')

      expect(lastSignOutBody).toMatchObject({
        csrfToken: 'my-csrf',
        callbackUrl: '/goodbye',
        json: 'true',
      })
    })

    it('returns signout response', async () => {
      responses.signOut = { url: '/logged-out' }

      const client = new AuthJsClient(baseURL, makeDeps())
      const result = await client.signOut('csrf', '/')

      expect(result).toEqual({ url: '/logged-out' })
    })
  })
})
