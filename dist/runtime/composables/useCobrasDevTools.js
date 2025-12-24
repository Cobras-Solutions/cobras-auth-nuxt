import { useState, useRuntimeConfig, computed } from "#imports";
import { useCobrasAuth } from "./useCobrasAuth.js";
export function useCobrasDevTools() {
  const config = useRuntimeConfig();
  const authConfig = config.public.cobrasAuth;
  const { isAuthenticated } = useCobrasAuth();
  const state = useState("cobras-devtools-state", () => ({
    isOpen: false,
    featureFlags: {},
    debugMode: false,
    showMetrics: false
  }));
  const isAvailable = computed(() => {
    return authConfig.enableDevTools && isAuthenticated.value;
  });
  function toggle() {
    if (!isAvailable.value) return;
    state.value.isOpen = !state.value.isOpen;
  }
  function open() {
    if (!isAvailable.value) return;
    state.value.isOpen = true;
  }
  function close() {
    state.value.isOpen = false;
  }
  function setFeatureFlag(key, value) {
    state.value.featureFlags[key] = value;
    if (typeof window !== "undefined") {
      localStorage.setItem("cobras-feature-flags", JSON.stringify(state.value.featureFlags));
    }
  }
  function getFeatureFlag(key) {
    return state.value.featureFlags[key] ?? false;
  }
  function toggleDebugMode() {
    state.value.debugMode = !state.value.debugMode;
    if (typeof window !== "undefined") {
      localStorage.setItem("cobras-debug-mode", String(state.value.debugMode));
    }
  }
  function toggleMetrics() {
    state.value.showMetrics = !state.value.showMetrics;
  }
  if (typeof window !== "undefined") {
    const savedFlags = localStorage.getItem("cobras-feature-flags");
    if (savedFlags) {
      try {
        state.value.featureFlags = JSON.parse(savedFlags);
      } catch {
      }
    }
    const savedDebug = localStorage.getItem("cobras-debug-mode");
    if (savedDebug) {
      state.value.debugMode = savedDebug === "true";
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
    toggleMetrics
  };
}
