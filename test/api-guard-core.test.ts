import { describe, it, expect } from 'vitest'
import { isGuardedApiPath, matchesRoutePattern } from '../src/runtime/server/utils/api-guard-core'

describe('matchesRoutePattern', () => {
  it('matches exact paths and trailing-* prefixes', () => {
    expect(matchesRoutePattern('/api/health', '/api/health')).toBe(true)
    expect(matchesRoutePattern('/api/health/x', '/api/health')).toBe(false)
    expect(matchesRoutePattern('/api/webhooks/stripe', '/api/webhooks/*')).toBe(true)
    expect(matchesRoutePattern('/api/webhook', '/api/webhooks/*')).toBe(false)
    expect(matchesRoutePattern('/api/x', '')).toBe(false)
  })
})

describe('isGuardedApiPath', () => {
  it('guards app API routes', () => {
    expect(isGuardedApiPath('/api/sites')).toBe(true)
    expect(isGuardedApiPath('/api/sites/pause')).toBe(true)
    expect(isGuardedApiPath('/api')).toBe(true)
    expect(isGuardedApiPath('/api/')).toBe(true)
  })

  it('does not guard pages or non-API paths', () => {
    expect(isGuardedApiPath('/')).toBe(false)
    expect(isGuardedApiPath('/admin')).toBe(false)
    expect(isGuardedApiPath('/apix/foo')).toBe(false)
    expect(isGuardedApiPath('/_nuxt/entry.js')).toBe(false)
  })

  it("leaves the module's own endpoints reachable so login works", () => {
    for (const p of ['verify', 'exchange', 'logout', 'refresh', 'ip-probe']) {
      expect(isGuardedApiPath(`/api/_cobras/${p}`)).toBe(false)
    }
    expect(isGuardedApiPath('/api/_cobrasx')).toBe(true)
  })

  it('honours publicApiRoutes with exact and prefix patterns', () => {
    const allow = ['/api/health', '/api/webhooks/*']
    expect(isGuardedApiPath('/api/health', allow)).toBe(false)
    expect(isGuardedApiPath('/api/healthz', allow)).toBe(true)
    expect(isGuardedApiPath('/api/webhooks/stripe', allow)).toBe(false)
    expect(isGuardedApiPath('/api/sites', allow)).toBe(true)
  })
})
