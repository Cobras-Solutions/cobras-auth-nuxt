import { useState, useRuntimeConfig, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from '#imports'
import { useCobrasAuth } from './useCobrasAuth'

export interface DevToolsState {
  /** Whether dev tools panel is open */
  isOpen: boolean
  /** Feature flags that can be toggled */
  featureFlags: Record<string, boolean>
  /** Debug mode enabled */
  debugMode: boolean
  /** Show performance metrics */
  showMetrics: boolean
}

export interface UseCobrasDevToolsReturn {
  /** Dev tools state */
  state: Ref<DevToolsState>
  /** Whether dev tools are available (user authenticated + enabled in config) */
  isAvailable: ComputedRef<boolean>
  /** Toggle dev tools panel */
  toggle: () => void
  /** Open dev tools panel */
  open: () => void
  /** Close dev tools panel */
  close: () => void
  /** Set a feature flag */
  setFeatureFlag: (key: string, value: boolean) => void
  /** Get a feature flag value */
  getFeatureFlag: (key: string) => boolean
  /** Toggle debug mode */
  toggleDebugMode: () => void
  /** Toggle performance metrics */
  toggleMetrics: () => void
}

export function useCobrasDevTools(): UseCobrasDevToolsReturn {
  const config = useRuntimeConfig()
  const authConfig = config.public.cobrasAuth
  const { isAuthenticated } = useCobrasAuth()

  const state = useState<DevToolsState>('cobras-devtools-state', () => ({
    isOpen: false,
    featureFlags: {},
    debugMode: false,
    showMetrics: false,
  }))

  const isAvailable = computed(() => {
    return authConfig.enableDevTools && isAuthenticated.value
  })

  function toggle(): void {
    if (!isAvailable.value) return
    state.value.isOpen = !state.value.isOpen
  }

  function open(): void {
    if (!isAvailable.value) return
    state.value.isOpen = true
  }

  function close(): void {
    state.value.isOpen = false
  }

  function setFeatureFlag(key: string, value: boolean): void {
    state.value.featureFlags[key] = value
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cobras-feature-flags', JSON.stringify(state.value.featureFlags))
    }
  }

  function getFeatureFlag(key: string): boolean {
    return state.value.featureFlags[key] ?? false
  }

  function toggleDebugMode(): void {
    state.value.debugMode = !state.value.debugMode
    if (typeof window !== 'undefined') {
      localStorage.setItem('cobras-debug-mode', String(state.value.debugMode))
    }
  }

  function toggleMetrics(): void {
    state.value.showMetrics = !state.value.showMetrics
  }

  // Load persisted state
  if (typeof window !== 'undefined') {
    const savedFlags = localStorage.getItem('cobras-feature-flags')
    if (savedFlags) {
      try {
        state.value.featureFlags = JSON.parse(savedFlags)
      } catch {}
    }

    const savedDebug = localStorage.getItem('cobras-debug-mode')
    if (savedDebug) {
      state.value.debugMode = savedDebug === 'true'
    }
  }

  return {
    state,
    isAvailable,
    toggle,
    open,
    close,
    setFeatureFlag,
    getFeatureFlag,
    toggleDebugMode,
    toggleMetrics,
  }
}
