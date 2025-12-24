import { defineNuxtRouteMiddleware, useRuntimeConfig, useState, navigateTo } from '#imports'
import type { CobrasAuthState } from '../../types'

/**
 * Internal-only middleware
 *
 * Use this on specific pages that REQUIRE authentication,
 * even in public mode. Perfect for:
 * - Admin panels
 * - Internal dashboards
 * - Protected API pages
 *
 * Usage in page:
 * definePageMeta({
 *   middleware: 'cobras-internal'
 * })
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  const authConfig = config.public.cobrasAuth
  const state = useState<CobrasAuthState>('cobras-auth-state')

  // Wait for auth to be initialized
  if (!state.value?.initialized) {
    return
  }

  // Always require authentication for this middleware
  if (!state.value?.user) {
    const currentUrl = typeof window !== 'undefined'
      ? window.location.href
      : to.fullPath

    return navigateTo(
      `${authConfig.authServiceUrl}/login?redirect=${encodeURIComponent(currentUrl)}`,
      { external: true }
    )
  }
})
