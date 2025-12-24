import { defineNuxtPlugin, useRuntimeConfig, useState, computed, useRequestHeaders } from "#imports";
export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig();
  const authConfig = config.public.cobrasAuth;
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
  async function checkAuth() {
    if (state.value.loading) return;
    state.value.loading = true;
    state.value.error = null;
    try {
      const headers = useRequestHeaders(["cookie"]);
      const response = await $fetch(
        `${authConfig.authServiceUrl}/api/auth/verify`,
        {
          headers: {
            cookie: headers.cookie || ""
          }
        }
      );
      if (response.valid && response.user) {
        state.value.user = response.user;
      } else {
        state.value.user = null;
      }
    } catch (error) {
      state.value.user = null;
      if (error.statusCode !== 401 && authConfig.debug) {
        console.warn("[@cobras/auth-nuxt] SSR auth check failed:", error.message);
      }
    } finally {
      state.value.loading = false;
      state.value.initialized = true;
    }
  }
  function login(redirect) {
  }
  async function logout() {
    state.value.user = null;
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
  if (authConfig.mode === "internal") {
    await checkAuth();
  } else {
    state.value.initialized = true;
  }
  return {
    provide: {
      cobrasAuth
    }
  };
});
