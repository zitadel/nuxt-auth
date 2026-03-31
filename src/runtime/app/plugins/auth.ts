import { appendResponseHeader, getHeader } from 'h3'
import { parsePath, withoutBase, withoutTrailingSlash } from 'ufo'
import { createRouter, toRouteMatcher } from 'radix3'
import type { RouteMatcher } from 'radix3'
import type { RouteOptions } from '../../shared/types'
import {
  AuthJsClient,
  FetchConfigurationError,
  resolveBaseURL,
} from '../../shared/authJsClient'
import { useAuthState } from '../composables/useAuth'
import {
  defineNuxtPlugin,
  useAuth,
  useRequestEvent,
  useRuntimeConfig,
} from '#imports'
import { callWithNuxt } from '#app/nuxt'

let routeMatcher: RouteMatcher

function getNitroRouteRules(path: string): Partial<RouteOptions> {
  const runtimeConfig = useRuntimeConfig() as {
    nitro?: { routeRules?: Record<string, { auth?: RouteOptions }> }
    app?: { baseURL?: string }
  }
  const { nitro, app } = runtimeConfig

  if (!routeMatcher) {
    routeMatcher = toRouteMatcher(
      createRouter({
        routes: Object.fromEntries(
          Object.entries(nitro?.routeRules || {}).map(([path, rules]) => [
            withoutTrailingSlash(path),
            rules,
          ]),
        ),
      }),
    )
  }

  const options: Partial<RouteOptions> = {}

  const matches = routeMatcher
    .matchAll(
      withoutBase(
        withoutTrailingSlash(parsePath(path).pathname),
        app?.baseURL || '/',
      ),
    )
    .toReversed()

  for (const match of matches) {
    options.disableServerSideAuth ??= match.auth?.disableServerSideAuth
  }

  return options
}

export default defineNuxtPlugin(async (nuxtApp) => {
  const { data, loading } = useAuthState()

  const wholeRuntimeConfig = useRuntimeConfig()
  const runtimeConfig = wholeRuntimeConfig.public.auth

  const routeRules = import.meta.server
    ? getNitroRouteRules(nuxtApp._route.path)
    : {}

  if (import.meta.server) {
    runtimeConfig.baseURL = resolveBaseURL(wholeRuntimeConfig)
  }

  const client = new AuthJsClient(runtimeConfig.baseURL, {
    nuxt: nuxtApp,
    getRequestCookies: async () => {
      const event = await callWithNuxt(nuxtApp, useRequestEvent)
      return event?.node.req.headers.cookie
    },
    appendResponseCookies: (cookies: readonly string[]) => {
      if (nuxtApp.ssrContext?.event) {
        for (const cookie of cookies) {
          appendResponseHeader(nuxtApp.ssrContext.event, 'set-cookie', cookie)
        }
      }
    },
  })
  nuxtApp.provide('authClient', client)

  // Skip auth if we're prerendering
  let nitroPrerender = false
  if (nuxtApp.ssrContext) {
    nitroPrerender =
      getHeader(nuxtApp.ssrContext.event, 'x-nitro-prerender') !== undefined
  }

  const disableServerSideAuth =
    routeRules.disableServerSideAuth ??
    runtimeConfig?.disableServerSideAuth ??
    false

  if (disableServerSideAuth) {
    loading.value = true
  }

  const isErrorUrl = nuxtApp.ssrContext?.error === true
  const shouldFetchSession =
    typeof data.value === 'undefined' &&
    !nitroPrerender &&
    !disableServerSideAuth &&
    !isErrorUrl

  const { getSession } = useAuth()

  if (shouldFetchSession) {
    try {
      await getSession()
    } catch (e) {
      // Do not throw the configuration error as it can lead to infinite recursion
      if (!(e instanceof FetchConfigurationError)) {
        throw e
      }
    }
  }

  nuxtApp.hook('app:mounted', () => {
    if (disableServerSideAuth) {
      void getSession()
    }
  })
})
