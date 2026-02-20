import { defineNuxtPlugin, useRuntimeConfig, useState, computed, useRoute, useRouter } from '#imports'
import type { CobrasUser, CobrasAuthState } from '../../types'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()
  const authConfig = config.public.cobrasAuth
  const route = useRoute()
  const router = useRouter()

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

  /**
   * Exchange an auth code for a session
   */
  async function exchangeCode(code: string): Promise<boolean> {
    try {
      const response = await $fetch<{ success: boolean; user: CobrasUser }>('/api/_cobras/exchange', {
        method: 'POST',
        body: { code },
        credentials: 'include',
      })

      if (response.success && response.user) {
        state.value.user = response.user
        return true
      }
    } catch (error: any) {
      if (authConfig.debug) {
        console.warn('[@cobras/auth-nuxt] Code exchange failed:', error)
      }
    }
    return false
  }

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
      if (error.statusCode !== 401 && authConfig.debug) {
        console.warn('[@cobras/auth-nuxt] Auth check failed:', error)
      }
    } finally {
      state.value.loading = false
      state.value.initialized = true
    }
  }

  function login(redirect?: string): void {
    // Use current URL as redirect, ensuring it's a full URL
    const currentUrl = redirect || window.location.href

    // Use authorize endpoint for OAuth-style flow (supports IP auto-auth)
    const authorizeUrl = `${authConfig.authServiceUrl}/api/auth/authorize?redirect_uri=${encodeURIComponent(currentUrl)}`
    window.location.href = authorizeUrl
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

    if (authConfig.mode === 'internal') {
      window.location.href = authConfig.authServiceUrl
    }
  }

  // Check for auth code in URL (from OAuth redirect)
  const code = route.query.code as string | undefined

  if (code) {
    // Exchange the code for a session
    const success = await exchangeCode(code)

    if (success) {
      // Mark as initialized immediately to prevent redirect loops
      state.value.initialized = true

      // Remove code from URL without triggering navigation
      const newQuery = { ...route.query }
      delete newQuery.code

      // Use window.history to avoid triggering middleware
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('code')
      window.history.replaceState({}, '', newUrl.toString())

      // Don't call checkAuth - we already have the user from exchange
      return
    } else {
      // Redirect to error page
      const currentUrl = window.location.origin + window.location.pathname
      window.location.href = `/_auth/error?error=Authentication%20Failed&message=Unable%20to%20complete%20login.&redirect_uri=${encodeURIComponent(currentUrl)}`
      return
    }
  }

  // Check auth on initial load (only if no code was exchanged)
  if (authConfig.mode === 'internal') {
    // Internal mode: must block until auth is verified
    await checkAuth()
  } else {
    // Public mode: fire-and-forget - never block hydration for public visitors
    checkAuth()
  }

  // Set up keyboard shortcut for dev tools
  if (authConfig.enableDevTools && authConfig.devToolsKey) {
    const keys = authConfig.devToolsKey.toLowerCase().split('+')

    document.addEventListener('keydown', (e) => {
      const pressed = [
        e.ctrlKey && 'ctrl',
        e.shiftKey && 'shift',
        e.altKey && 'alt',
        e.metaKey && 'meta',
        e.key.toLowerCase(),
      ].filter(Boolean)

      if (keys.every(k => pressed.includes(k)) && isAuthenticated.value) {
        const devToolsState = useState<{ isOpen: boolean }>('cobras-devtools-state')
        if (devToolsState.value) {
          devToolsState.value.isOpen = !devToolsState.value.isOpen
        }
      }
    })
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

  return {
    provide: {
      cobrasAuth,
    },
  }
})
