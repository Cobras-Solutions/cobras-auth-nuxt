import { defineNuxtPlugin, useRuntimeConfig, useState, computed, useRequestHeaders } from '#imports'
import type { CobrasUser, CobrasAuthState } from '../../types'

/**
 * Server-side auth plugin
 *
 * PERFORMANCE:
 * - In PUBLIC mode: Non-blocking, auth check happens client-side
 * - In INTERNAL mode: Blocks SSR only if globalMiddleware is enabled
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const authConfig = config.public.cobrasAuth

  const state = useState<CobrasAuthState>('cobras-auth-state', () => ({
    user: null,
    initialized: false,
    loading: false,
    error: null,
  }))

  const user = computed(() => state.value.user)
  const isAuthenticated = computed(() => !!state.value.user)
  const isInternalUser = computed(() => !!state.value.user)
  const isAdmin = computed(() => state.value.user?.role === 'admin')

  async function checkAuth(): Promise<void> {
    if (state.value.loading) return

    state.value.loading = true
    state.value.error = null

    try {
      const headers = useRequestHeaders(['cookie'])

      const response = await $fetch<{ valid: boolean; user: CobrasUser }>(
        `${authConfig.authServiceUrl}/api/auth/verify`,
        {
          headers: {
            cookie: headers.cookie || '',
          },
        }
      )

      if (response.valid && response.user) {
        state.value.user = response.user
      } else {
        state.value.user = null
      }
    } catch (error: any) {
      state.value.user = null
      if (error.statusCode !== 401 && authConfig.debug) {
        console.warn('[@cobras/auth-nuxt] SSR auth check failed:', error.message)
      }
    } finally {
      state.value.loading = false
      state.value.initialized = true
    }
  }

  function login(redirect?: string): void {
    // Server-side: no-op, middleware handles redirects
  }

  async function logout(): Promise<void> {
    state.value.user = null
  }

  const cobrasAuth = {
    user,
    isAuthenticated,
    isInternalUser,
    isAdmin,
    mode: authConfig.mode,
    checkAuth,
    login,
    logout,
  }

  // PUBLIC mode: Never block SSR - users shouldn't wait for auth check
  // INTERNAL mode: Check auth on server for proper SSO flow
  if (authConfig.mode === 'internal') {
    // Block and check auth for internal apps
    nuxtApp.hook('app:created', async () => {
      await checkAuth()
    })
  } else {
    // Public mode - just mark initialized, client will check
    state.value.initialized = true
  }

  return {
    provide: {
      cobrasAuth,
    },
  }
})
