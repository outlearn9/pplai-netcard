import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Integration tests — /api/contacts.
 * Uses the in-memory mock Supabase (NEXT_PUBLIC_MOCK_AUTH=true) so no real DB needed.
 */

vi.mock('@/lib/auth', () => ({
  getProfile: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000000',
    clerk_user_id: 'user_mock',
    name: 'Mock User',
    email: 'mock@example.com',
  }),
}))

vi.mock('@/lib/supabase', async () => {
  const store: Record<string, any[]> = { contacts: [], contact_tags: [], contact_notes: [], audit_logs: [] }
  let _id = 1

  function buildQuery(table: string) {
    let _filters: Array<{ col: string; val: unknown }> = []
    let _insertData: any = null
    let _isInsert = false
    let _single = false

    async function execute() {
      const rows = store[table] ?? []
      const filtered = rows.filter(r => _filters.every(f => r[f.col] === f.val))
      if (_isInsert) {
        const toInsert = Array.isArray(_insertData) ? _insertData : [_insertData]
        const inserted = toInsert.map((d: any) => ({ id: `id-${++_id}`, created_at: new Date().toISOString(), ...d }))
        store[table] = [...rows, ...inserted]
        return { data: _single ? inserted[0] : inserted, error: null }
      }
      return { data: _single ? filtered[0] ?? null : filtered, error: null }
    }

    const q: any = {
      select: () => q,
      insert: (d: any) => { _isInsert = true; _insertData = d; return q },
      eq: (col: string, val: unknown) => { _filters.push({ col, val }); return q },
      order: () => q,
      limit: () => q,
      neq: () => q,
      single: () => ({ then: (r: any, j: any) => execute().then(r, j) }),
      then: (r: any, j: any) => execute().then(r, j),
    }
    return q
  }

  return {
    supabaseAdmin: { from: (table: string) => buildQuery(table) },
  }
})

vi.mock('@/lib/response', async () => {
  const actual = await vi.importActual<typeof import('@/lib/response')>('@/lib/response')
  return actual
})

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }))

describe('/api/contacts — POST creates a contact', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when name is missing', async () => {
    const { POST } = await import('../api/contacts/route')
    const req = new NextRequest('http://localhost/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    })
    const res = await POST(req)
    // ContactSchema requires name — fails Zod, err() defaults to 400
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns 201 with valid payload', async () => {
    const { POST } = await import('../api/contacts/route')
    const req = new NextRequest('http://localhost/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jane Doe', email: 'jane@example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })
})
