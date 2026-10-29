/**
 * Pure path logic for the internal-mode API guard (no Nitro / h3 dependency).
 */
/** The module's own endpoints must stay reachable to log in / out. */
export declare const COBRAS_API_PREFIX = "/api/_cobras/";
export declare function isApiPath(pathname: string): boolean;
/**
 * Same matching rules as `publicRoutes`: a trailing `*` matches by prefix,
 * anything else must match exactly.
 */
export declare function matchesRoutePattern(pathname: string, pattern: string): boolean;
/**
 * True when a request to `pathname` must carry a valid session in internal
 * mode. Non-API paths, the module's own `/api/_cobras/*` endpoints and any
 * configured `publicApiRoutes` are not guarded.
 */
export declare function isGuardedApiPath(pathname: string, publicApiRoutes?: readonly string[]): boolean;
