// @vitest-environment happy-dom
/**
 * Tests for the session-refresh Nuxt plugin.
 *
 * The plugin is thin glue: it reads runtime config, creates a
 * {@link DefaultRefreshHandler}, and wires its lifecycle to Nuxt's
 * `app:mounted` and `vueApp.onUnmount` hooks. The handler itself is
 * tested exhaustively in `refreshHandler.spec.ts` — these tests only
 * verify the plugin's wiring by observing its effects (refresh calls,
 * ref resets) rather than spying on implementation details.
 *
 * `defineNuxtPlugin` is mocked as a passthrough so the default export
 * becomes the raw callback. A minimal fake `nuxtApp` captures the
 * registered hooks and exposes `triggerMount` / `triggerUnmount`
 * helpers to drive the lifecycle.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

const refreshFn = vi.fn()
const data = ref<Record<string, unknown> | null>(null)
const lastRefreshedAt = ref<Date | undefined>(new Date())

// noinspection JSUnusedGlobalSymbols
vi.mock('#imports', () => ({
  defineNuxtPlugin: (fn: (nuxtApp: FakeNuxtApp) => void) => fn,
  useRuntimeConfig: () => ({
    public: {
      auth: {
        sessionRefresh: {
          enablePeriodically: 5000,
          enableOnWindowFocus: true,
        },
      },
    },
  }),
  useAuth: () => ({
    data,
    refresh: refreshFn,
  }),
}))

vi.mock('../src/runtime/app/composables/useAuth', () => ({
  useAuthState: () => ({ data, lastRefreshedAt }),
}))

interface FakeNuxtApp {
  hook: (name: string, fn: () => void) => void
  vueApp: { onUnmount: (fn: () => void) => void }
}

function installPlugin() {
  let mountFn: (() => void) | undefined
  let unmountFn: (() => void) | undefined

  plugin({
    hook: (name: string, fn: () => void) => {
      if (name === 'app:mounted') mountFn = fn
    },
    vueApp: {
      onUnmount: (fn: () => void) => {
        unmountFn = fn
      },
    },
  })

  return {
    triggerMount() {
      expect(mountFn, 'app:mounted hook was not registered').toBeDefined()
      mountFn!()
    },
    triggerUnmount() {
      expect(unmountFn, 'onUnmount callback was not registered').toBeDefined()
      unmountFn!()
    },
  }
}

let plugin: (nuxtApp: FakeNuxtApp) => void

beforeEach(async () => {
  vi.useFakeTimers()
  refreshFn.mockReset()
  data.value = null
  lastRefreshedAt.value = new Date()

  const mod = await import('../src/runtime/app/plugins/session-refresh')
  plugin = mod.default as unknown as typeof plugin
})

afterEach(() => {
  vi.useRealTimers()
})

describe('session-refresh plugin', () => {
  it('refreshes the session periodically after mount', () => {
    data.value = { user: 'test' }
    const { triggerMount, triggerUnmount } = installPlugin()

    triggerMount()

    vi.advanceTimersByTime(5000)
    expect(refreshFn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(5000)
    expect(refreshFn).toHaveBeenCalledTimes(2)

    triggerUnmount()
  })

  it('refreshes the session on visibility change after mount', () => {
    data.value = { user: 'test' }
    const { triggerMount, triggerUnmount } = installPlugin()

    triggerMount()

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(refreshFn).toHaveBeenCalledTimes(1)

    triggerUnmount()
  })

  it('stops periodic refresh after unmount', () => {
    data.value = { user: 'test' }
    const { triggerMount, triggerUnmount } = installPlugin()

    triggerMount()
    vi.advanceTimersByTime(5000)
    expect(refreshFn).toHaveBeenCalledTimes(1)

    triggerUnmount()
    refreshFn.mockReset()

    vi.advanceTimersByTime(10000)
    expect(refreshFn).not.toHaveBeenCalled()
  })

  it('stops visibility refresh after unmount', () => {
    data.value = { user: 'test' }
    const { triggerMount, triggerUnmount } = installPlugin()

    triggerMount()
    triggerUnmount()

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(refreshFn).not.toHaveBeenCalled()
  })

  it('resets data to undefined on unmount', () => {
    data.value = { user: 'test' }
    const { triggerUnmount } = installPlugin()

    triggerUnmount()

    expect(data.value).toBeUndefined()
  })

  it('resets lastRefreshedAt to undefined on unmount', () => {
    expect(lastRefreshedAt.value).toBeInstanceOf(Date)
    const { triggerUnmount } = installPlugin()

    triggerUnmount()

    expect(lastRefreshedAt.value).toBeUndefined()
  })
})
