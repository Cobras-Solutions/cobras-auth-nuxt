import { defineEventHandler, getHeader, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { setCobrasSessionCookie } from '../utils/session'
import { SESSION_MAX_AGE_SECONDS } from '../utils/session-core'

/**
 * IP-based auto-auth probe
 *
 * Forwards the client's real IP to cobras-auth-app's /api/auth/auto endpoint.
 * If the IP is whitelisted (user-specific or global), creates the signed local
 * session cookie.
 *
 * This runs client-side in the background (fire-and-forget) in public mode,
 * so it never blocks page load for regular visitors.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl

  // Get the client's real IP from request headers
  // Priority: cf-connecting-ip (Cloudflare) > x-forwarded-for (proxy) > x-real-ip > fallback
  // cf-connecting-ip is always the true client IP when behind Cloudflare,
  // whereas x-forwarded-for can be overwritten by intermediate proxies (Cloudflare → Vercel)
  const cfIp = getHeader(event, 'cf-connecting-ip')
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIp = getHeader(event, 'x-real-ip')
  const clientIp = cfIp || (forwarded?.split(',')[0]?.trim()) || realIp || '127.0.0.1'

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
      // Signed local session cookie (same helper as the exchange endpoint)
      setCobrasSessionCookie(event, {
        user: response.user,
        expires_at: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
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
