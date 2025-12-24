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

  // If there's a code in the query, let the page load so plugin can exchange it
  if (to.query.code) {
    return
  }

  // Wait for auth to be initialized
  if (!state.value?.initialized) {
    return
  }

  // Always require authentication for this middleware
  if (!state.value?.user) {
    const currentUrl = typeof window !== 'undefined'
      ? window.location.href
      : to.fullPath

    // Use redirect_uri for OAuth-style flow
    return navigateTo(
      `${authConfig.authServiceUrl}/login?redirect_uri=${encodeURIComponent(currentUrl)}`,
      { external: true }
    )
  }
})
