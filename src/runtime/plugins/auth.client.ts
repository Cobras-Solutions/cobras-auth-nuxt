import { defineNuxtPlugin, useRuntimeConfig, useState, computed } from '#imports'
import type { CobrasUser, CobrasAuthState } from '../../types'

export default defineNuxtPlugin(async (nuxtApp) => {
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
      // Don't log 401s as errors - they're expected for unauthenticated users
      if (error.statusCode !== 401 && authConfig.debug) {
        console.warn('[@cobras/auth-nuxt] Auth check failed:', error)
      }
    } finally {
      state.value.loading = false
      state.value.initialized = true
    }
  }

  function login(redirect?: string): void {
    const currentUrl = redirect || window.location.href
    const loginUrl = `${authConfig.authServiceUrl}/login?redirect=${encodeURIComponent(currentUrl)}`
    window.location.href = loginUrl
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

  // Check auth on initial load
  await checkAuth()

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
