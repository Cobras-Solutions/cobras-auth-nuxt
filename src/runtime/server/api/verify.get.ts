import { defineEventHandler, getHeader, getCookie, createError } from 'h3'
import { useRuntimeConfig } from '#imports'

/**
 * Verify auth - checks local session first, then remote auth service
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl

  // First, check local session cookie (from code exchange)
  const sessionCookie = getCookie(event, 'cobras_session')

  if (sessionCookie) {
    try {
      const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString())

      // Check if session is expired
      if (session.expires_at && new Date(session.expires_at) > new Date()) {
        return {
          valid: true,
          user: session.user,
        }
      }
    } catch {
      // Invalid session cookie, continue to remote check
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
