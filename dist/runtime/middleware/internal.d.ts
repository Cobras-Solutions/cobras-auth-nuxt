/**
 * Internal-only middleware
 *
 * Use this on specific pages that REQUIRE authentication,
 * even in public mode. Perfect for:
 * - Admin panels
 * - Internal dashboards
 * - Protected API pages
 *
 * Usage in page:
 * definePageMeta({
 *   middleware: 'cobras-internal'
 * })
 */
declare const _default: import("#imports").RouteMiddleware;
export default _default;
