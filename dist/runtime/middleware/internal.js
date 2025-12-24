import { defineNuxtRouteMiddleware, useRuntimeConfig, useState, navigateTo, useRequestURL } from "#imports";
export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig();
  const authConfig = config.public.cobrasAuth;
  const state = useState("cobras-auth-state");
  const hasCode = to.query.code || typeof window === "undefined" && useRequestURL().searchParams.has("code");
  if (hasCode) {
    return;
  }
  if (!state.value?.initialized) {
    if (typeof window === "undefined") {
      const requestUrl = useRequestURL();
      return navigateTo(
        `${authConfig.authServiceUrl}/api/auth/authorize?redirect_uri=${encodeURIComponent(requestUrl.href)}`,
        { external: true }
      );
    }
    return;
  }
  if (!state.value?.user) {
    let currentUrl;
    if (typeof window !== "undefined") {
      currentUrl = window.location.href;
    } else {
      const requestUrl = useRequestURL();
      currentUrl = requestUrl.href;
    }
    return navigateTo(
      `${authConfig.authServiceUrl}/api/auth/authorize?redirect_uri=${encodeURIComponent(currentUrl)}`,
      { external: true }
    );
  }
});
