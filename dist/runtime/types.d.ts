/**
 * Types shared by the module's runtime (plugins, middleware, composables,
 * server utils). Kept under `runtime/` so the generated declarations in
 * `dist/runtime/**` can reference them with relative imports.
 */
export interface CobrasUser {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    canAccessAdmin?: boolean;
    isAutoAuth?: boolean;
}
/**
 * Verified server-side session, as stored (signed) in the `cobras_session`
 * cookie and returned by `requireCobrasSession(event)` / `getCobrasSession(event)`.
 */
export interface CobrasSession {
    user: CobrasUser;
    expires_at: string;
}
export interface CobrasAuthState {
    /** Current authenticated user, null if not logged in */
    user: CobrasUser | null;
    /** Whether auth state has been checked */
    initialized: boolean;
    /** Whether a check is in progress */
    loading: boolean;
    /** Last error if any */
    error: string | null;
}
export type AuthMode = 'internal' | 'public';
