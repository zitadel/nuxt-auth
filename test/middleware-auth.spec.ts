import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const mockStatus = ref<'authenticated' | 'unauthenticated'>('unauthenticated')
const mockSignIn = vi.fn().mockResolvedValue({ navigationResult: undefined })
const mockNavigateTo = vi.fn()
const mockAuthConfig = {
  provider: {
    addDefaultCallbackUrl: true as boolean | string,
  },
}

// noinspection JSUnusedGlobalSymbols
vi.mock('#imports', () => ({
  defineNuxtRouteMiddleware: (fn: (...args: unknown[]) => unknown) => fn,
  navigateTo: (...args: unknown[]) => mockNavigateTo(...args),
  useAuth: () => ({
    status: mockStatus,
    signIn: mockSignIn,
  }),
  useRuntimeConfig: () => ({
    public: {
      auth: mockAuthConfig,
    },
  }),
}))

const middleware = (await import('../src/runtime/app/middleware/auth'))
  .default as unknown as (to: RouteLike) => unknown

type RouteLike = {
  meta: { auth?: unknown }
  fullPath: string
  matched: unknown[]
}

function makeRoute(overrides: Partial<RouteLike> = {}): RouteLike {
  return {
    meta: {},
    fullPath: '/test-page',
    matched: [{}],
    ...overrides,
  }
}

beforeEach(() => {
  mockStatus.value = 'unauthenticated'
  mockSignIn.mockReset().mockResolvedValue({ navigationResult: undefined })
  mockNavigateTo.mockReset()
  mockAuthConfig.provider.addDefaultCallbackUrl = true
})

describe('auth middleware', () => {
  describe('meta normalization', () => {
    it('skips when auth is false', () => {
      const result = middleware(makeRoute({ meta: { auth: false } }))
      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('treats undefined auth as protected', async () => {
      const result = middleware(makeRoute({ meta: {} }))
      await result
      expect(mockSignIn).toHaveBeenCalled()
    })

    it('treats auth: true as protected', async () => {
      const result = middleware(makeRoute({ meta: { auth: true } }))
      await result
      expect(mockSignIn).toHaveBeenCalled()
    })
  })

  describe('legacy format', () => {
    it('unauthenticatedOnly: true → guest mode', () => {
      mockStatus.value = 'authenticated'
      middleware(makeRoute({ meta: { auth: { unauthenticatedOnly: true } } }))
      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })

    it('unauthenticatedOnly: true with navigateAuthenticatedTo', () => {
      mockStatus.value = 'authenticated'
      middleware(
        makeRoute({
          meta: {
            auth: {
              unauthenticatedOnly: true,
              navigateAuthenticatedTo: '/foo',
            },
          },
        }),
      )
      expect(mockNavigateTo).toHaveBeenCalledWith('/foo')
    })

    it('unauthenticatedOnly: false with navigateUnauthenticatedTo', () => {
      mockStatus.value = 'unauthenticated'
      middleware(
        makeRoute({
          meta: {
            auth: {
              unauthenticatedOnly: false,
              navigateUnauthenticatedTo: '/bar',
            },
          },
        }),
      )
      expect(mockNavigateTo).toHaveBeenCalledWith('/bar')
    })
  })

  describe('guest mode', () => {
    it('redirects authenticated user to redirectTo', () => {
      mockStatus.value = 'authenticated'
      middleware(
        makeRoute({
          meta: { auth: { mode: 'guest', redirectTo: '/home' } },
        }),
      )
      expect(mockNavigateTo).toHaveBeenCalledWith('/home')
    })

    it('redirects authenticated user to / when no redirectTo', () => {
      mockStatus.value = 'authenticated'
      middleware(
        makeRoute({
          meta: { auth: { mode: 'guest' } },
        }),
      )
      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })

    it('allows unauthenticated user through', () => {
      mockStatus.value = 'unauthenticated'
      const result = middleware(
        makeRoute({
          meta: { auth: { mode: 'guest' } },
        }),
      )
      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })

  describe('protected mode', () => {
    it('allows authenticated user through', () => {
      mockStatus.value = 'authenticated'
      const result = middleware(
        makeRoute({
          meta: { auth: { mode: 'protected' } },
        }),
      )
      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('allows unmatched routes (404) through when unauthenticated', () => {
      mockStatus.value = 'unauthenticated'
      const result = middleware(
        makeRoute({
          meta: { auth: { mode: 'protected' } },
          matched: [],
        }),
      )
      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('redirects to custom redirectTo when unauthenticated', () => {
      mockStatus.value = 'unauthenticated'
      middleware(
        makeRoute({
          meta: { auth: { mode: 'protected', redirectTo: '/login' } },
        }),
      )
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })

    it('calls signIn with fullPath as callbackUrl when addDefaultCallbackUrl is true', async () => {
      mockStatus.value = 'unauthenticated'
      await middleware(
        makeRoute({
          meta: { auth: { mode: 'protected' } },
          fullPath: '/secret-page',
        }),
      )
      expect(mockSignIn).toHaveBeenCalledWith(undefined, {
        error: 'SessionRequired',
        callbackUrl: '/secret-page',
      })
    })

    it('calls signIn with undefined callbackUrl when addDefaultCallbackUrl is false', async () => {
      mockAuthConfig.provider.addDefaultCallbackUrl = false

      mockStatus.value = 'unauthenticated'
      await middleware(
        makeRoute({
          meta: { auth: { mode: 'protected' } },
        }),
      )
      expect(mockSignIn).toHaveBeenCalledWith(undefined, {
        error: 'SessionRequired',
        callbackUrl: undefined,
      })
    })

    it('calls signIn with string callbackUrl when addDefaultCallbackUrl is a string', async () => {
      mockAuthConfig.provider.addDefaultCallbackUrl = '/custom-callback'

      mockStatus.value = 'unauthenticated'
      await middleware(
        makeRoute({
          meta: { auth: { mode: 'protected' } },
        }),
      )
      expect(mockSignIn).toHaveBeenCalledWith(undefined, {
        error: 'SessionRequired',
        callbackUrl: '/custom-callback',
      })
    })

    it('returns navigationResult from signIn', async () => {
      mockSignIn.mockResolvedValue({ navigationResult: '/redirected' })
      mockStatus.value = 'unauthenticated'
      const result = await middleware(
        makeRoute({
          meta: { auth: { mode: 'protected' } },
        }),
      )
      expect(result).toBe('/redirected')
    })

    it('returns true when signIn returns falsy', async () => {
      mockSignIn.mockResolvedValue(null)
      mockStatus.value = 'unauthenticated'
      const result = await middleware(
        makeRoute({
          meta: { auth: { mode: 'protected' } },
        }),
      )
      expect(result).toBe(true)
    })
  })
})
