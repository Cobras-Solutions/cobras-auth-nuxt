import { defineEventHandler, getRequestURL, createError } from "h3";
import { useRuntimeConfig } from "#imports";
import { isGuardedApiPath } from "../utils/api-guard-core.js";
import { getCobrasSession } from "../utils/session.js";
export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  if (config.public.cobrasAuth?.mode !== "internal") return;
  if (config.cobrasAuth?.guardApiRoutes === false) return;
  const publicApiRoutes = Array.isArray(config.cobrasAuth?.publicApiRoutes) ? config.cobrasAuth.publicApiRoutes : [];
  const rawPath = getRequestURL(event).pathname;
  let decodedPath = rawPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    decodedPath = rawPath;
  }
  const guarded = isGuardedApiPath(rawPath, publicApiRoutes) || isGuardedApiPath(decodedPath, publicApiRoutes);
  if (!guarded) return;
  if (!getCobrasSession(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Not authenticated"
    });
  }
});
