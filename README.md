# @cobras/auth-nuxt

Nuxt 3/4 module for integrating with the Cobras Auth service. Supports two modes:

- **Internal Mode**: Full SSO authentication for internal tools
- **Public Mode**: Public-facing sites with optional auth for dev tools/special features

## Installation

The module is installed straight from GitHub, pinned to a tag (`dist/` is committed):

```bash
pnpm add github:Cobras-Solutions/cobras-auth-nuxt#v1.0.12
```

Then set the session secret in the app's environment (Vercel / Railway / `.env`):

```bash
# any long random string, e.g. `openssl rand -base64 48`
COBRAS_AUTH_SESSION_SECRET=...
```

Without it the site still works, but **nobody can sign in**: no session cookie is
ever issued or accepted, and the server logs one warning at startup.

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

    // Internal mode: require a session on every /api/** request (default true)
    guardApiRoutes: true,
    // ...except these (same syntax as publicRoutes)
    publicApiRoutes: ['/api/health', '/api/webhooks/*'],

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

In internal mode the module also installs a **server-side API guard**: every request
under `/api/**` must carry a valid signed `cobras_session` cookie or it gets a `401`.
The module's own `/api/_cobras/*` endpoints and anything listed in `publicApiRoutes`
stay reachable. Set `guardApiRoutes: false` to opt out. Public mode never guards
API routes; use `requireCobrasSession()` in the handlers that need it.

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
| `sessionSecret` | `string` | - | HMAC secret for `cobras_session`; prefer the `COBRAS_AUTH_SESSION_SECRET` env var |
| `guardApiRoutes` | `boolean` | `true` | Internal mode: require a session on `/api/**` |
| `publicApiRoutes` | `string[]` | `[]` | Internal mode: API paths exempt from the guard |
| `debug` | `boolean` | `false` | Enable debug logging |

### Environment variables

| Variable | Purpose |
|----------|---------|
| `COBRAS_AUTH_SESSION_SECRET` | Server-only secret used to HMAC-SHA256 sign the `cobras_session` cookie. Required for sign-in to work. `NUXT_COBRAS_AUTH_SESSION_SECRET` (Nuxt runtime-config form) is honoured too. |

### Session cookie

`cobras_session` is host-only, `httpOnly`, `SameSite=Lax`, 24 h, `Secure` in production.
Its value is `v1.<base64url payload>.<base64url HMAC-SHA256>`; the payload is
`{ user, expires_at }`. The server accepts it only when the signature verifies against
`COBRAS_AUTH_SESSION_SECRET` (constant-time compare) and `expires_at` is in the future.
Anything else, including the unsigned base64 cookies written by versions before 1.0.12,
is treated as "no session". Logout clears it.

### Server helpers

| Export | Description |
|--------|-------------|
| `requireCobrasSession(event)` | Returns `{ user, expires_at }` or throws a `401` |
| `getCobrasSession(event)` | Returns the session or `null`, never throws |

Both are auto-imported in Nitro; explicit import: `import { requireCobrasSession } from 'cobras-auth-nuxt/server'`.

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

`requireCobrasSession(event)` and `getCobrasSession(event)` are auto-imported in
Nitro (and exported from `cobras-auth-nuxt/server`). They verify the signed
`cobras_session` cookie locally, with no network call.

```typescript
// server/api/admin/stats.get.ts
export default defineEventHandler(async (event) => {
  // Throws 401 when there is no valid signed session
  const session = requireCobrasSession(event)

  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  return { stats: '...' }
})
```

```typescript
// Non-throwing variant: null when there is no session
const session = getCobrasSession(event)
```

In internal mode you usually do not need to call these for plain "must be logged
in" checks, because the API guard already rejects anonymous requests; call them
when you need the user (role checks, audit logs).

## Upgrading

### 1.0.11 → 1.0.12 (signed session cookie, API guard)

1. Add `COBRAS_AUTH_SESSION_SECRET` to the app's environment **before** deploying the
   bump. Without it nobody can sign in (the site itself keeps working).
2. Bump the dependency to `github:Cobras-Solutions/cobras-auth-nuxt#v1.0.12`.
3. **Existing sessions end**: old unsigned cookies are rejected, so every internal user
   signs in once more (or is re-authenticated by the IP probe). Visitors on public-mode
   sites are not affected.
4. Internal-mode apps: `/api/**` now returns `401` without a session. List any route that
   must stay anonymous (health checks, webhooks) in `publicApiRoutes`.
5. Replace hand-rolled session checks in `server/` with `requireCobrasSession(event)`.

## Development

```bash
# Install dependencies (lockfile is pnpm v6 format: use pnpm 8, e.g. `npx pnpm@8 install`)
pnpm install

# Typecheck-ish + tests
pnpm test

# Build the module (dist/ is committed)
pnpm build

# Dev with playground
pnpm dev:prepare
pnpm dev
```

### Releasing

Consumers install from a git tag, so a release is a commit that includes `dist/`:

```bash
# bump "version" in package.json (dist/module.json follows on build)
pnpm test && pnpm build
git add -A && git commit -m "1.0.x - what changed"
git tag v1.0.x
git push origin main --tags
```

## License

MIT
