import { defineNuxtRouteMiddleware, useRuntimeConfig, useState, navigateTo } from '#imports'
import type { CobrasAuthState } from '../../types'

/**
 * Auth middleware - behavior depends on mode:
 *
 * INTERNAL MODE:
 * - Redirects unauthenticated users to auth service
 * - Respects publicRoutes config
 *
 * PUBLIC MODE:
 * - Just checks auth status silently (no redirect)
 * - Makes auth state available for the page to use
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  const authConfig = config.public.cobrasAuth
  const state = useState<CobrasAuthState>('cobras-auth-state')

  // Wait for auth to be initialized
  if (!state.value?.initialized) {
    // Auth not initialized yet - plugin will handle it
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
    // Redirect to auth service
    const currentUrl = typeof window !== 'undefined'
      ? window.location.href
      : to.fullPath

    return navigateTo(
      `${authConfig.authServiceUrl}/login?redirect=${encodeURIComponent(currentUrl)}`,
      { external: true }
    )
  }
})
