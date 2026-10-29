import type { CobrasSession } from '../../types.js';
export declare const SESSION_COOKIE_NAME = "cobras_session";
export declare const SESSION_MAX_AGE_SECONDS: number;
export declare const SESSION_TOKEN_VERSION = "v1";
/**
 * Returns the secret as a non-empty trimmed string, or null when it is
 * missing/blank/not a string. A null secret means no session can ever be
 * issued or accepted.
 */
export declare function normalizeSessionSecret(raw: unknown): string | null;
/** Serialize and sign a session into the cookie value. */
export declare function encodeSession(session: CobrasSession, secret: string): string;
/**
 * Verify and parse a cookie value. Returns the session, or null for any
 * failure (missing secret, malformed, bad signature, bad shape, expired).
 * Never throws.
 */
export declare function decodeSession(token: unknown, secret: string | null, now?: Date): CobrasSession | null;
