---
title: Quick Start
group: Auth.js Provider
children:
  - ./nuxt-auth-handler.md
  - ./session-data.md
  - ./custom-pages.md
  - ./server-side/session-access.md
  - ./server-side/rest-api.md
---

# AuthJS Quickstart

This guide is for setting up `@zitadel/nuxt-auth` with the Auth.js provider,
which is best suited for plug-and-play OAuth for established OAuth providers or
magic-url based sign-ins.

## Installation

Install `@auth/core` as a peer dependency alongside `@zitadel/nuxt-auth`:

```bash
# npm
npm i @auth/core

# pnpm
pnpm i @auth/core

# yarn
yarn add @auth/core
```

## Configuration

After installing `@zitadel/nuxt-auth` and `@auth/core`, configure NuxtAuth
inside your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@zitadel/nuxt-auth'],
  auth: {
    provider: {
      type: 'authjs',
      trustHost: false,
      defaultProvider: 'github',
      addDefaultCallbackUrl: true,
    },
  },
})
```

### `trustHost`

- **Type**: `boolean`
- **Default**: `false`

If set to `true`, `authjs` will use either the `x-forwarded-host` or `host`
headers instead of `auth.baseURL`. Make sure that reading `x-forwarded-host` on
your hosting platform can be trusted.

> **Warning:** This is an advanced option. Advanced options are passed the same
> way as basic options, but may have complex implications or side effects. You
> should try to avoid using advanced options unless you are very comfortable
> using them.

### `defaultProvider`

- **Type**: `string`
- **Default**: `undefined`

Select the default-provider to use when `signIn` is called. Setting this here
will also affect the global middleware behavior. For instance, when you set it
to `github` and the user is unauthorized, they will be directly forwarded to
the Github OAuth page instead of seeing the app-login page.

### `addDefaultCallbackUrl`

- **Type:** `boolean | string`
- **Default:** `true`

Whether to add a callbackUrl to sign in requests. Setting this to a
string-value will result in that being used as the callbackUrl path. Setting
this to `true` will result in the blocked original target path being chosen
(if it can be determined).

## NuxtAuthHandler

As a next step, create your NuxtAuthHandler under
`~/server/api/auth/[...].ts`. Inside it you can configure the authentication
provider you want to use, how the JWT Token is created and managed as well as
how your sessions will be composed. The NuxtAuthHandler will automatically
create all required API endpoints to handle authentication inside your
application.

The NuxtAuthHandler wraps the
[Auth.js `Auth` function](https://authjs.dev/getting-started/installation).
Inside the NuxtAuthHandler you can configure:

- **OAuth providers**: _How can users login to your application?_
- **Adapters**: _How are sessions saved? (e.g. JWT Token, Database etc.)_
- **JWT Encryption**: _How is the JWT Token encrypted and read?_
- **Callbacks**: _Hook into the authentication lifecycle hooks._

Begin by creating a new server route file in `~/server/api/auth/[...].ts`. You
can then begin adding your NuxtAuthHandler. The filename must be `[...].ts` -
this is a so-called "catch-all" route, read more in the
[Nuxt catch-all docs](https://nuxt.com/docs/guide/directory-structure/server#catch-all-route).

```ts
import { NuxtAuthHandler } from '#auth'

export default NuxtAuthHandler({
  // your authentication configuration here!
})
```

### Adding a provider

After creating your NuxtAuthHandler, you can begin by adding a provider. You
can find an overview of all the available providers in the
[Auth.js documentation](https://authjs.dev/getting-started/providers). For this
example we will add the GitHub provider.

```ts
import GitHub from '@auth/core/providers/github'
import { NuxtAuthHandler } from '#auth'

export default NuxtAuthHandler({
  // A secret string you define, to ensure correct encryption
  secret: 'your-secret-here',
  providers: [
    GitHub({
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    }),
  ],
})
```

The NuxtAuthHandler accepts all options that
[Auth.js](https://authjs.dev/reference/core) accepts for its configuration. Use
this place to configure authentication providers (OAuth, credential flow, ...),
your secret, add callbacks for authentication events, configure a custom logger
and more.

### Setting a secret

In addition to setting a provider, you also need to set a `secret` which is
used to encrypt the JWT Tokens. To avoid hard-coding of the secret you can make
it configurable at runtime by using an environment variable and exporting it at
runtime or by using the
[Nuxt `useRuntimeConfig`](https://nuxt.com/docs/api/composables/use-runtime-config)
(and then also setting the correct environment at runtime):

```ts
import { NuxtAuthHandler } from '#auth'

export default NuxtAuthHandler({
  // A secret string you define, to ensure correct encryption
  // AUTH_SECRET required in production
  secret: useRuntimeConfig().authSecret,

  // rest of your authentication configuration here!
})
```

<details>
<summary>Full code</summary>

```ts
// file: ~/server/api/auth/[...].ts
import GitHub from '@auth/core/providers/github'
import { NuxtAuthHandler } from '#auth'

export default NuxtAuthHandler({
  secret: useRuntimeConfig().authSecret,
  providers: [
    GitHub({
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    }),
  ],
})
```

</details>

## Next Steps

Congrats! You have now configured your first authentication provider and can
login to the application! We recommend the following next steps to continue
configuring your application:

- Define custom Session Data
- Add more providers in your NuxtAuthHandler
- Customize your Auth pages
