/**
 * Proxy endpoint for logging out
 *
 * Tells the auth service to end its session, then clears the local signed
 * `cobras_session` cookie plus any same-domain auth-service cookies.
 */
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<{
    success: boolean;
}>>;
export default _default;
