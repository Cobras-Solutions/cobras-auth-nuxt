import { describe, it, expect } from 'vitest'
import {
  encodeSession,
  decodeSession,
  normalizeSessionSecret,
  SESSION_TOKEN_VERSION,
} from '../src/runtime/server/utils/session-core'
import type { CobrasSession } from '../src/types'

const SECRET = 'test-secret-0123456789-abcdefghijklmnopqrstuvwxyz'
const NOW = new Date('2026-10-29T12:00:00.000Z')

function session(overrides: Partial<CobrasSession> = {}): CobrasSession {
  return {
    user: { id: 'u1', email: 'angel@example.test', name: 'Angel', role: 'admin' },
    expires_at: new Date(NOW.getTime() + 60 * 60 * 1000).toISOString(),
    ...overrides,
  }
}

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url')
}

describe('normalizeSessionSecret', () => {
  it('returns null for missing, blank or non-string secrets', () => {
    expect(normalizeSessionSecret(undefined)).toBeNull()
    expect(normalizeSessionSecret(null)).toBeNull()
    expect(normalizeSessionSecret('')).toBeNull()
    expect(normalizeSessionSecret('   ')).toBeNull()
    expect(normalizeSessionSecret(42)).toBeNull()
  })

  it('trims a real secret', () => {
    expect(normalizeSessionSecret('  abc  ')).toBe('abc')
  })
})

describe('encodeSession / decodeSession', () => {
  it('round-trips a session with the right secret', () => {
    const s = session()
    const token = encodeSession(s, SECRET)
    expect(token.startsWith(`${SESSION_TOKEN_VERSION}.`)).toBe(true)
    expect(token.split('.')).toHaveLength(3)
    expect(decodeSession(token, SECRET, NOW)).toEqual(s)
  })

  it('never accepts anything when the secret is missing', () => {
    const token = encodeSession(session(), SECRET)
    expect(decodeSession(token, null, NOW)).toBeNull()
    expect(decodeSession(token, '', NOW)).toBeNull()
  })

  it('rejects a token signed with a different secret', () => {
    const token = encodeSession(session(), 'another-secret-that-is-also-long-enough')
    expect(decodeSession(token, SECRET, NOW)).toBeNull()
  })

  it('rejects a tampered payload (role escalation) even with a valid-looking signature', () => {
    const token = encodeSession(session({ user: { id: 'u2', email: 'x@example.test', name: 'X', role: 'user' } }), SECRET)
    const [version, , sig] = token.split('.')
    const forgedPayload = b64url(session({ user: { id: 'u2', email: 'x@example.test', name: 'X', role: 'admin' } }))
    expect(decodeSession(`${version}.${forgedPayload}.${sig}`, SECRET, NOW)).toBeNull()
  })

  it('rejects a tampered signature', () => {
    const token = encodeSession(session(), SECRET)
    const parts = token.split('.')
    const sig = parts[2]
    const flipped = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1)
    expect(decodeSession(`${parts[0]}.${parts[1]}.${flipped}`, SECRET, NOW)).toBeNull()
    expect(decodeSession(`${parts[0]}.${parts[1]}.${sig.slice(0, -1)}`, SECRET, NOW)).toBeNull()
  })

  it('rejects the legacy unsigned base64 cookie (pre-1.0.12 sessions end on upgrade)', () => {
    const legacy = Buffer.from(JSON.stringify(session()), 'utf8').toString('base64')
    expect(decodeSession(legacy, SECRET, NOW)).toBeNull()
  })

  it('rejects an expired session', () => {
    const expired = session({ expires_at: new Date(NOW.getTime() - 1000).toISOString() })
    const token = encodeSession(expired, SECRET)
    expect(decodeSession(token, SECRET, NOW)).toBeNull()
    // ...and accepts it when "now" is before expiry
    expect(decodeSession(token, SECRET, new Date(NOW.getTime() - 5000))).toEqual(expired)
  })

  it('rejects a correctly signed payload with a malformed shape or expiry', () => {
    const cases: unknown[] = [
      { user: { id: 'u1', email: 'a@b', name: 'A', role: 'superuser' }, expires_at: session().expires_at },
      { user: null, expires_at: session().expires_at },
      { user: session().user, expires_at: 'not-a-date' },
      { user: session().user },
      'just-a-string',
      [1, 2, 3],
    ]
    for (const payload of cases) {
      const token = encodeSession(payload as unknown as CobrasSession, SECRET)
      expect(decodeSession(token, SECRET, NOW)).toBeNull()
    }
  })

  it('rejects garbage without throwing', () => {
    for (const garbage of [undefined, null, 42, '', 'v1', 'v1.', 'v1..', 'a.b.c', 'v2.x.y', 'v1.%%%.***', 'v1.'.padEnd(10000, 'a')]) {
      expect(() => decodeSession(garbage, SECRET, NOW)).not.toThrow()
      expect(decodeSession(garbage, SECRET, NOW)).toBeNull()
    }
  })
})
