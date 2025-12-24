# @cobras/auth-nuxt

Nuxt 3/4 module for integrating with the Cobras Auth service. Supports two modes:

- **Internal Mode**: Full SSO authentication for internal tools
- **Public Mode**: Public-facing sites with optional auth for dev tools/special features

## Installation

```bash
npm install @cobras/auth-nuxt
# or
pnpm add @cobras/auth-nuxt
```

## Setup

Add to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@cobras/auth-nuxt'],

  cobrasAuth: {
    // Required: URL of your Cobras Auth service
    authServiceUrl: 'https://cobras-auth-app-production.up.railway.app',

    // 'internal' = SSO for internal tools (blocks until auth checked)
    // 'public' = public site with optional auth (non-blocking)
    mode: 'public',

    // Optional: Register your site in cobras-auth admin
    siteId: 'your-site-id',
    // or
    siteDomain: 'your-site.com',

    // Enable global auth middleware (internal mode typically)
    globalMiddleware: false,

    // Routes that don't require auth (internal mode)
    publicRoutes: ['/', '/about', '/public/*'],

    // Enable dev tools for authenticated users
    enableDevTools: true,
    devToolsKey: 'ctrl+shift+d',

    // Debug logging
    debug: false,
  },
})
```

## Modes

### Public Mode (default)

For public-facing websites. Auth is checked on the client-side without blocking SSR.

```typescript
// nuxt.config.ts
cobrasAuth: {
  mode: 'public',
  enableDevTools: true, // Show dev panel for logged-in team members
}
```

Use cases:
- Marketing sites where team members can toggle feature flags
- Public apps where authenticated users get extra features
- Sites where you want to show dev tools to internal users

### Internal Mode

For internal tools requiring SSO. Auth is checked on the server before rendering.

```typescript
// nuxt.config.ts
cobrasAuth: {
  mode: 'internal',
  globalMiddleware: true,
  publicRoutes: ['/'], // Landing page is public
}
```

Use cases:
- Admin dashboards
- Internal tools
- Apps that require authentication for all routes

## Usage

### Composables

#### `useCobrasAuth()`

Main composable for auth state and actions.

```vue
<script setup>
const {
  user,           // Ref<CobrasUser | null>
  isAuthenticated, // ComputedRef<boolean>
  isInternalUser,  // ComputedRef<boolean> - alias for isAuthenticated
  isAdmin,        // ComputedRef<boolean>
  mode,           // 'internal' | 'public'
  checkAuth,      // () => Promise<void>
  login,          // (redirect?: string) => void
  logout,         // () => Promise<void>
} = useCobrasAuth()
</script>

<template>
  <div v-if="isAuthenticated">
    Welcome, {{ user?.name }}!
    <button @click="logout">Logout</button>
  </div>
  <div v-else>
    <button @click="login()">Login</button>
  </div>
</template>
```

#### `useCobrasMode()`

Check current mode and feature visibility.

```vue
<script setup>
const {
  mode,                // 'internal' | 'public'
  isInternalMode,      // boolean
  isPublicMode,        // boolean
  showInternalFeatures, // boolean - true if user is authenticated
  showAdminFeatures,   // boolean - true if user is admin
  devToolsEnabled,     // boolean
} = useCobrasMode()
</script>

<template>
  <AdminPanel v-if="showAdminFeatures" />
  <InternalTools v-if="showInternalFeatures" />
</template>
```

#### `useCobrasDevTools()`

Control dev tools panel and feature flags.

```vue
<script setup>
const {
  state,          // Ref<DevToolsState>
  isAvailable,    // ComputedRef<boolean>
  toggle,         // () => void
  open,           // () => void
  close,          // () => void
  setFeatureFlag, // (key: string, value: boolean) => void
  getFeatureFlag, // (key: string) => boolean
  toggleDebugMode, // () => void
} = useCobrasDevTools()

// Check a feature flag anywhere in your app
const showNewFeature = computed(() => getFeatureFlag('new-checkout-flow'))
</script>
```

### Global `$cobrasAuth`

Available via `useNuxtApp()` or in templates:

```vue
<template>
  <span v-if="$cobrasAuth.isAuthenticated">
    {{ $cobrasAuth.user?.name }}
  </span>
</template>
```

### Middleware

#### Global Middleware

Enable in config to protect all routes:

```typescript
cobrasAuth: {
  globalMiddleware: true,
  publicRoutes: ['/', '/login', '/public/*'],
}
```

#### Per-Route Protection

Use `cobras-internal` middleware on specific pages:

```vue
<!-- pages/admin.vue -->
<script setup>
definePageMeta({
  middleware: 'cobras-internal'
})
</script>
```

### Dev Tools Component

Add the dev tools panel to your app (only shows for authenticated users):

```vue
<!-- app.vue or layouts/default.vue -->
<template>
  <div>
    <NuxtPage />
    <CobrasDevTools />
  </div>
</template>
```

Toggle with keyboard shortcut (default: `Ctrl+Shift+D`).

## API Reference

### Module Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `authServiceUrl` | `string` | Railway URL | Cobras Auth service URL |
| `mode` | `'internal' \| 'public'` | `'public'` | Authentication mode |
| `siteId` | `string` | - | Site ID for permissions |
| `siteDomain` | `string` | - | Site domain for permissions |
| `globalMiddleware` | `boolean` | `false` | Enable auth on all routes |
| `publicRoutes` | `string[]` | `['/']` | Routes that don't require auth |
| `loginPath` | `string` | `'/login'` | Custom login page path |
| `enableDevTools` | `boolean` | `true` | Enable dev tools panel |
| `devToolsKey` | `string` | `'ctrl+shift+d'` | Keyboard shortcut |
| `cookieDomain` | `string` | - | Cookie domain override |
| `debug` | `boolean` | `false` | Enable debug logging |

### CobrasUser Type

```typescript
interface CobrasUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  canAccessAdmin?: boolean
  isAutoAuth?: boolean
}
```

## Examples

### Conditional Feature Based on Auth

```vue
<script setup>
const { isAuthenticated, isAdmin } = useCobrasAuth()
const { getFeatureFlag } = useCobrasDevTools()

const showBetaFeature = computed(() => {
  // Show to admins, or authenticated users with flag enabled
  return isAdmin.value || (isAuthenticated.value && getFeatureFlag('beta-feature'))
})
</script>
```

### Protected API Route

```typescript
// server/api/admin/stats.get.ts
export default defineEventHandler(async (event) => {
  // Verify auth via the proxy endpoint
  const auth = await $fetch('/api/_cobras/verify', {
    headers: { cookie: getHeader(event, 'cookie') || '' }
  }).catch(() => null)

  if (!auth?.valid || auth.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  return { stats: '...' }
})
```

## Development

```bash
# Install dependencies
pnpm install

# Build the module
pnpm prepack

# Dev with playground
pnpm dev:prepare
pnpm dev
```

## License

MIT
