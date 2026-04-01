---
title: Introduction
group: Getting Started
children:
  - ./installation.md
---

# Introduction

NuxtAuth is an open source Nuxt module that provides authentication for Nuxt 4
applications. It wraps [Auth.js](https://authjs.dev/) (`@auth/core`) to bring
OAuth, credentials, and magic-link authentication to Nuxt with a native
developer experience.

Through a direct integration into Nuxt, you can access and utilize the user
sessions within your pages, components and composables directly.

## Features

### Authentication providers

- OAuth (eg. GitHub, Google, Twitter, Azure...)
- Custom OAuth (Add your own!)
- Credentials (username / email + password)
- Email Magic URLs

### Application Side Session Management

- Session fetching with `status`, `data` and `lastRefreshedAt`
- Methods to `getSession`, `getCsrfToken`, `getProviders`, `signIn` and
  `signOut`
- Full TypeScript support for all methods and properties

### Application protection

- Application-side middleware protection for the full application or specific
  pages
- Server-side middleware and endpoint protection
