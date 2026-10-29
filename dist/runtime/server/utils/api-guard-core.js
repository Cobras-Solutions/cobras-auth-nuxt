export const COBRAS_API_PREFIX = "/api/_cobras/";
export function isApiPath(pathname) {
  return pathname === "/api" || pathname.startsWith("/api/");
}
export function matchesRoutePattern(pathname, pattern) {
  if (typeof pattern !== "string" || pattern.length === 0) return false;
  if (pattern.endsWith("*")) {
    return pathname.startsWith(pattern.slice(0, -1));
  }
  return pathname === pattern;
}
export function isGuardedApiPath(pathname, publicApiRoutes = []) {
  if (!isApiPath(pathname)) return false;
  if (pathname.startsWith(COBRAS_API_PREFIX)) return false;
  if (publicApiRoutes.some((pattern) => matchesRoutePattern(pathname, pattern))) return false;
  return true;
}
