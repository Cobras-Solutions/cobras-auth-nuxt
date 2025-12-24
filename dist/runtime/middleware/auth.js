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
  if (authConfig.mode === "public") {
    return;
  }
  const isPublicRoute = authConfig.publicRoutes.some((route) => {
    if (route.endsWith("*")) {
      return to.path.startsWith(route.slice(0, -1));
    }
    return to.path === route;
  });
  if (isPublicRoute) {
    return;
  }
  if (!state.value?.user) {
    let redirectUrl;
    if (typeof window !== "undefined") {
      redirectUrl = window.location.href;
    } else {
      redirectUrl = to.fullPath;
    }
    return navigateTo(
      `${authConfig.authServiceUrl}/login?redirect_uri=${encodeURIComponent(redirectUrl)}`,
      { external: true }
    );
  }
});
