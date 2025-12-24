import { defineEventHandler, getHeader, getCookie, createError } from 'h3'
import { useRuntimeConfig } from '#imports'

/**
 * Proxy endpoint for verifying auth tokens
 * Forwards the request to the auth service with cookies
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl

  // Get token from cookie or Authorization header
  let token = getCookie(event, 'access_token')

  if (!token) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  // Forward all cookies from the request
  const cookieHeader = getHeader(event, 'cookie') || ''

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
    // Return a clean 401 for unauthenticated
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
