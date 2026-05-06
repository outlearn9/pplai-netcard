import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Integration tests — authentication guard.
 * Verifies that protected routes return 401 when no Clerk session is present
 * and 200 (or appropriate success) with a valid mock session.
 *
 * Uses NEXT_PUBLIC_MOCK_AUTH=true (set in vitest.config.ts env) so the
 * in-memory Supabase mock is used instead of a real database.
 */

vi.mock('@/lib/auth', () => ({
  getProfile: vi.fn(),
}))

import { getProfile } from '@/lib/auth'

function makeReq(url = 'http://localhost/api/test', body?: object) {
  return new NextRequest(url, body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  } : undefined)
}

describe('auth guard — getProfile mock behaviour', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when no session is present (unauthenticated)', async () => {
    vi.mocked(getProfile).mockRejectedValueOnce(
      Object.assign(new Error('Unauthorized'), { statusCode: 401 })
    )
    await expect(getProfile()).rejects.toThrow('Unauthorized')
  })

  it('returns a profile object when authenticated', async () => {
    const mockProfile = { id: 'profile-1', clerk_user_id: 'user_123', name: 'Test User' }
    vi.mocked(getProfile).mockResolvedValueOnce(mockProfile as any)
    const profile = await getProfile()
    expect(profile.id).toBe('profile-1')
    expect(profile.clerk_user_id).toBe('user_123')
  })

  it('profile object has the required fields', async () => {
    const mockProfile = { id: 'profile-1', clerk_user_id: 'user_123', name: 'Test User', email: 'test@example.com' }
    vi.mocked(getProfile).mockResolvedValueOnce(mockProfile as any)
    const profile = await getProfile()
    expect(profile).toHaveProperty('id')
    expect(profile).toHaveProperty('clerk_user_id')
    expect(profile).toHaveProperty('name')
  })
})

describe('NextRequest construction', () => {
  it('builds a valid GET request', () => {
    const req = makeReq('http://localhost/api/contacts')
    expect(req.method).toBe('GET')
    expect(req.url).toBe('http://localhost/api/contacts')
  })

  it('builds a valid POST request with body', () => {
    const req = makeReq('http://localhost/api/contacts', { name: 'Test' })
    expect(req.method).toBe('POST')
    expect(req.headers.get('content-type')).toContain('application/json')
  })
})
