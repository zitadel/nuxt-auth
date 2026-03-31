// noinspection JSUnusedGlobalSymbols

/**
 * Minimal, real implementations of Nuxt runtime primitives.
 *
 * vitest `resolve.alias` maps `#imports`, `#app`, and `#app/nuxt` to this
 * file so that composables like `useAuth` can be imported and tested in a
 * plain vitest environment without the full Nuxt runtime.
 *
 * Every implementation uses real Vue reactivity — no stubs or mocks.
 */
import { ref, type Ref } from 'vue'

const stateMap = new Map<string, Ref>()

export function useState<T>(key: string, init?: () => T): Ref<T> {
  if (!stateMap.has(key)) {
    stateMap.set(key, ref(init?.()) as Ref)
  }
  return stateMap.get(key) as Ref<T>
}

export interface NuxtApp {
  $authClient?: unknown
  ssrContext?: {
    _renderResponse?: {
      statusCode: number
      body: string
      headers: Record<string, string>
    }
    event?: unknown
    error?: boolean
  }
  _processingMiddleware?: boolean
  callHook: (name: string) => Promise<void>
  [key: string]: unknown
}

let _nuxtApp: NuxtApp | null = null

export function useNuxtApp(): NuxtApp {
  if (!_nuxtApp) {
    throw new Error('Nuxt app not set. Call _setNuxtApp() in test setup.')
  }
  return _nuxtApp
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function callWithNuxt<T>(
  _nuxt: any,
  fn: (...args: any[]) => T,
  args?: any[],
): T {
  return args ? fn(...args) : fn()
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _runtimeConfig: any = null

export function useRuntimeConfig() {
  if (!_runtimeConfig) {
    throw new Error(
      'Runtime config not set. Call _setRuntimeConfig() in test setup.',
    )
  }
  return _runtimeConfig
}

let _requestURL = new URL('http://localhost:3000/')

export function useRequestURL(): URL {
  return _requestURL
}

export function useRouter() {
  return {
    resolve: (path: string) => ({ fullPath: path }),
    options: {
      history: {
        createHref: (path: string) => path,
      },
    },
  }
}

export function createError(
  input: string | { status?: number; statusCode?: number; message?: string },
) {
  if (typeof input === 'string') {
    return new Error(input)
  }
  const error = new Error(input.message) as Error & { statusCode?: number }
  error.statusCode = input.status || input.statusCode
  return error
}

export function _setNuxtApp(app: NuxtApp) {
  _nuxtApp = app
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function _setRuntimeConfig(config: any) {
  _runtimeConfig = config
}

export function _setRequestURL(url: URL) {
  _requestURL = url
}

export function _resetState() {
  stateMap.clear()
  _nuxtApp = null
  _runtimeConfig = null
  _requestURL = new URL('http://localhost:3000/')
}
