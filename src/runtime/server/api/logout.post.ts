import { defineEventHandler, getHeader, setCookie } from 'h3'
import { useRuntimeConfig } from '#imports'
import { clearCobrasSessionCookie } from '../utils/session'

/**
 * Proxy endpoint for logging out
 *
 * Tells the auth service to end its session, then clears the local signed
 * `cobras_session` cookie plus any same-domain auth-service cookies.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl
  const cookieDomain = config.cobrasAuth?.cookieDomain

  const cookieHeader = getHeader(event, 'cookie') || ''

  try {
    await $fetch(`${authServiceUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        cookie: cookieHeader,
      },
    })
  } catch {
    // Ignore errors - we'll clear cookies anyway
  }

  // Clear the local session cookie
  clearCobrasSessionCookie(event)

  // Clear auth-service cookies locally (same-domain deployments)
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  }

  setCookie(event, 'access_token', '', { ...cookieOptions, maxAge: 0 })
  setCookie(event, 'refresh_token', '', { ...cookieOptions, maxAge: 0 })

  return { success: true }
})
