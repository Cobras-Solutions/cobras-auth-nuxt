# Cobras Auth System Architecture

## Overview

The Cobras Auth system provides SSO (Single Sign-On) authentication across multiple applications. It consists of two main components:

1. **cobras-auth** - The central authentication service (deployed on Railway)
2. **cobras-auth-nuxt** - A Nuxt module that integrates any Nuxt app with cobras-auth

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         YOUR NUXT APP (Vercel)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        cobras-auth-nuxt module                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│  │  │ Server Plugin │  │ Client Plugin│  │     Route Middleware     │   │    │
│  │  │ (SSR Auth)   │  │ (CSR Auth)   │  │ (cobras-auth/internal)   │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────── Server API ──────────────────────────┐│    │
│  │  │ /api/_cobras/verify   - Check local session cookie              ││    │
│  │  │ /api/_cobras/exchange - Exchange auth code for session          ││    │
│  │  │ /api/_cobras/logout   - Clear session cookie                    ││    │
│  │  │ /api/_cobras/refresh  - Refresh session (future)                ││    │
│  │  └─────────────────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Cookie: cobras_session (httpOnly, local domain)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ OAuth-style redirect
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COBRAS-AUTH SERVICE (Railway)                          │
│                                                                              │
│  ┌─────────────────────────── Auth Endpoints ─────────────────────────────┐ │
│  │ GET  /api/auth/authorize  - Start OAuth flow, check IP whitelist       │ │
│  │ POST /api/auth/token      - Exchange code for user info                │ │
│  │ GET  /api/auth/verify     - Verify JWT token (same-domain only)        │ │
│  │ POST /api/auth/check-access - Check site permissions                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────── Data Models ────────────────────────────────┐ │
│  │ User        - email, password, role, name                              │ │
│  │ Site        - domain, allowedIPs, settings                             │ │
│  │ AuthCode    - one-time codes for OAuth exchange                        │ │
│  │ AuditLog    - login events, token exchanges, etc.                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Cookie: access_token (JWT, cobras-auth domain only)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MONGODB (Atlas)                                   │
│  Collections: users, sites, authcodes, auditlogs, sessions                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Cross-Domain OAuth Flow

Since cookies can't be shared across domains (e.g., `your-app.vercel.app` can't read cookies from `cobras-auth.railway.app`), we use an OAuth-style authorization code flow:

```
1. User visits your-app.vercel.app
   │
   ▼
2. Server middleware checks cobras_session cookie
   │
   ├─► Cookie exists & valid → User is authenticated ✓
   │
   └─► No cookie → Redirect to cobras-auth
       │
       ▼
3. GET cobras-auth.railway.app/api/auth/authorize?redirect_uri=your-app.vercel.app
   │
   ├─► IP in whitelist → Auto-auth, generate code, redirect back
   │
   └─► IP not whitelisted → Show login page
       │
       ▼
4. User logs in (or was auto-auth'd)
   │
   ▼
5. Redirect: your-app.vercel.app?code=abc123
   │
   ▼
6. Client plugin detects ?code in URL
   │
   ▼
7. POST /api/_cobras/exchange { code: "abc123" }
   │
   ▼
8. Exchange endpoint calls cobras-auth/api/auth/token
   │
   ▼
9. cobras-auth validates code, returns user info
   │
   ▼
10. Exchange endpoint sets cobras_session cookie (local domain)
    │
    ▼
11. Client updates state, removes ?code from URL
    │
    ▼
12. User is now authenticated ✓
```

### Subsequent Requests

Once authenticated, the flow is simple:

```
1. User navigates to any page
   │
   ▼
2. Server plugin runs (SSR)
   │
   ▼
3. Calls /api/_cobras/verify with cookies
   │
   ▼
4. Verify endpoint reads cobras_session cookie
   │
   ├─► Valid session → Return user data
   │
   └─► Invalid/expired → Return 401
   │
   ▼
5. State populated with user (or null)
   │
   ▼
6. Page renders with correct auth state
```

## Module Components

### 1. Server Plugin (`auth.server.ts`)

Runs on every SSR request. Responsibilities:
- Initialize auth state
- In internal mode: Call `/api/_cobras/verify` to check session
- In public mode: Just mark as initialized (non-blocking)

```typescript
// Key logic
if (authConfig.mode === 'internal') {
  await checkAuth() // Blocking - waits for auth check
} else {
  state.value.initialized = true // Non-blocking
}
```

### 2. Client Plugin (`auth.client.ts`)

Runs on client-side hydration. Responsibilities:
- Detect `?code` in URL from OAuth redirect
- Exchange code for session via `/api/_cobras/exchange`
- Clean up URL after successful exchange
- Call `checkAuth()` if no code present

```typescript
// Key logic
if (code) {
  const success = await exchangeCode(code)
  if (success) {
    // Clean URL, update state
    window.history.replaceState({}, '', newUrl)
  }
} else {
  await checkAuth()
}
```

### 3. Route Middleware (`auth.ts`, `internal.ts`)

Protects routes based on configuration:

**`cobras-auth` middleware** (can be global):
- Public mode: Just passes through
- Internal mode: Redirects to auth if not authenticated

**`cobras-internal` middleware** (per-route):
- Always requires authentication
- Redirects to cobras-auth if not authenticated

```typescript
// Key logic - handles SSR code detection
const hasCode = to.query.code ||
  (typeof window === 'undefined' && useRequestURL().searchParams.has('code'))

if (hasCode) return // Let page load to handle code exchange
```

### 4. Server API Endpoints

**`/api/_cobras/verify`**
- Reads `cobras_session` cookie
- Decodes base64 JSON session data
- Returns `{ valid: true, user: {...} }` or throws 401

**`/api/_cobras/exchange`**
- Accepts `{ code: string }`
- Calls cobras-auth `/api/auth/token` to validate code
- Sets `cobras_session` cookie with user data
- Returns `{ success: true, user: {...} }`

**`/api/_cobras/logout`**
- Clears `cobras_session` cookie
- Returns `{ success: true }`

## Cookie Strategy

### Why Two Cookies?

| Cookie | Domain | Purpose |
|--------|--------|---------|
| `access_token` | cobras-auth.railway.app | JWT for direct cobras-auth requests |
| `cobras_session` | your-app.vercel.app | Local session for cross-domain apps |

Cross-domain cookies are blocked by browsers for security. The `cobras_session` cookie stores the user data obtained from the code exchange, allowing the Nuxt app to maintain its own session.

### Session Cookie Structure

```typescript
// Stored as base64-encoded JSON
{
  user: {
    id: "...",
    email: "user@example.com",
    name: "User Name",
    role: "admin" | "user"
  },
  expires_at: "2024-12-25T00:00:00.000Z"
}
```

## IP Auto-Auth

The `/api/auth/authorize` endpoint supports automatic authentication for whitelisted IPs:

```typescript
// In cobras-auth authorize.get.ts
const clientIP = getClientIP(event)
const site = await Site.findOne({ domain: redirectDomain })

if (site?.allowedIPs?.includes(clientIP)) {
  // Auto-auth: create code without login
  const code = await createAuthCode(autoAuthUser)
  return redirect(`${redirect_uri}?code=${code}`)
}

// Otherwise: show login page
return redirect(`/login?redirect=${encodeURIComponent(redirect_uri)}`)
```

## Modes of Operation

### Internal Mode

For admin dashboards and internal tools:

```typescript
cobrasAuth: {
  mode: 'internal',
  globalMiddleware: true,
  publicRoutes: ['/'],
}
```

- SSR blocks until auth is verified
- All routes protected by default
- Unauthenticated users redirected to cobras-auth

### Public Mode

For public sites with optional internal features:

```typescript
cobrasAuth: {
  mode: 'public',
  enableDevTools: true,
}
```

- SSR never blocks for auth
- Auth checked client-side
- Authenticated users can access dev tools

## State Management

Auth state is managed via Nuxt's `useState`:

```typescript
interface CobrasAuthState {
  user: CobrasUser | null
  initialized: boolean  // Has auth check completed?
  loading: boolean      // Is auth check in progress?
  error: string | null  // Last error message
}
```

State is shared between server and client via Nuxt's payload hydration.

## Error Handling

The module includes a built-in error page at `/_auth/error`:

- Shows when code exchange fails
- Displays error message from query params
- Provides "Try Again" and "Go Home" buttons

```
/_auth/error?error=Authentication%20Failed&message=Details...&redirect_uri=...
```

## Audit Logging

All authentication events are logged to MongoDB:

| Event | Description |
|-------|-------------|
| `login_success` | User logged in with password |
| `login_failed` | Failed login attempt |
| `auto_auth` | IP whitelist auto-auth (same domain) |
| `auto_auth_oauth` | IP whitelist auto-auth (OAuth flow) |
| `token_exchange` | OAuth code exchanged for session |
| `logout` | User logged out |

## Security Considerations

1. **httpOnly cookies**: `cobras_session` is httpOnly to prevent XSS
2. **Secure cookies**: Set to secure in production
3. **SameSite=Lax**: Prevents CSRF while allowing OAuth redirects
4. **One-time codes**: Auth codes expire after single use (5 min TTL)
5. **Session expiry**: Sessions expire after 24 hours

## Deployment

### cobras-auth (Railway)

```bash
cd cobras-auth
railway up
```

Environment variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for signing JWTs
- `NODE_ENV` - production

### Nuxt App (Vercel)

```bash
# Install module
pnpm add cobras-auth-nuxt

# Configure in nuxt.config.ts
# Deploy normally via git push
```

## Troubleshooting

### Redirect Loop

**Cause**: Code exchange succeeds but session not persisted
**Fix**: Ensure server plugin calls `/api/_cobras/verify` (local), not remote service

### 401 on Every Request

**Cause**: Cookie not being sent or read correctly
**Check**:
- Cookie domain matches request domain
- `credentials: 'include'` on fetch calls
- Cookie not blocked by browser

### 500 on Authorize

**Cause**: AuditLog validation error
**Fix**: Ensure all event types in enum match TypeScript type

### CORS Errors

**Cause**: Cross-domain API calls without proper headers
**Fix**: Add CORS headers to cobras-auth `nuxt.config.ts`:

```typescript
nitro: {
  routeRules: {
    '/api/auth/token': {
      cors: true,
      headers: { 'Access-Control-Allow-Origin': '*' }
    }
  }
}
```
