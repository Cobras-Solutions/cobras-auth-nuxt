import { useRuntimeConfig, computed } from '#imports'
import { useCobrasAuth } from './useCobrasAuth'
import type { AuthMode } from '../../types'

export interface UseCobrasModeReturn {
  /** Current authentication mode */
  mode: AuthMode
  /** Whether running in internal (SSO) mode */
  isInternalMode: boolean
  /** Whether running in public mode */
  isPublicMode: boolean
  /** Whether current user should see internal-only features */
  showInternalFeatures: boolean
  /** Whether current user should see admin-only features */
  showAdminFeatures: boolean
  /** Whether dev tools should be available */
  devToolsEnabled: boolean
}

/**
 * Composable for checking the current auth mode and feature visibility
 */
export function useCobrasMode(): UseCobrasModeReturn {
  const config = useRuntimeConfig()
  const authConfig = config.public.cobrasAuth
  const { isAuthenticated, isAdmin } = useCobrasAuth()

  const mode = authConfig.mode as AuthMode
  const isInternalMode = mode === 'internal'
  const isPublicMode = mode === 'public'

  // In internal mode, all authenticated users see internal features
  // In public mode, authenticated users get special access
  const showInternalFeatures = computed(() => isAuthenticated.value)

  // Admin features always require admin role
  const showAdminFeatures = computed(() => isAdmin.value)

  // Dev tools enabled based on config and auth status
  const devToolsEnabled = computed(() => {
    if (!authConfig.enableDevTools) return false
    // In public mode, only show to authenticated users
    if (isPublicMode) return isAuthenticated.value
    // In internal mode, show to all authenticated users
    return isAuthenticated.value
  })

  return {
    mode,
    isInternalMode,
    isPublicMode,
    showInternalFeatures: showInternalFeatures.value,
    showAdminFeatures: showAdminFeatures.value,
    devToolsEnabled: devToolsEnabled.value,
  }
}
