import { defineNuxtRouteMiddleware, useRuntimeConfig, useState, navigateTo, useRequestURL } from '#imports'
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

  // If not initialized, redirect on server-side (don't let unauthed users through)
  if (!state.value?.initialized) {
    if (typeof window === 'undefined') {
      const requestUrl = useRequestURL()
      return navigateTo(
        `${authConfig.authServiceUrl}/api/auth/authorize?redirect_uri=${encodeURIComponent(requestUrl.href)}`,
        { external: true }
      )
    }
    return
  }

  // Always require authentication for this middleware
  if (!state.value?.user) {
    // Build the full redirect URL (works on both server and client)
    let currentUrl: string

    if (typeof window !== 'undefined') {
      currentUrl = window.location.href
    } else {
      const requestUrl = useRequestURL()
      currentUrl = requestUrl.href
    }

    // Use authorize endpoint for OAuth-style flow (supports IP auto-auth)
    return navigateTo(
      `${authConfig.authServiceUrl}/api/auth/authorize?redirect_uri=${encodeURIComponent(currentUrl)}`,
      { external: true }
    )
  }
})
