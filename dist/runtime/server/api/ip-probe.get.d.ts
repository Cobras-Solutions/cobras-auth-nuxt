/**
 * IP-based auto-auth probe
 *
 * Forwards the client's real IP to cobras-auth-app's /api/auth/auto endpoint.
 * If the IP is whitelisted (user-specific or global), creates the signed local
 * session cookie.
 *
 * This runs client-side in the background (fire-and-forget) in public mode,
 * so it never blocks page load for regular visitors.
 */
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<{
    valid: boolean;
    user: {
        id: string;
        email: string;
        name: string;
        role: "admin" | "user";
        canAccessAdmin?: boolean;
        isAutoAuth?: boolean;
    };
}>>;
export default _default;
