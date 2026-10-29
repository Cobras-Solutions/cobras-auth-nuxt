/**
 * Verify auth - checks the signed local session cookie first, then the
 * remote auth service (same-domain `access_token` scenarios).
 *
 * The local cookie is only trusted when its HMAC signature verifies against
 * COBRAS_AUTH_SESSION_SECRET and it has not expired. A missing secret, an
 * unsigned (pre-1.0.12) cookie or a tampered cookie all count as no session.
 */
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<{
    valid: boolean;
    user: any;
}>>;
export default _default;
