import type {
  DefaultRefreshHandlerConfig,
  RefreshHandler,
} from '../../shared/types'
import { useAuth } from '#imports'

/**
 * Default implementation of {@link RefreshHandler} that keeps the Auth.js
 * session fresh using two complementary strategies:
 *
 * - **Periodic polling** — when {@link DefaultRefreshHandlerConfig.enablePeriodically}
 *   is set, a `setInterval` timer calls {@link useAuth.refresh | refresh()} at the
 *   configured interval (default 1 000 ms when set to `true`).
 * - **Tab-focus refresh** — when {@link DefaultRefreshHandlerConfig.enableOnWindowFocus}
 *   is `true`, a `visibilitychange` listener triggers a refresh each time the
 *   browser tab becomes visible again.
 *
 * Both strategies skip the refresh when no session exists
 * (`data.value` is falsy). If both fire at the same time the worst outcome
 * is a redundant `GET /api/auth/session` — the responses are identical and
 * write to the same reactive ref, so there is no state-corruption risk.
 *
 * ### Lifecycle
 *
 * The {@link SessionRefreshPlugin | session-refresh plugin} calls
 * {@link init} after the initial session fetch and {@link destroy} when the
 * Vue app unmounts (or on HMR in development).
 *
 * @see {@link RefreshHandler} for the interface contract.
 */
export class DefaultRefreshHandler implements RefreshHandler {
  /** Cached return value of {@link useAuth}, used for session data and refresh. */
  auth?: ReturnType<typeof useAuth>

  /** Handle returned by `setInterval`, cleared in {@link destroy}. */
  refetchIntervalTimer?: ReturnType<typeof setInterval>

  /** Pre-bound reference to {@link visibilityHandler} so the same function
   *  can be passed to both `addEventListener` and `removeEventListener`. */
  private readonly boundVisibilityHandler: typeof this.visibilityHandler

  constructor(public config: DefaultRefreshHandlerConfig) {
    this.boundVisibilityHandler = this.visibilityHandler.bind(this)
  }

  /** Starts the periodic timer and visibility listener. */
  init(): void {
    this.auth = useAuth()

    document.addEventListener(
      'visibilitychange',
      this.boundVisibilityHandler,
      false,
    )

    const { enablePeriodically } = this.config

    if (enablePeriodically !== false && enablePeriodically !== undefined) {
      const intervalTime =
        enablePeriodically === true ? 1000 : safeTimerDelay(enablePeriodically)

      this.refetchIntervalTimer = setInterval(() => {
        if (this.auth?.data.value) {
          void this.auth.refresh()
        }
      }, intervalTime)
    }
  }

  /** Tears down the timer, removes the visibility listener, and releases state. */
  destroy(): void {
    document.removeEventListener(
      'visibilitychange',
      this.boundVisibilityHandler,
      false,
    )
    clearInterval(this.refetchIntervalTimer)
    this.auth = undefined
  }

  /** Handles `visibilitychange` events — refreshes the session when the tab
   *  becomes visible and {@link DefaultRefreshHandlerConfig.enableOnWindowFocus}
   *  is enabled. */
  visibilityHandler(): void {
    if (
      this.config?.enableOnWindowFocus &&
      document.visibilityState === 'visible' &&
      this.auth?.data.value
    ) {
      void this.auth.refresh()
    }
  }
}

// Fix for https://github.com/zitadel/nuxt-auth/issues/1014
// See https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval#return_value
const MAX_SAFE_INTERVAL_MS = 2147483647
function safeTimerDelay(milliseconds: number): number {
  return Math.min(milliseconds, MAX_SAFE_INTERVAL_MS)
}
