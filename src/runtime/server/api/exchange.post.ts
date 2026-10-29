import { defineEventHandler, readBody, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { setCobrasSessionCookie } from '../utils/session'
import { SESSION_MAX_AGE_SECONDS } from '../utils/session-core'

/**
 * Exchange auth code for user session
 *
 * Called after redirect from cobras-auth with a one-time code.
 * Exchanges the code for user info and sets the signed local session cookie.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl

  const body = await readBody<{ code: string }>(event)
  const { code } = body

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'code is required',
    })
  }

  try {
    // Exchange code for user info
    const response = await $fetch<{
      success: boolean
      user: {
        id: string
        email: string
        name: string
        role: 'admin' | 'user'
        canAccessAdmin?: boolean
      }
      expires_at: string
    }>(`${authServiceUrl}/api/auth/token`, {
      method: 'POST',
      body: { code },
    })

    if (!response.success || !response.user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid code',
      })
    }

    // Signed session cookie (HMAC-SHA256 with COBRAS_AUTH_SESSION_SECRET).
    // Throws 500 when the secret is not configured, so login fails visibly.
    setCobrasSessionCookie(event, {
      user: response.user,
      expires_at: response.expires_at
        || new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
    })

    return {
      success: true,
      user: response.user,
    }
  } catch (error: any) {
    console.error('[@cobras/auth-nuxt] Code exchange failed:', error.message)

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Code exchange failed',
    })
  }
})
