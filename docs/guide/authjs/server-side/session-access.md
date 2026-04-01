---
title: Session Access
group: Auth.js Provider
category: Server Side
---

# Session Access and Route Protection

On the server side you can get access to the current session like this:

```ts
import { getServerSession } from '#auth'

export default eventHandler(async (event) => {
  const session = await getServerSession(event)
})
```

> **Note:** If you use
> [Nuxt's `useFetch`](https://nuxt.com/docs/api/composables/use-fetch) from
> your app-components to fetch data from an endpoint that uses
> `getServerSession` you will need to manually pass along cookies as
> [Nuxt 4 universal rendering](https://nuxt.com/docs/guide/concepts/rendering#universal-rendering)
> will not do this per-default when it runs on the server-side. Not passing
> along cookies will result in `getServerSession` returning `null` when it is
> called from the server-side as no auth cookies will exist. Here's an example
> that manually passes along cookies:
>
> ```ts
> const headers = useRequestHeaders(['cookie']) as HeadersInit
> const { data: session } = await useFetch('/api/protected', { headers })
> ```

## Endpoint Protection

To protect an endpoint, check the session after fetching it:

```ts
// file: ~/server/api/protected.get.ts
import { getServerSession } from '#auth'

export default eventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) {
    return { status: 'unauthenticated!' }
  }
  return { status: 'authenticated!' }
})
```

## Server Middleware

You can also use this in a
[Nuxt server middleware](https://nuxt.com/docs/guide/directory-structure/server#server-middleware)
to protect multiple pages at once and keep the authentication logic out of
your endpoints:

```ts
// file: ~/server/middleware/auth.ts
import { getServerSession } from '#auth'

export default eventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) {
    throw createError({
      message: 'Unauthenticated',
      statusCode: 403,
    })
  }
})
```
