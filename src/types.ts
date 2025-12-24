export interface CobrasUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  canAccessAdmin?: boolean
  isAutoAuth?: boolean
}

export interface CobrasAuthState {
  /** Current authenticated user, null if not logged in */
  user: CobrasUser | null
  /** Whether auth state has been checked */
  initialized: boolean
  /** Whether a check is in progress */
  loading: boolean
  /** Last error if any */
  error: string | null
}

export type AuthMode = 'internal' | 'public'

export interface ModuleOptions {
  /**
   * URL of the Cobras auth service
   * @default 'https://cobras-auth-app-production.up.railway.app'
   */
  authServiceUrl: string

  /**
   * Authentication mode:
   * - 'internal': Full SSO - all protected routes require authentication
   * - 'public': Public site with optional auth for special features/dev tools
   * @default 'public'
   */
  mode: AuthMode

  /**
   * Site ID registered in cobras-auth (for site-specific permissions)
   */
  siteId?: string

  /**
   * Site domain registered in cobras-auth (alternative to siteId)
   */
  siteDomain?: string

  /**
   * Enable auth middleware on all routes by default
   * In 'internal' mode, this protects all routes
   * In 'public' mode, this just checks auth status silently
   * @default false
   */
  globalMiddleware: boolean

  /**
   * Routes that don't require authentication (only applies in 'internal' mode)
   * @default ['/']
   */
  publicRoutes: string[]

  /**
   * Custom login page path (if you have one locally)
   * Otherwise redirects to auth service
   * @default '/login'
   */
  loginPath: string

  /**
   * Enable dev tools panel for authenticated users (public mode)
   * @default true
   */
  enableDevTools: boolean

  /**
   * Keyboard shortcut to toggle dev tools
   * @default 'ctrl+shift+d'
   */
  devToolsKey: string

  /**
   * Cookie domain for auth cookies (usually set automatically)
   */
  cookieDomain?: string

  /**
   * Enable debug logging
   * @default false
   */
  debug: boolean
}

// Augment Nuxt types
declare module '@nuxt/schema' {
  interface RuntimeConfig {
    cobrasAuth: {
      cookieDomain?: string
    }
  }
  interface PublicRuntimeConfig {
    cobrasAuth: {
      authServiceUrl: string
      mode: AuthMode
      siteId?: string
      siteDomain?: string
      publicRoutes: string[]
      loginPath: string
      enableDevTools: boolean
      devToolsKey: string
      debug: boolean
    }
  }
}

declare module '#app' {
  interface NuxtApp {
    $cobrasAuth: {
      user: Ref<CobrasUser | null>
      isAuthenticated: ComputedRef<boolean>
      isInternalUser: ComputedRef<boolean>
      isAdmin: ComputedRef<boolean>
      mode: AuthMode
      checkAuth: () => Promise<void>
      login: (redirect?: string) => void
      logout: () => Promise<void>
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $cobrasAuth: {
      user: Ref<CobrasUser | null>
      isAuthenticated: ComputedRef<boolean>
      isInternalUser: ComputedRef<boolean>
      isAdmin: ComputedRef<boolean>
      mode: AuthMode
      checkAuth: () => Promise<void>
      login: (redirect?: string) => void
      logout: () => Promise<void>
    }
  }
}

// For TypeScript imports
import type { Ref, ComputedRef } from 'vue'
