/**
 * Auth middleware - behavior depends on mode:
 *
 * INTERNAL MODE:
 * - Redirects unauthenticated users to auth service
 * - Respects publicRoutes config
 * - Uses OAuth-style redirect_uri for cross-domain support
 *
 * PUBLIC MODE:
 * - Just checks auth status silently (no redirect)
 * - Makes auth state available for the page to use
 */
declare const _default: import("#imports").RouteMiddleware;
export default _default;
