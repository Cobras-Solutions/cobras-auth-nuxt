import { useState, useRuntimeConfig, computed } from "#imports";
export function useCobrasAuth() {
  const config = useRuntimeConfig();
  const authConfig = config.public.cobrasAuth;
  const state = useState("cobras-auth-state", () => ({
    user: null,
    initialized: false,
    loading: false,
    error: null
  }));
  const user = computed({
    get: () => state.value.user,
    set: (val) => {
      state.value.user = val;
    }
  });
  const isAuthenticated = computed(() => !!state.value.user);
  const isInternalUser = computed(() => !!state.value.user);
  const isAdmin = computed(() => state.value.user?.role === "admin");
  async function checkAuth() {
    if (state.value.loading) return;
    state.value.loading = true;
    state.value.error = null;
    try {
      const response = await $fetch("/api/_cobras/verify", {
        credentials: "include"
      });
      if (response.valid && response.user) {
        state.value.user = response.user;
      } else {
        state.value.user = null;
      }
    } catch (error) {
      state.value.user = null;
      state.value.error = error.message || "Auth check failed";
      if (authConfig.debug) {
        console.warn("[@cobras/auth-nuxt] Auth check failed:", error);
      }
    } finally {
      state.value.loading = false;
      state.value.initialized = true;
    }
  }
  function login(redirect) {
    const currentUrl = redirect || (typeof window !== "undefined" ? window.location.href : "/");
    const loginUrl = `${authConfig.authServiceUrl}/login?redirect=${encodeURIComponent(currentUrl)}`;
    if (typeof window !== "undefined") {
      window.location.href = loginUrl;
    }
  }
  async function logout() {
    try {
      await $fetch("/api/_cobras/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      if (authConfig.debug) {
        console.warn("[@cobras/auth-nuxt] Logout error:", error);
      }
    }
    state.value.user = null;
    if (authConfig.mode === "internal" && typeof window !== "undefined") {
      window.location.href = authConfig.authServiceUrl;
    }
  }
  async function verifySiteAccess() {
    if (!state.value.user) return false;
    if (!authConfig.siteId && !authConfig.siteDomain) return true;
    try {
      const response = await $fetch(
        `${authConfig.authServiceUrl}/api/auth/check-access`,
        {
          method: "POST",
          body: {
            siteId: authConfig.siteId,
            siteDomain: authConfig.siteDomain
          },
          credentials: "include"
        }
      );
      return response.hasAccess;
    } catch {
      return false;
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
    verifySiteAccess
  };
}
