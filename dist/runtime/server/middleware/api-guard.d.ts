/**
 * Internal-mode API guard.
 *
 * In `mode: 'internal'`, every request under `/api/**` must carry a valid
 * signed `cobras_session` cookie, except the module's own `/api/_cobras/*`
 * endpoints and any `publicApiRoutes` configured by the app. In `public`
 * mode this middleware does nothing.
 */
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, void>;
export default _default;
