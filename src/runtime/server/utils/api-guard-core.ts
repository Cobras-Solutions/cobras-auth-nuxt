/**
 * Pure path logic for the internal-mode API guard (no Nitro / h3 dependency).
 */

/** The module's own endpoints must stay reachable to log in / out. */
export const COBRAS_API_PREFIX = '/api/_cobras/'

export function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/')
}

/**
 * Same matching rules as `publicRoutes`: a trailing `*` matches by prefix,
 * anything else must match exactly.
 */
export function matchesRoutePattern(pathname: string, pattern: string): boolean {
  if (typeof pattern !== 'string' || pattern.length === 0) return false
  if (pattern.endsWith('*')) {
    return pathname.startsWith(pattern.slice(0, -1))
  }
  return pathname === pattern
}

/**
 * True when a request to `pathname` must carry a valid session in internal
 * mode. Non-API paths, the module's own `/api/_cobras/*` endpoints and any
 * configured `publicApiRoutes` are not guarded.
 */
export function isGuardedApiPath(pathname: string, publicApiRoutes: readonly string[] = []): boolean {
  if (!isApiPath(pathname)) return false
  if (pathname.startsWith(COBRAS_API_PREFIX)) return false
  if (publicApiRoutes.some(pattern => matchesRoutePattern(pathname, pattern))) return false
  return true
}
