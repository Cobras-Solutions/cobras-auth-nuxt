import { defineNuxtRouteMiddleware, useRuntimeConfig, useState, navigateTo, useRequestURL } from '#imports'
import type { CobrasAuthState } from '../../types'

/**
 * Auth middleware - behavior depends on mode:
 *
 * INTERNAL MODE:
 * - Redirects unauthenticated users to auth service
 * - Respects publicRoutes config
 * - Uses OAuth-style redirect_uri for cross-domain support
 *
 * PUBLIC MODE:
 * - Just checks auth status silently (no redirect)
 * - Makes auth state available for the page to use
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  const authConfig = config.public.cobrasAuth
  const state = useState<CobrasAuthState>('cobras-auth-state')

  // If there's a code in the query, let the page load so plugin can exchange it
  if (to.query.code) {
    return
  }

  // In public mode, we just silently check - no blocking
  if (authConfig.mode === 'public') {
    return
  }

  // In internal mode: if not initialized yet, we need to check or redirect
  // Don't let unauthenticated users through just because state isn't ready
  if (!state.value?.initialized) {
    // On server-side, the plugin should have already run and set initialized
    // If we get here and it's not initialized, something is wrong - redirect to be safe
    if (typeof window === 'undefined') {
      // Server-side: redirect to auth if not initialized (plugin should have run)
      const requestUrl = useRequestURL()
      return navigateTo(
        `${authConfig.authServiceUrl}/api/auth/authorize?redirect_uri=${encodeURIComponent(requestUrl.href)}`,
        { external: true }
      )
    }
    // Client-side: wait for initialization (plugin will handle it)
    return
  }

  // Internal mode - check if route requires auth
  const isPublicRoute = authConfig.publicRoutes.some((route: string) => {
    if (route.endsWith('*')) {
      return to.path.startsWith(route.slice(0, -1))
    }
    return to.path === route
  })

  if (isPublicRoute) {
    return
  }

  // Check if user is authenticated
  if (!state.value?.user) {
    // Build the full redirect URL (works on both server and client)
    let redirectUrl: string

    if (typeof window !== 'undefined') {
      // Client-side: use window.location
      redirectUrl = window.location.href
    } else {
      // Server-side: use useRequestURL() to get full URL including host
      const requestUrl = useRequestURL()
      redirectUrl = requestUrl.href
    }

    // Use authorize endpoint for OAuth-style flow (supports IP auto-auth)
    return navigateTo(
      `${authConfig.authServiceUrl}/api/auth/authorize?redirect_uri=${encodeURIComponent(redirectUrl)}`,
      { external: true }
    )
  }
})
