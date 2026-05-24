// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

const refreshSpy = vi.fn()
const mockData = ref<Record<string, unknown> | null>(null)

vi.mock('#imports', () => ({
  useAuth: () => ({
    data: mockData,
    refresh: refreshSpy,
  }),
}))

// Import after mock so the module picks up our mock
const { DefaultRefreshHandler } =
  await import('../src/runtime/app/utils/refreshHandler')

beforeEach(() => {
  vi.useFakeTimers()
  refreshSpy.mockReset()
  mockData.value = null
})

afterEach(() => {
  vi.useRealTimers()
})

describe('DefaultRefreshHandler', () => {
  describe('init', () => {
    it('adds visibilitychange listener', () => {
      const addSpy = vi.spyOn(document, 'addEventListener')
      const handler = new DefaultRefreshHandler({
        enablePeriodically: false,
        enableOnWindowFocus: false,
      })

      handler.init()

      expect(addSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function),
        false,
      )

      handler.destroy()
      addSpy.mockRestore()
    })
  })

  describe('destroy', () => {
    it('removes visibilitychange listener', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener')
      const handler = new DefaultRefreshHandler({
        enablePeriodically: false,
        enableOnWindowFocus: false,
      })

      handler.init()
      handler.destroy()

      expect(removeSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function),
        false,
      )

      removeSpy.mockRestore()
    })

    it('stops periodic refresh after destroy', () => {
      mockData.value = { user: 'test' }
      const handler = new DefaultRefreshHandler({
        enablePeriodically: 5000,
        enableOnWindowFocus: false,
      })

      handler.init()
      vi.advanceTimersByTime(5000)
      expect(refreshSpy).toHaveBeenCalledTimes(1)

      handler.destroy()
      refreshSpy.mockReset()

      vi.advanceTimersByTime(10000)
      expect(refreshSpy).not.toHaveBeenCalled()
    })

    it('clears auth reference', () => {
      const handler = new DefaultRefreshHandler({
        enablePeriodically: false,
        enableOnWindowFocus: false,
      })

      handler.init()
      expect(handler.auth).toBeDefined()

      handler.destroy()
      expect(handler.auth).toBeUndefined()
    })
  })

  describe('periodic refresh', () => {
    it('calls refresh at specified interval when session exists', () => {
      mockData.value = { user: 'test' }
      const handler = new DefaultRefreshHandler({
        enablePeriodically: 3000,
        enableOnWindowFocus: false,
      })

      handler.init()

      vi.advanceTimersByTime(3000)
      expect(refreshSpy).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(3000)
      expect(refreshSpy).toHaveBeenCalledTimes(2)

      handler.destroy()
    })

    it('defaults to 1000ms when enablePeriodically is true', () => {
      mockData.value = { user: 'test' }
      const handler = new DefaultRefreshHandler({
        enablePeriodically: true,
        enableOnWindowFocus: false,
      })

      handler.init()

      vi.advanceTimersByTime(999)
      expect(refreshSpy).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(refreshSpy).toHaveBeenCalledTimes(1)

      handler.destroy()
    })

    it('does not set interval when enablePeriodically is false', () => {
      const handler = new DefaultRefreshHandler({
        enablePeriodically: false,
        enableOnWindowFocus: false,
      })

      handler.init()
      expect(handler.refetchIntervalTimer).toBeUndefined()

      vi.advanceTimersByTime(10000)
      expect(refreshSpy).not.toHaveBeenCalled()

      handler.destroy()
    })

    it('does not set interval when enablePeriodically is undefined', () => {
      const handler = new DefaultRefreshHandler({
        enablePeriodically: undefined,
        enableOnWindowFocus: false,
      })

      handler.init()
      expect(handler.refetchIntervalTimer).toBeUndefined()

      handler.destroy()
    })

    it('skips refresh when no session data', () => {
      mockData.value = null
      const handler = new DefaultRefreshHandler({
        enablePeriodically: 1000,
        enableOnWindowFocus: false,
      })

      handler.init()

      vi.advanceTimersByTime(5000)
      expect(refreshSpy).not.toHaveBeenCalled()

      handler.destroy()
    })

    it('clamps large intervals to MAX_SAFE_INTERVAL_MS', () => {
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
      mockData.value = { user: 'test' }

      const handler = new DefaultRefreshHandler({
        enablePeriodically: Number.MAX_SAFE_INTEGER,
        enableOnWindowFocus: false,
      })

      handler.init()

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        2147483647,
      )

      handler.destroy()
      setIntervalSpy.mockRestore()
    })
  })

  describe('visibilityHandler', () => {
    it('refreshes when tab becomes visible and session exists', () => {
      mockData.value = { user: 'test' }
      const handler = new DefaultRefreshHandler({
        enablePeriodically: false,
        enableOnWindowFocus: true,
      })

      handler.init()

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))

      expect(refreshSpy).toHaveBeenCalledTimes(1)

      handler.destroy()
    })

    it('does not refresh when tab is hidden', () => {
      mockData.value = { user: 'test' }
      const handler = new DefaultRefreshHandler({
        enablePeriodically: false,
        enableOnWindowFocus: true,
      })

      handler.init()

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))

      expect(refreshSpy).not.toHaveBeenCalled()

      handler.destroy()
    })

    it('does not refresh when enableOnWindowFocus is false', () => {
      mockData.value = { user: 'test' }
      const handler = new DefaultRefreshHandler({
        enablePeriodically: false,
        enableOnWindowFocus: false,
      })

      handler.init()

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))

      expect(refreshSpy).not.toHaveBeenCalled()

      handler.destroy()
    })

    it('does not refresh when no session data', () => {
      mockData.value = null
      const handler = new DefaultRefreshHandler({
        enablePeriodically: false,
        enableOnWindowFocus: true,
      })

      handler.init()

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))

      expect(refreshSpy).not.toHaveBeenCalled()

      handler.destroy()
    })
  })
})
