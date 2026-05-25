# Nuxt Auth

A [Nuxt](https://nuxt.com/) integration for auth
that provides seamless authentication with multiple providers, session
management, and route protection using Nuxt patterns.

This integration brings the power and flexibility of OAuth to Nuxt
applications with full TypeScript support, SSR-friendly session handling,
and Nuxt-native patterns including composables, middleware, and plugins.

### Why?

Modern web applications require robust, secure, and flexible authentication
systems. Integrating OAuth and session management with Nuxt applications requires careful consideration of
framework patterns, server-side rendering, and TypeScript integration.

However, a direct integration isn't always straightforward. Different types
of applications or deployment scenarios might warrant different approaches:

- **Framework Integration:** OAuth and auth flows operate at the HTTP level, while Nuxt
  uses composables, middleware, and plugins. A proper integration should bridge this
  gap by providing Nuxt-native primitives for authentication and authorization
  while maintaining the full OAuth provider ecosystem compatibility.
- **HTTP Request Handling:** Nuxt's universal rendering and server engine (Nitro)
  require clean request handling across SSR and client-side navigation. Teams need
  a unified approach that maintains performance while providing seamless OAuth
  integration.
- **Session and Request Lifecycle:** Proper session handling in Nuxt requires
  SSR-friendly composables and state management that work across server-rendered
  pages, client hydration, and client-side navigations.
- **Route Protection:** Many applications need fine-grained authorization
  beyond simple authentication. This integration provides global middleware,
  per-page overrides, and guest-only pages for protecting routes.

This integration, `@zitadel/nuxt-auth`, aims to provide the flexibility to
handle such scenarios. It allows you to leverage the full OAuth provider ecosystem
while maintaining Nuxt best practices, ultimately leading to a more
effective and less burdensome authentication implementation.

## Installation

Install using NPM by using the following command:

```sh
npm install @zitadel/nuxt-auth
```

## Usage

To use this integration, add the `@zitadel/nuxt-auth` module to your Nuxt application.
The module provides authentication infrastructure with configurable
routes, middleware, and composables.

You'll need to configure it with your OAuth providers and options. The
integration will then be available throughout your application via Nuxt's
module system.

First, add the module to your Nuxt config:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@zitadel/nuxt-auth'],
  auth: {
    originEnvKey: 'AUTH_URL',
    baseURL: '/api/auth',
    provider: {
      type: 'authjs',
      trustHost: false,
      defaultProvider: 'github',
    },
    sessionRefresh: {
      enablePeriodically: false,
      enableOnWindowFocus: true,
    },
  },
});
```

Then, create the auth handler in your server directory:

```ts
// server/api/auth/[...].ts
import { NuxtAuth } from '#auth';
import Zitadel from '@auth/core/providers/zitadel';

export const { handlers, getServerSession } = NuxtAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID,
      clientSecret: process.env.ZITADEL_CLIENT_SECRET,
      issuer: process.env.ZITADEL_DOMAIN,
    }),
  ],
});

export default handlers;
```

#### Using the Authentication System

The integration provides several functions and hooks for handling
authentication:

**Server Utilities:**

- `useAuth()`: Client-side composable providing reactive session state and auth methods
- `getServerSession(event)`: Server-side utility to retrieve the session in API routes
- `NuxtAuth(config)`: Server handler factory returning `{ handlers, getServerSession }`
- `definePageMeta({ auth })`: Per-page route protection configuration

**Basic Usage:**

```vue
<script setup>
const { status, data, signIn, signOut } = useAuth();

const user = computed(() => data.value?.user);
const isLoggedIn = computed(() => status.value === 'authenticated');
</script>

<template>
  <div v-if="status === 'loading'">Loading...</div>
  <div v-else-if="isLoggedIn">
    <p>Welcome, {{ user?.name }}!</p>
    <button @click="signOut()">Sign out</button>
  </div>
  <div v-else>
    <button @click="signIn('github')">Sign in with GitHub</button>
  </div>
</template>
```

Server-side session access in API routes:

```ts
// server/api/profile.ts
import { getServerSession } from '#auth';

export default eventHandler(async (event) => {
  const session = await getServerSession(event);

  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  return { user: session.user };
});
```

##### Example: Advanced Configuration with Multiple Providers

This example shows how to use the integration with multiple OAuth
providers and custom session configuration:

```ts
// server/api/auth/[...].ts
import { NuxtAuth } from '#auth';
import Zitadel from '@auth/core/providers/zitadel';
import Google from '@auth/core/providers/google';

export const { handlers, getServerSession } = NuxtAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID,
      clientSecret: process.env.ZITADEL_CLIENT_SECRET,
      issuer: process.env.ZITADEL_DOMAIN,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).roles = (user as any).roles;
      return token;
    },
    async session({ session, token }) {
      (session.user as any).roles = (token as any).roles as
        | string[]
        | undefined;
      return session;
    },
  },
});

export default handlers;
```

## Known Issues

- **Nuxt Module Required:** The integration is delivered as a Nuxt module and
  must be registered via the `modules` array in `nuxt.config.ts`. Without
  this, the auto-imported composables (`useAuth`) and server utilities
  (`#auth`) will not be available.
- **Environment Configuration:** The integration relies on `AUTH_SECRET` for
  signing sessions, and on `AUTH_URL` (or a custom `originEnvKey`) to
  determine the application origin in production. Ensure both are correctly
  set in your environment. During development, the origin is inferred
  automatically from incoming requests.
- **Callback URLs:** OAuth providers must be configured with the correct
  callback URL: `[origin]/api/auth/callback/[provider]` (or your custom
  `baseURL` path).
- **Type Augmentation:** If you attach additional properties (e.g., roles) to
  the user session object, extend your app's types accordingly so consumers of
  `session.user` remain type-safe.
- **Credentials Provider:** The credentials provider silently ignores
  `callbackUrl`. The integration accounts for this by disabling
  `addDefaultCallbackUrl` when `defaultProvider` is set to `'credentials'`.
- **Caching Compatibility:** When using Nuxt's route caching (SWR), set
  `disableServerSideAuth: true` on cached routes to prevent stale session
  data from being served from the cache.

## Useful links

- **[Nuxt](https://nuxt.com/):** The framework this integration targets.

## Contributing

If you have suggestions for how this integration could be improved, or
want to report a bug, open an issue — we'd love all and any contributions.

## Credits

This project is a fork of
[`@sidebase/nuxt-auth`](https://github.com/sidebase/nuxt-auth), originally
created by [SIDESTREAM GmbH](https://github.com/sidebase). The original work
is licensed under the MIT License. See the [NOTICE](./NOTICE) file for details.

## License

Apache-2.0
