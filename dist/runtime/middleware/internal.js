import { defineNuxtRouteMiddleware, useRuntimeConfig, useState, navigateTo } from "#imports";
export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig();
  const authConfig = config.public.cobrasAuth;
  const state = useState("cobras-auth-state");
  if (to.query.code) {
    return;
  }
  if (!state.value?.initialized) {
    return;
  }
  if (!state.value?.user) {
    const currentUrl = typeof window !== "undefined" ? window.location.href : to.fullPath;
    return navigateTo(
      `${authConfig.authServiceUrl}/api/auth/authorize?redirect_uri=${encodeURIComponent(currentUrl)}`,
      { external: true }
    );
  }
});
