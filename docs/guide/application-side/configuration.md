---
title: Configuration
group: Application Side
children:
  - ./protecting-pages.md
  - ./session-access.md
---

# Configuration

NuxtAuth offers a wide range of configuration options that can be defined
inside the `nuxt.config.ts`. You can find an example of a fully configured
`authjs` app below:

```ts
export default defineNuxtConfig({
  modules: ['@zitadel/nuxt-auth'],
  auth: {
    isEnabled: true,
    disableServerSideAuth: false,
    originEnvKey: 'AUTH_ORIGIN',
    baseURL: 'http://localhost:3000/api/auth',
    provider: {
      /* your provider config */
    },
    sessionRefresh: {
      enablePeriodically: true,
      enableOnWindowFocus: true,
    },
  },
})
```

## `isEnabled`

- **Type**: `boolean`
- **Default**: `true`

Whether the module is enabled at all.

## `originEnvKey`

- **Type**: `string`
- **Default**: `AUTH_ORIGIN`

The name of the environment variable that holds the full base URL of the application.
This is used to determine the base URL of your application in production.

By default, NuxtAuth will look at `AUTH_ORIGIN` environment variable and
`runtimeConfig.authOrigin`.

::: warning
Despite the name "origin", this variable expects the **full** base URL including
the pathname, e.g. `http://localhost:3000/api/auth`.
:::

::: tip
If you want to use `runtimeConfig` and `NUXT_` prefixed environment
variables, you need to make sure to also define the key inside
`runtimeConfig`, because otherwise Nuxt will not acknowledge your env
variable
([issue #906](https://github.com/sidebase/nuxt-auth/issues/906), read more
[here](https://nuxt.com/docs/guide/going-further/runtime-config#environment-variables)).

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  auth: {
    // NUXT_YOUR_ORIGIN=https://example.com/api/auth
    originEnvKey: 'NUXT_YOUR_ORIGIN',
  },
  runtimeConfig: {
    yourOrigin: '',
  },
})
```
:::

You can read additional information on `baseURL` determining in
the [URL resolution guide](../advanced/url-resolutions.md).

## `disableServerSideAuth`

- **Type**: `boolean`
- **Default**: `false`

Forces your server to send a "loading" authentication status on all requests,
thus prompting the client to do a fetch. If your website has caching, this
prevents the server from caching someone's authentication status. This affects
the entire site; for route-specific rules add `disableServerSideAuth` on
`routeRules`. Read more in the caching guide.

## `baseURL`

- **Type**: `string | undefined`

The full URL at which the app will run combined with the path to
authentication. You should only use `baseURL` if you want to set it statically
for your application.

You can read additional information on `baseURL` determining in
the [URL resolution guide](../advanced/url-resolutions.md).

> **Tip:** If you would like to overwrite the `baseURL` at runtime you can use
> the `originEnvKey` option.

## `provider`

- **Type**: `ProviderAuthjs`
- **Default**: `undefined`

Configuration of the authentication provider. See the Auth.js quick start
guide for configuration options.

## `sessionRefresh`

- **Type**: `SessionRefreshConfig`
- **Default**: `{ enablePeriodically: false, enableOnWindowFocus: true }`

Configuration of the application-side session. You can configure the following
attributes:

### `enablePeriodically`

- **Type**: `boolean | number`
- **Default**: `false`

Whether to refresh the session every `X` milliseconds. The refresh will only
happen if a session already exists. Setting this to a number `X` will refresh
the session every `X` milliseconds. Setting this to `true` is equivalent to
`enablePeriodically: 1000`, the session will be refreshed every second.
Setting this to `false` will turn the session refresh off.

### `enableOnWindowFocus`

- **Type**: `boolean`
- **Default**: `true`

Whether to refresh the session every time the browser window is refocused.

## Global authentication middleware

The module registers a global route middleware that protects all pages by
default. Individual pages can opt out by specifying
`definePageMeta({ auth: false })`.

Read more about protecting pages in the protecting pages guide.
