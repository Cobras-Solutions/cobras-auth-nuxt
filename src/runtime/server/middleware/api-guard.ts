import { defineEventHandler, getRequestURL, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { isGuardedApiPath } from '../utils/api-guard-core'
import { getCobrasSession } from '../utils/session'

/**
 * Internal-mode API guard.
 *
 * In `mode: 'internal'`, every request under `/api/**` must carry a valid
 * signed `cobras_session` cookie, except the module's own `/api/_cobras/*`
 * endpoints and any `publicApiRoutes` configured by the app. In `public`
 * mode this middleware does nothing.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  if (config.public.cobrasAuth?.mode !== 'internal') return
  if (config.cobrasAuth?.guardApiRoutes === false) return

  const publicApiRoutes: string[] = Array.isArray(config.cobrasAuth?.publicApiRoutes)
    ? config.cobrasAuth.publicApiRoutes
    : []

  const rawPath = getRequestURL(event).pathname
  let decodedPath = rawPath
  try {
    decodedPath = decodeURIComponent(rawPath)
  } catch {
    decodedPath = rawPath
  }

  // Fail closed: a path is exempt only if both its raw and decoded forms are.
  const guarded = isGuardedApiPath(rawPath, publicApiRoutes) || isGuardedApiPath(decodedPath, publicApiRoutes)
  if (!guarded) return

  if (!getCobrasSession(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Not authenticated',
    })
  }
})
