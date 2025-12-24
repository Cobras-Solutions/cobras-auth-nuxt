import { defineNuxtRouteMiddleware, useRuntimeConfig, useState, navigateTo } from '#imports'
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

  // Wait for auth to be initialized
  if (!state.value?.initialized) {
    return
  }

  // In public mode, we just silently check - no blocking
  if (authConfig.mode === 'public') {
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
    // Build the redirect URL
    // On server, we need to construct from request or use the path
    // On client, we use the full window.location.href
    let redirectUrl: string

    if (typeof window !== 'undefined') {
      redirectUrl = window.location.href
    } else {
      // Server-side: construct URL from path (will be relative)
      // The app should set a base URL in production
      redirectUrl = to.fullPath
    }

    // Use redirect_uri for OAuth-style flow
    return navigateTo(
      `${authConfig.authServiceUrl}/login?redirect_uri=${encodeURIComponent(redirectUrl)}`,
      { external: true }
    )
  }
})
