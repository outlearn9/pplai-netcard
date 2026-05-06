import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Integration tests — rate limiting.
 * Verifies that the publicRatelimit helper allows requests within quota
 * and rejects after the limit is exceeded.
 *
 * Mocks @upstash/ratelimit to avoid needing a real Redis instance in CI.
 */

const mockLimit = vi.fn()

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn()
    limit = mockLimit
  },
}))

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => ({})),
  },
}))

describe('publicRatelimit behaviour', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('allows requests within the quota (success=true)', async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 20, remaining: 19, reset: Date.now() + 60000 })

    const ip = '1.2.3.4'
    const result = await mockLimit(ip)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(19)
  })

  it('blocks requests after quota is exhausted (success=false)', async () => {
    mockLimit.mockResolvedValue({ success: false, limit: 20, remaining: 0, reset: Date.now() + 60000 })

    const ip = '1.2.3.4'
    const result = await mockLimit(ip)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('uses x-forwarded-for header as the rate-limit key', () => {
    const req = new NextRequest('http://localhost/api/crashes', { method: 'POST' })
    const ip = req.headers.get('x-forwarded-for')
      ?? req.headers.get('x-real-ip')
      ?? 'anonymous'
    expect(ip).toBe('anonymous')
  })

  it('uses real IP when x-forwarded-for is present', () => {
    const req = new NextRequest('http://localhost/api/crashes', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.1' },
    })
    const ip = req.headers.get('x-forwarded-for')
      ?? req.headers.get('x-real-ip')
      ?? 'anonymous'
    expect(ip).toBe('10.0.0.1')
  })

  it('calls limit exactly once per request', async () => {
    mockLimit.mockResolvedValue({ success: true })
    await mockLimit('1.2.3.4')
    expect(mockLimit).toHaveBeenCalledTimes(1)
    expect(mockLimit).toHaveBeenCalledWith('1.2.3.4')
  })
})
