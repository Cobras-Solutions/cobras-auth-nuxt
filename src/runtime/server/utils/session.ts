/**
 * Server-side session helpers for Nitro routes.
 *
 * Apps use `requireCobrasSession(event)` / `getCobrasSession(event)` to guard
 * their own `server/api/**` handlers. Both are auto-imported in Nitro and also
 * importable from `cobras-auth-nuxt/server`.
 */
import type { H3Event } from 'h3'
import { getCookie, setCookie, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { CobrasSession } from '../../types'
import {
  decodeSession,
  encodeSession,
  normalizeSessionSecret,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from './session-core'

export type { CobrasSession } from '../../types'
export { SESSION_COOKIE_NAME } from './session-core'

const CONTEXT_KEY = 'cobrasSession'

let warnedMissingSecret = false

/** Log the missing-secret warning once per process. Never throws. */
export function warnMissingSecretOnce(): void {
  if (warnedMissingSecret) return
  warnedMissingSecret = true
  console.warn(
    '[@cobras/auth-nuxt] COBRAS_AUTH_SESSION_SECRET is not set. No session cookie can be issued or '
    + 'accepted, so nobody can sign in to this app. Set COBRAS_AUTH_SESSION_SECRET '
    + '(or NUXT_COBRAS_AUTH_SESSION_SECRET) to a long random value and redeploy.',
  )
}

/**
 * The HMAC secret: `runtimeConfig.cobrasAuth.sessionSecret` (set via the
 * `NUXT_COBRAS_AUTH_SESSION_SECRET` env var or the module option), falling
 * back to the plain `COBRAS_AUTH_SESSION_SECRET` env var. Null when missing.
 */
export function getSessionSecret(): string | null {
  let fromConfig: string | null = null
  try {
    const config = useRuntimeConfig()
    fromConfig = normalizeSessionSecret(config.cobrasAuth?.sessionSecret)
  } catch {
    fromConfig = null
  }
  const secret = fromConfig ?? normalizeSessionSecret(process.env.COBRAS_AUTH_SESSION_SECRET)
  if (!secret) warnMissingSecretOnce()
  return secret
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}

/**
 * Verified session for this request, or null. Non-throwing. The result is
 * cached on `event.context.cobrasSession` so a route and the API guard do
 * not verify twice.
 */
export function getCobrasSession(event: H3Event): CobrasSession | null {
  if (CONTEXT_KEY in event.context) {
    return (event.context[CONTEXT_KEY] as CobrasSession | null) ?? null
  }
  const token = getCookie(event, SESSION_COOKIE_NAME)
  const session = token ? decodeSession(token, getSessionSecret()) : null
  event.context[CONTEXT_KEY] = session
  return session
}

/** Verified session for this request, or a 401 error. */
export function requireCobrasSession(event: H3Event): CobrasSession {
  const session = getCobrasSession(event)
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Not authenticated',
    })
  }
  return session
}

/**
 * Issue the signed session cookie (host-only, httpOnly, SameSite=Lax, 24 h,
 * Secure in production). Throws a 500 when no secret is configured, so a
 * login attempt fails visibly instead of silently setting nothing.
 */
export function setCobrasSessionCookie(event: H3Event, session: CobrasSession): void {
  const secret = getSessionSecret()
  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Session secret not configured',
      message: 'COBRAS_AUTH_SESSION_SECRET is not configured on this app',
    })
  }
  setCookie(event, SESSION_COOKIE_NAME, encodeSession(session, secret), cookieOptions())
  event.context[CONTEXT_KEY] = session
}

/** Expire the session cookie with the same attributes it was set with. */
export function clearCobrasSessionCookie(event: H3Event): void {
  setCookie(event, SESSION_COOKIE_NAME, '', { ...cookieOptions(), maxAge: 0 })
  event.context[CONTEXT_KEY] = null
}
