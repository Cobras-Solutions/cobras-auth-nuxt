import { useState, useRuntimeConfig, useNuxtApp, computed, type Ref, type ComputedRef } from '#imports'
import type { CobrasUser, CobrasAuthState } from '../../types'

export interface UseCobrasAuthReturn {
  /** Current authenticated user */
  user: Ref<CobrasUser | null>
  /** Auth state object with loading/error states */
  state: Ref<CobrasAuthState>
  /** Whether user is authenticated */
  isAuthenticated: ComputedRef<boolean>
  /** Whether user is an internal team member (authenticated in any mode) */
  isInternalUser: ComputedRef<boolean>
  /** Whether user has admin role */
  isAdmin: ComputedRef<boolean>
  /** Current auth mode */
  mode: 'internal' | 'public'
  /** Check/refresh authentication status */
  checkAuth: () => Promise<void>
  /** Redirect to login */
  login: (redirect?: string) => void
  /** Logout and clear session */
  logout: () => Promise<void>
  /** Verify user has access to current site */
  verifySiteAccess: () => Promise<boolean>
}

export function useCobrasAuth(): UseCobrasAuthReturn {
  const config = useRuntimeConfig()
  const authConfig = config.public.cobrasAuth

  const state = useState<CobrasAuthState>('cobras-auth-state', () => ({
    user: null,
    initialized: false,
    loading: false,
    error: null,
  }))

  const user = computed({
    get: () => state.value.user,
    set: (val) => { state.value.user = val }
  }) as unknown as Ref<CobrasUser | null>

  const isAuthenticated = computed(() => !!state.value.user)
  const isInternalUser = computed(() => !!state.value.user)
  const isAdmin = computed(() => state.value.user?.role === 'admin')

  async function checkAuth(): Promise<void> {
    if (state.value.loading) return

    state.value.loading = true
    state.value.error = null

    try {
      const response = await $fetch<{ valid: boolean; user: CobrasUser }>('/api/_cobras/verify', {
        credentials: 'include',
      })

      if (response.valid && response.user) {
        state.value.user = response.user
      } else {
        state.value.user = null
      }
    } catch (error: any) {
      state.value.user = null
      state.value.error = error.message || 'Auth check failed'

      if (authConfig.debug) {
        console.warn('[@cobras/auth-nuxt] Auth check failed:', error)
      }
    } finally {
      state.value.loading = false
      state.value.initialized = true
    }
  }

  function login(redirect?: string): void {
    const currentUrl = redirect || (typeof window !== 'undefined' ? window.location.href : '/')
    const loginUrl = `${authConfig.authServiceUrl}/login?redirect=${encodeURIComponent(currentUrl)}`

    if (typeof window !== 'undefined') {
      window.location.href = loginUrl
    }
  }

  async function logout(): Promise<void> {
    try {
      await $fetch('/api/_cobras/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      if (authConfig.debug) {
        console.warn('[@cobras/auth-nuxt] Logout error:', error)
      }
    }

    state.value.user = null

    // In internal mode, redirect to auth service
    if (authConfig.mode === 'internal' && typeof window !== 'undefined') {
      window.location.href = authConfig.authServiceUrl
    }
  }

  async function verifySiteAccess(): Promise<boolean> {
    if (!state.value.user) return false
    if (!authConfig.siteId && !authConfig.siteDomain) return true

    try {
      const response = await $fetch<{ hasAccess: boolean }>(
        `${authConfig.authServiceUrl}/api/auth/check-access`,
        {
          method: 'POST',
          body: {
            siteId: authConfig.siteId,
            siteDomain: authConfig.siteDomain,
          },
          credentials: 'include',
        }
      )
      return response.hasAccess
    } catch {
      return false
    }
  }

  return {
    user,
    state,
    isAuthenticated,
    isInternalUser,
    isAdmin,
    mode: authConfig.mode,
    checkAuth,
    login,
    logout,
    verifySiteAccess,
  }
}
