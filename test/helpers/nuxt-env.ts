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

/** Keyed reactive state backed by a simple Map — mirrors Nuxt's `useState`. */
export function useState<T>(key: string, init?: () => T): Ref<T> {
  if (!stateMap.has(key)) {
    stateMap.set(key, ref(init?.()) as Ref)
  }
  return stateMap.get(key) as Ref<T>
}

/** Subset of the real NuxtApp shape needed by composables under test. */
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

/** Returns the NuxtApp instance set via {@link _setNuxtApp}. */
export function useNuxtApp(): NuxtApp {
  if (!_nuxtApp) {
    throw new Error('Nuxt app not set. Call _setNuxtApp() in test setup.')
  }
  return _nuxtApp
}

/** Executes `fn` — the real `callWithNuxt` sets context; here it just calls through. */
export function callWithNuxt<T>(
  _nuxt: NuxtApp,
  fn: (...args: unknown[]) => T,
  args?: unknown[],
): T {
  return args ? fn(...args) : fn()
}

let _runtimeConfig: Record<string, unknown> | null = null

/** Returns the runtime config set via {@link _setRuntimeConfig}. */
export function useRuntimeConfig(): Record<string, unknown> {
  if (!_runtimeConfig) {
    throw new Error(
      'Runtime config not set. Call _setRuntimeConfig() in test setup.',
    )
  }
  return _runtimeConfig
}

let _requestURL = new URL('http://localhost:3000/')

/** Returns the request URL set via {@link _setRequestURL}. */
export function useRequestURL(): URL {
  return _requestURL
}

/** Stub router with minimal `resolve` and `createHref` implementations. */
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

/** Creates an Error with an optional `statusCode`, matching Nuxt's `createError`. */
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

/** Sets the NuxtApp instance returned by {@link useNuxtApp}. */
export function _setNuxtApp(app: NuxtApp) {
  _nuxtApp = app
}

/** Sets the runtime config returned by {@link useRuntimeConfig}. */
export function _setRuntimeConfig(config: Record<string, unknown>) {
  _runtimeConfig = config
}

/** Sets the URL returned by {@link useRequestURL}. */
export function _setRequestURL(url: URL) {
  _requestURL = url
}

/** Clears all state — call in `beforeEach` to isolate tests. */
export function _resetState() {
  stateMap.clear()
  _nuxtApp = null
  _runtimeConfig = null
  _requestURL = new URL('http://localhost:3000/')
}
