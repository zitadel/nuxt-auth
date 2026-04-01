import { describe, it, expect, beforeEach } from 'vitest'
import {
  _resetState,
  _setNuxtApp,
  _setRequestURL,
  type NuxtApp,
} from './helpers/nuxt-env'
import { determineCallbackUrl } from '../src/runtime/app/utils/callbackUrl'

let nuxtApp: NuxtApp

beforeEach(() => {
  _resetState()

  nuxtApp = {
    ssrContext: {},
    _processingMiddleware: false,
    callHook: async () => {},
  }

  _setNuxtApp(nuxtApp)
})

describe('determineCallbackUrl', () => {
  describe('priority 1 — user-provided callbackUrl', () => {
    it('returns a relative path as-is', async () => {
      const result = await determineCallbackUrl(
        { provider: { addDefaultCallbackUrl: true } },
        '/dashboard',
      )
      expect(result).toBe('/dashboard')
    })

    it('returns an absolute URL unchanged', async () => {
      const result = await determineCallbackUrl(
        { provider: { addDefaultCallbackUrl: true } },
        'https://example.com/callback',
      )
      expect(result).toBe('https://example.com/callback')
    })

    it('takes priority over addDefaultCallbackUrl string', async () => {
      const result = await determineCallbackUrl(
        { provider: { addDefaultCallbackUrl: '/config-url' } },
        '/user-url',
      )
      expect(result).toBe('/user-url')
    })
  })

  describe('priority 2 — addDefaultCallbackUrl string', () => {
    it('returns the configured string when no user callbackUrl', async () => {
      const result = await determineCallbackUrl(
        { provider: { addDefaultCallbackUrl: '/configured' } },
        undefined,
      )
      expect(result).toBe('/configured')
    })

    it('returns absolute configured URL unchanged', async () => {
      const result = await determineCallbackUrl(
        { provider: { addDefaultCallbackUrl: 'https://example.com/home' } },
        undefined,
      )
      expect(result).toBe('https://example.com/home')
    })
  })

  describe('priority 3 — infer from request', () => {
    it('infers when inferFromRequest is true', async () => {
      _setRequestURL(new URL('http://localhost:3000/current-page'))

      const result = await determineCallbackUrl(
        { provider: { addDefaultCallbackUrl: false } },
        undefined,
        true,
      )
      expect(result).toBe('http://localhost:3000/current-page')
    })

    it('infers when addDefaultCallbackUrl is true and inferFromRequest is undefined', async () => {
      _setRequestURL(new URL('http://localhost:3000/some-page'))

      const result = await determineCallbackUrl(
        { provider: { addDefaultCallbackUrl: true } },
        undefined,
      )
      expect(result).toBe('http://localhost:3000/some-page')
    })

    it('does not infer when inferFromRequest is false', async () => {
      _setRequestURL(new URL('http://localhost:3000/some-page'))

      const result = await determineCallbackUrl(
        { provider: { addDefaultCallbackUrl: true } },
        undefined,
        false,
      )
      expect(result).toBeUndefined()
    })
  })

  describe('no callback', () => {
    it('returns undefined when addDefaultCallbackUrl is false and no user URL', async () => {
      const result = await determineCallbackUrl(
        { provider: { addDefaultCallbackUrl: false } },
        undefined,
      )
      expect(result).toBeUndefined()
    })

    it('returns undefined when addDefaultCallbackUrl is undefined and no user URL', async () => {
      const result = await determineCallbackUrl({ provider: {} }, undefined)
      expect(result).toBeUndefined()
    })

    it('returns undefined when provider config is missing', async () => {
      const result = await determineCallbackUrl({}, undefined)
      expect(result).toBeUndefined()
    })
  })
})
