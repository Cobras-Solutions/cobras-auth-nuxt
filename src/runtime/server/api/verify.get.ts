import { defineEventHandler, getHeader, getCookie, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getCobrasSession } from '../utils/session'

/**
 * Verify auth - checks the signed local session cookie first, then the
 * remote auth service (same-domain `access_token` scenarios).
 *
 * The local cookie is only trusted when its HMAC signature verifies against
 * COBRAS_AUTH_SESSION_SECRET and it has not expired. A missing secret, an
 * unsigned (pre-1.0.12) cookie or a tampered cookie all count as no session.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl

  // First, check the signed local session cookie (from code exchange / IP probe)
  const session = getCobrasSession(event)
  if (session) {
    return {
      valid: true,
      user: session.user,
    }
  }

  // Fallback: try remote auth service (for same-domain cookie scenarios)
  const token = getCookie(event, 'access_token')
  const cookieHeader = getHeader(event, 'cookie') || ''

  if (!token && !cookieHeader.includes('access_token')) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    })
  }

  try {
    const response = await $fetch<{ valid: boolean; user: any }>(
      `${authServiceUrl}/api/auth/verify`,
      {
        headers: {
          cookie: cookieHeader,
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      }
    )

    return response
  } catch (error: any) {
    if (error.statusCode === 401) {
      throw createError({
        statusCode: 401,
        message: 'Not authenticated',
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Auth verification failed',
    })
  }
})
