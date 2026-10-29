/**
 * Server-side session helpers for Nitro routes.
 *
 * Apps use `requireCobrasSession(event)` / `getCobrasSession(event)` to guard
 * their own `server/api/**` handlers. Both are auto-imported in Nitro and also
 * importable from `cobras-auth-nuxt/server`.
 */
import type { H3Event } from 'h3';
import type { CobrasSession } from '../../types.js';
export type { CobrasSession } from '../../types.js';
export { SESSION_COOKIE_NAME } from './session-core.js';
/** Log the missing-secret warning once per process. Never throws. */
export declare function warnMissingSecretOnce(): void;
/**
 * The HMAC secret: `runtimeConfig.cobrasAuth.sessionSecret` (set via the
 * `NUXT_COBRAS_AUTH_SESSION_SECRET` env var or the module option), falling
 * back to the plain `COBRAS_AUTH_SESSION_SECRET` env var. Null when missing.
 */
export declare function getSessionSecret(): string | null;
/**
 * Verified session for this request, or null. Non-throwing. The result is
 * cached on `event.context.cobrasSession` so a route and the API guard do
 * not verify twice.
 */
export declare function getCobrasSession(event: H3Event): CobrasSession | null;
/** Verified session for this request, or a 401 error. */
export declare function requireCobrasSession(event: H3Event): CobrasSession;
/**
 * Issue the signed session cookie (host-only, httpOnly, SameSite=Lax, 24 h,
 * Secure in production). Throws a 500 when no secret is configured, so a
 * login attempt fails visibly instead of silently setting nothing.
 */
export declare function setCobrasSessionCookie(event: H3Event, session: CobrasSession): void;
/** Expire the session cookie with the same attributes it was set with. */
export declare function clearCobrasSessionCookie(event: H3Event): void;
