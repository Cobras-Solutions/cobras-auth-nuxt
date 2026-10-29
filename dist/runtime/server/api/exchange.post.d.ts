/**
 * Exchange auth code for user session
 *
 * Called after redirect from cobras-auth with a one-time code.
 * Exchanges the code for user info and sets the signed local session cookie.
 */
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<{
    success: boolean;
    user: {
        id: string;
        email: string;
        name: string;
        role: "admin" | "user";
        canAccessAdmin?: boolean;
    };
}>>;
export default _default;
