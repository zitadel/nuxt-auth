import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockConfig = {
  public: {
    auth: {
      baseURL: 'https://example.com/api/auth',
      originEnvKey: 'AUTH_ORIGIN',
    },
  },
}

// noinspection JSUnusedGlobalSymbols
vi.mock('nitropack/runtime/plugin', () => ({
  defineNitroPlugin: (fn: () => void) => fn,
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: () => mockConfig,
}))

const plugin = (await import('../src/runtime/server/plugins/assertOrigin'))
  .default as unknown as () => void

beforeEach(() => {
  mockConfig.public.auth.baseURL = 'https://example.com/api/auth'
  mockConfig.public.auth.originEnvKey = 'AUTH_ORIGIN'
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('assertOrigin plugin', () => {
  it('succeeds with valid full URL', () => {
    expect(() => plugin()).not.toThrow()
  })

  it('succeeds when env override provides valid URL', () => {
    mockConfig.public.auth.baseURL = '/api/auth'
    vi.stubEnv('AUTH_ORIGIN', 'https://override.example.com/auth')

    expect(() => plugin()).not.toThrow()
  })

  it('logs info in development when baseURL is path-only', () => {
    mockConfig.public.auth.baseURL = '/api/auth'
    mockConfig.public.auth.originEnvKey = ''
    vi.stubEnv('NODE_ENV', 'development')
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    expect(() => plugin()).not.toThrow()
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('AUTH_NO_ORIGIN'),
    )

    infoSpy.mockRestore()
  })

  it('throws in production when baseURL is path-only', () => {
    mockConfig.public.auth.baseURL = '/api/auth'
    mockConfig.public.auth.originEnvKey = ''
    vi.stubEnv('NODE_ENV', 'production')

    expect(() => plugin()).toThrow('AUTH_NO_ORIGIN')
  })

  it('logs info in development when baseURL is empty', () => {
    mockConfig.public.auth.baseURL = ''
    mockConfig.public.auth.originEnvKey = ''
    vi.stubEnv('NODE_ENV', 'development')
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    expect(() => plugin()).not.toThrow()
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('AUTH_NO_ORIGIN'),
    )

    infoSpy.mockRestore()
  })

  it('falls back to baseURL when originEnvKey is set but env is empty', () => {
    expect(() => plugin()).not.toThrow()
  })
})
