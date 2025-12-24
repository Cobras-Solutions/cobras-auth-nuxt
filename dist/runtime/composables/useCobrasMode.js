import { useRuntimeConfig, computed } from "#imports";
import { useCobrasAuth } from "./useCobrasAuth.js";
export function useCobrasMode() {
  const config = useRuntimeConfig();
  const authConfig = config.public.cobrasAuth;
  const { isAuthenticated, isAdmin } = useCobrasAuth();
  const mode = authConfig.mode;
  const isInternalMode = mode === "internal";
  const isPublicMode = mode === "public";
  const showInternalFeatures = computed(() => isAuthenticated.value);
  const showAdminFeatures = computed(() => isAdmin.value);
  const devToolsEnabled = computed(() => {
    if (!authConfig.enableDevTools) return false;
    if (isPublicMode) return isAuthenticated.value;
    return isAuthenticated.value;
  });
  return {
    mode,
    isInternalMode,
    isPublicMode,
    showInternalFeatures: showInternalFeatures.value,
    showAdminFeatures: showAdminFeatures.value,
    devToolsEnabled: devToolsEnabled.value
  };
}
