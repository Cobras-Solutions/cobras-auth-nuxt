/**
 * Pure session-token helpers (no Nitro / h3 dependency).
 *
 * The `cobras_session` cookie is `v1.<payload>.<signature>` where
 * `payload` is base64url(JSON.stringify({ user, expires_at })) and
 * `signature` is base64url(HMAC-SHA256(secret, "v1.<payload>")).
 *
 * A cookie is accepted only when a secret is configured, the signature
 * matches in constant time, the payload parses to a well-formed session
 * and `expires_at` is in the future. Anything else is "no session".
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { CobrasSession, CobrasUser } from '../../types'

export const SESSION_COOKIE_NAME = 'cobras_session'
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60
export const SESSION_TOKEN_VERSION = 'v1'

/** Hard upper bound on an accepted cookie, to keep decoding cheap. */
const MAX_TOKEN_LENGTH = 8192

/**
 * Returns the secret as a non-empty trimmed string, or null when it is
 * missing/blank/not a string. A null secret means no session can ever be
 * issued or accepted.
 */
export function normalizeSessionSecret(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data, 'utf8').digest('base64url')
}

/** Serialize and sign a session into the cookie value. */
export function encodeSession(session: CobrasSession, secret: string): string {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
  const signed = `${SESSION_TOKEN_VERSION}.${payload}`
  return `${signed}.${sign(signed, secret)}`
}

/**
 * Verify and parse a cookie value. Returns the session, or null for any
 * failure (missing secret, malformed, bad signature, bad shape, expired).
 * Never throws.
 */
export function decodeSession(
  token: unknown,
  secret: string | null,
  now: Date = new Date(),
): CobrasSession | null {
  if (!secret) return null
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [version, payload, signature] = parts
  if (version !== SESSION_TOKEN_VERSION || !payload || !signature) return null

  const expected = sign(`${version}.${payload}`, secret)
  const actualBuf = Buffer.from(signature, 'utf8')
  const expectedBuf = Buffer.from(expected, 'utf8')
  if (actualBuf.length !== expectedBuf.length) return null
  if (!timingSafeEqual(actualBuf, expectedBuf)) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (!isSessionShape(parsed)) return null

  const expiresAt = Date.parse(parsed.expires_at)
  if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) return null

  return parsed
}

function isUserShape(value: unknown): value is CobrasUser {
  if (!value || typeof value !== 'object') return false
  const u = value as Record<string, unknown>
  return (
    typeof u.id === 'string'
    && typeof u.email === 'string'
    && typeof u.name === 'string'
    && (u.role === 'admin' || u.role === 'user')
  )
}

function isSessionShape(value: unknown): value is CobrasSession {
  if (!value || typeof value !== 'object') return false
  const s = value as Record<string, unknown>
  return typeof s.expires_at === 'string' && isUserShape(s.user)
}
