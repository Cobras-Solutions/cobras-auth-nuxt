import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createApp, defineEventHandler, toNodeListener, type App } from 'h3'
import apiGuard from '../src/runtime/server/middleware/api-guard'
import { requireCobrasSession, getCobrasSession, SESSION_COOKIE_NAME } from '../src/runtime/server/utils/session'
import { encodeSession } from '../src/runtime/server/utils/session-core'
import { resetRuntimeConfig } from './stubs/imports'
import type { CobrasSession } from '../src/types'

const SECRET = 'guard-test-secret-0123456789-abcdefghijklmnop'

function makeSession(overrides: Partial<CobrasSession> = {}): CobrasSession {
  return {
    user: { id: 'u1', email: 'angel@example.test', name: 'Angel', role: 'admin' },
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ...overrides,
  }
}

let server: Server
let baseUrl: string

function buildApp(): App {
  const app = createApp()
  app.use(apiGuard)
  app.use('/api/_cobras/verify', defineEventHandler(() => ({ module: 'verify reachable' })))
  app.use('/api/health', defineEventHandler(() => ({ ok: true })))
  app.use('/api/webhooks/stripe', defineEventHandler(() => ({ hook: true })))
  app.use('/api/admin/sites', defineEventHandler(event => ({
    guardedBy: 'middleware',
    user: getCobrasSession(event)?.user.email ?? null,
  })))
  // A route that guards itself with the exported helper (works in any mode)
  app.use('/api/self-guarded', defineEventHandler((event) => {
    const session = requireCobrasSession(event)
    return { email: session.user.email }
  }))
  app.use('/page', defineEventHandler(() => 'a page'))
  return app
}

async function get(path: string, cookie?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: 'manual',
  })
  const text = await res.text()
  return { status: res.status, text }
}

beforeAll(async () => {
  server = createServer(toNodeListener(buildApp()))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port}`
})

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()))
})

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  delete process.env.COBRAS_AUTH_SESSION_SECRET
  resetRuntimeConfig({ mode: 'internal', sessionSecret: SECRET, publicApiRoutes: ['/api/health', '/api/webhooks/*'] })
})

describe('internal mode API guard', () => {
  it('denies /api/** without a session', async () => {
    const r = await get('/api/admin/sites')
    expect(r.status).toBe(401)
  })

  it('denies a forged (unsigned base64) cookie', async () => {
    const legacy = Buffer.from(JSON.stringify(makeSession()), 'utf8').toString('base64')
    const r = await get('/api/admin/sites', `${SESSION_COOKIE_NAME}=${legacy}`)
    expect(r.status).toBe(401)
  })

  it('denies a cookie signed with the wrong secret', async () => {
    const token = encodeSession(makeSession(), 'some-other-secret-that-is-long-enough-too')
    const r = await get('/api/admin/sites', `${SESSION_COOKIE_NAME}=${token}`)
    expect(r.status).toBe(401)
  })

  it('denies an expired signed cookie', async () => {
    const token = encodeSession(makeSession({ expires_at: new Date(Date.now() - 1000).toISOString() }), SECRET)
    const r = await get('/api/admin/sites', `${SESSION_COOKIE_NAME}=${token}`)
    expect(r.status).toBe(401)
  })

  it('allows a valid signed cookie and exposes the session to the route', async () => {
    const token = encodeSession(makeSession(), SECRET)
    const r = await get('/api/admin/sites', `${SESSION_COOKIE_NAME}=${token}`)
    expect(r.status).toBe(200)
    expect(JSON.parse(r.text)).toEqual({ guardedBy: 'middleware', user: 'angel@example.test' })
  })

  it('denies everything when the secret is missing, even a cookie signed with the old secret', async () => {
    const token = encodeSession(makeSession(), SECRET)
    resetRuntimeConfig({ mode: 'internal', sessionSecret: '' })
    const r = await get('/api/admin/sites', `${SESSION_COOKIE_NAME}=${token}`)
    expect(r.status).toBe(401)
  })

  it('accepts the secret from the plain COBRAS_AUTH_SESSION_SECRET env var', async () => {
    resetRuntimeConfig({ mode: 'internal', sessionSecret: '' })
    process.env.COBRAS_AUTH_SESSION_SECRET = SECRET
    const token = encodeSession(makeSession(), SECRET)
    const r = await get('/api/admin/sites', `${SESSION_COOKIE_NAME}=${token}`)
    expect(r.status).toBe(200)
  })

  it("leaves the module's own endpoints reachable without a session", async () => {
    const r = await get('/api/_cobras/verify')
    expect(r.status).toBe(200)
  })

  it('leaves publicApiRoutes reachable without a session', async () => {
    expect((await get('/api/health')).status).toBe(200)
    expect((await get('/api/webhooks/stripe')).status).toBe(200)
  })

  it('does not touch non-API paths', async () => {
    const r = await get('/page')
    expect(r.status).toBe(200)
    expect(r.text).toBe('a page')
  })

  it('can be switched off with guardApiRoutes: false', async () => {
    resetRuntimeConfig({ mode: 'internal', sessionSecret: SECRET, guardApiRoutes: false })
    expect((await get('/api/admin/sites')).status).toBe(200)
  })
})

describe('public mode', () => {
  beforeEach(() => {
    resetRuntimeConfig({ mode: 'public', sessionSecret: SECRET })
  })

  it('does not guard /api/** (SCN / PAS / cobras-sites behaviour unchanged)', async () => {
    const r = await get('/api/admin/sites')
    expect(r.status).toBe(200)
    expect(JSON.parse(r.text).user).toBeNull()
  })

  it('still lets a route guard itself with requireCobrasSession', async () => {
    expect((await get('/api/self-guarded')).status).toBe(401)
    const token = encodeSession(makeSession(), SECRET)
    const r = await get('/api/self-guarded', `${SESSION_COOKIE_NAME}=${token}`)
    expect(r.status).toBe(200)
    expect(JSON.parse(r.text)).toEqual({ email: 'angel@example.test' })
  })
})
