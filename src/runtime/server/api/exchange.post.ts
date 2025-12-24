import { defineEventHandler, readBody, createError, setCookie } from 'h3'
import { useRuntimeConfig } from '#imports'

/**
 * Exchange auth code for user session
 *
 * Called after redirect from cobras-auth with a one-time code.
 * Exchanges the code for user info and sets a local session cookie.
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

    // Create a session token (simple JSON with user + expiry)
    const session = {
      user: response.user,
      expires_at: response.expires_at,
    }

    // Set session cookie (encrypted in production, consider using h3 session)
    const sessionData = Buffer.from(JSON.stringify(session)).toString('base64')

    setCookie(event, 'cobras_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
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
