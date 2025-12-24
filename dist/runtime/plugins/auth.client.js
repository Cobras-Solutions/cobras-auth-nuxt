import { defineNuxtPlugin, useRuntimeConfig, useState, computed, useRoute, useRouter } from "#imports";
export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig();
  const authConfig = config.public.cobrasAuth;
  const route = useRoute();
  const router = useRouter();
  const state = useState("cobras-auth-state", () => ({
    user: null,
    initialized: false,
    loading: false,
    error: null
  }));
  const user = computed(() => state.value.user);
  const isAuthenticated = computed(() => !!state.value.user);
  const isInternalUser = computed(() => !!state.value.user);
  const isAdmin = computed(() => state.value.user?.role === "admin");
  async function exchangeCode(code2) {
    try {
      const response = await $fetch("/api/_cobras/exchange", {
        method: "POST",
        body: { code: code2 },
        credentials: "include"
      });
      if (response.success && response.user) {
        state.value.user = response.user;
        return true;
      }
    } catch (error) {
      if (authConfig.debug) {
        console.warn("[@cobras/auth-nuxt] Code exchange failed:", error);
      }
    }
    return false;
  }
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
      if (error.statusCode !== 401 && authConfig.debug) {
        console.warn("[@cobras/auth-nuxt] Auth check failed:", error);
      }
    } finally {
      state.value.loading = false;
      state.value.initialized = true;
    }
  }
  function login(redirect) {
    const currentUrl = redirect || window.location.href;
    const authorizeUrl = `${authConfig.authServiceUrl}/api/auth/authorize?redirect_uri=${encodeURIComponent(currentUrl)}`;
    window.location.href = authorizeUrl;
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
    if (authConfig.mode === "internal") {
      window.location.href = authConfig.authServiceUrl;
    }
  }
  const code = route.query.code;
  if (code) {
    const success = await exchangeCode(code);
    if (success) {
      const newQuery = { ...route.query };
      delete newQuery.code;
      router.replace({ query: newQuery });
    } else {
      const currentUrl = window.location.origin + window.location.pathname;
      router.replace({
        path: "/_auth/error",
        query: {
          error: "Authentication Failed",
          message: "Unable to complete login. The authorization code may have expired.",
          redirect_uri: currentUrl
        }
      });
    }
  }
  await checkAuth();
  if (authConfig.enableDevTools && authConfig.devToolsKey) {
    const keys = authConfig.devToolsKey.toLowerCase().split("+");
    document.addEventListener("keydown", (e) => {
      const pressed = [
        e.ctrlKey && "ctrl",
        e.shiftKey && "shift",
        e.altKey && "alt",
        e.metaKey && "meta",
        e.key.toLowerCase()
      ].filter(Boolean);
      if (keys.every((k) => pressed.includes(k)) && isAuthenticated.value) {
        const devToolsState = useState("cobras-devtools-state");
        if (devToolsState.value) {
          devToolsState.value.isOpen = !devToolsState.value.isOpen;
        }
      }
    });
  }
  const cobrasAuth = {
    user,
    isAuthenticated,
    isInternalUser,
    isAdmin,
    mode: authConfig.mode,
    checkAuth,
    login,
    logout
  };
  return {
    provide: {
      cobrasAuth
    }
  };
});
