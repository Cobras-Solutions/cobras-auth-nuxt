import { defineEventHandler, getHeader, setCookie, createError } from 'h3'
import { useRuntimeConfig } from '#imports'

/**
 * IP-based auto-auth probe
 *
 * Forwards the client's real IP to cobras-auth-app's /api/auth/auto endpoint.
 * If the IP is whitelisted (user-specific or global), creates a local session cookie.
 *
 * This runs client-side in the background (fire-and-forget) in public mode,
 * so it never blocks page load for regular visitors.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl

  // Get the client's real IP from request headers (set by Vercel/proxy)
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIp = getHeader(event, 'x-real-ip')
  const cfIp = getHeader(event, 'cf-connecting-ip')
  const clientIp = (forwarded?.split(',')[0]?.trim()) || realIp || cfIp || '127.0.0.1'

  try {
    // Call cobras-auth-app's auto-auth endpoint, forwarding the client IP
    const response = await $fetch<{
      success: boolean
      user: {
        id: string
        email: string
        name: string
        role: 'admin' | 'user'
        canAccessAdmin?: boolean
        isAutoAuth?: boolean
      }
    }>(`${authServiceUrl}/api/auth/auto`, {
      method: 'POST',
      headers: {
        'x-forwarded-for': clientIp,
        'x-real-ip': clientIp,
      },
    })

    if (response.success && response.user) {
      // Create local session cookie (same as exchange endpoint)
      const session = {
        user: response.user,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }

      const sessionData = Buffer.from(JSON.stringify(session)).toString('base64')

      setCookie(event, 'cobras_session', sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60, // 24 hours
      })

      return {
        valid: true,
        user: response.user,
      }
    }

    throw createError({
      statusCode: 401,
      message: 'IP not authorized',
    })
  } catch (error: any) {
    if (error.statusCode === 401) {
      throw createError({
        statusCode: 401,
        message: 'IP not authorized',
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'IP probe failed',
    })
  }
})
