import { joinURL } from 'ufo'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveBaseURL } from '../src/runtime/shared/authJsClient'

/*
 * This spec file covers URL resolution for the `authjs` provider.
 * The `resolveBaseURL` function is called once during plugin setup to
 * determine the base URL passed to AuthJsClient. The `joinURL` call
 * replicates what AuthJsClient.url() does internally (without the
 * native URL wrapper).
 */

describe('endpoint path construction', () => {
  describe('relative baseURL', () => {
    it('default value', () => {
      expect(testResolve('/api/auth')).toBe('/api/auth/signin')
    })

    it('default value with relative endpoint path', () => {
      expect(testResolve('/api/auth', 'signin')).toBe('/api/auth/signin')
    })

    it('default value and long endpoint path', () => {
      expect(testResolve('/api/auth', '/long/signin/path')).toBe(
        '/api/auth/long/signin/path',
      )
    })

    it('default value and long relative endpoint path', () => {
      expect(testResolve('/api/auth', 'long/signin/path')).toBe(
        '/api/auth/long/signin/path',
      )
    })

    it('slash', () => {
      expect(testResolve('/')).toBe('/signin')
    })

    it('slash with relative endpoint path', () => {
      expect(testResolve('/', 'signin')).toBe('/signin')
    })

    it('empty', () => {
      expect(testResolve('')).toBe('/signin')
    })

    it('empty with relative endpoint path', () => {
      expect(testResolve('', 'signin')).toBe('/signin')
    })
  })

  describe('localhost baseURL', () => {
    it('only origin', () => {
      expect(testResolve('http://localhost:8080')).toBe('/signin')
    })

    it('only origin with relative endpoint path', () => {
      expect(testResolve('http://localhost:8080', 'signin')).toBe('/signin')
    })

    it('path', () => {
      expect(testResolve('http://localhost:8080/auth')).toBe('/auth/signin')
    })

    it('path with relative endpoint path', () => {
      expect(testResolve('http://localhost:8080/auth', 'signin')).toBe(
        '/auth/signin',
      )
    })

    it('path and slash', () => {
      expect(testResolve('http://localhost:8080/auth/')).toBe('/auth/signin')
    })

    it('path and slash with relative endpoint path', () => {
      expect(testResolve('http://localhost:8080/auth/', 'signin')).toBe(
        '/auth/signin',
      )
    })

    it('slash', () => {
      expect(testResolve('http://localhost:8080/')).toBe('/signin')
    })

    it('slash with relative endpoint path', () => {
      expect(testResolve('http://localhost:8080/', 'signin')).toBe('/signin')
    })
  })

  describe('external baseURL', () => {
    it('only origin', () => {
      expect(testResolve('https://example.com')).toBe('/signin')
    })

    it('only origin with relative endpoint path', () => {
      expect(testResolve('https://example.com', 'signin')).toBe('/signin')
    })

    it('path', () => {
      expect(testResolve('https://example.com/auth')).toBe('/auth/signin')
    })

    it('path with relative endpoint path', () => {
      expect(testResolve('https://example.com/auth', 'signin')).toBe(
        '/auth/signin',
      )
    })

    it('path and slash', () => {
      expect(testResolve('https://example.com/auth/')).toBe('/auth/signin')
    })

    it('path and slash with relative endpoint path', () => {
      expect(testResolve('https://example.com/auth/', 'signin')).toBe(
        '/auth/signin',
      )
    })

    it('slash', () => {
      expect(testResolve('https://example.com/')).toBe('/signin')
    })

    it('slash with relative endpoint path', () => {
      expect(testResolve('https://example.com/', 'signin')).toBe('/signin')
    })
  })

  describe('env variables', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('can override default', () => {
      vi.stubEnv('AUTH_ORIGIN', '/other')
      expect(testResolve('/api/auth')).toBe('/other/signin')
    })

    it('can override default with fully-specified URL', () => {
      vi.stubEnv('AUTH_ORIGIN', 'https://example.com/auth')
      expect(testResolve('/api/auth')).toBe('/auth/signin')
    })

    it('can override using different name', () => {
      vi.stubEnv('OTHER_ENV', '/other')
      expect(testResolve('/api/auth', undefined, 'OTHER_ENV')).toBe(
        '/other/signin',
      )
    })

    it('does not use AUTH_ORIGIN when other env key is given', () => {
      vi.stubEnv('AUTH_ORIGIN', '/other')
      expect(testResolve('/api/auth', undefined, 'OTHER_ENV')).toBe(
        '/api/auth/signin',
      )
    })

    it('can override using NUXT_PUBLIC_AUTH_BASE_URL', () => {
      vi.stubEnv('NUXT_PUBLIC_AUTH_BASE_URL', '/other')
      expect(testResolve(process.env.NUXT_PUBLIC_AUTH_BASE_URL as string)).toBe(
        '/other/signin',
      )
    })

    it('works with double assignment', () => {
      const initialBaseURL = 'https://example.com/api/auth'
      const newBaseURL = 'https://changed.example.com/auth/v2'
      const expectedNewBaseURL = '/auth/v2'
      const envName = 'AUTH_ORIGIN'
      vi.stubEnv(envName, newBaseURL)

      const runtimeConfig = mockRuntimeConfig(initialBaseURL, envName)

      const resolvedNewBaseURL = resolveBaseURL(runtimeConfig)
      expect(resolvedNewBaseURL).toBe(expectedNewBaseURL)

      vi.unstubAllEnvs()
      expect(resolveBaseURL(runtimeConfig)).not.toBe(expectedNewBaseURL)

      runtimeConfig.public.auth.baseURL = resolvedNewBaseURL

      const resolvedBaseURL = resolveBaseURL(runtimeConfig)
      expect(resolvedBaseURL).toBe(expectedNewBaseURL)
      const resolvedApiUrlPath = joinURL(resolvedBaseURL, '/')
      expect(resolvedApiUrlPath).toBe(expectedNewBaseURL)
    })
  })
})

function testResolve(
  desiredBaseURL: string,
  endpointPath = '/signin',
  envVariableName = 'AUTH_ORIGIN',
): string {
  const runtimeConfig = mockRuntimeConfig(desiredBaseURL, envVariableName)
  const baseURL = resolveBaseURL(runtimeConfig)
  return joinURL(baseURL, endpointPath)
}

function mockRuntimeConfig(desiredBaseURL: string, envVariableName: string) {
  return {
    public: {
      auth: {
        baseURL: desiredBaseURL,
        disableInternalRouting: false,
        originEnvKey: envVariableName,
      },
    },
  }
}
