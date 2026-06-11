import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({
  getProfile: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000001',
    clerk_user_id: 'user_mock',
    name: 'Mock User',
  }),
}))

const store: Record<string, any[]> = { events: [], contacts: [], audit_logs: [] }
let _id = 0

function buildQuery(table: string) {
  let _filters: Array<{ col: string; val: unknown; negate?: boolean }> = []
  let _insertData: any = null
  let _updateData: any = null
  let _isInsert = false
  let _isUpdate = false
  let _isDelete = false
  let _isSingle = false
  let _selectCols = '*'

  async function execute() {
    const rows = store[table] ?? []
    const filtered = rows.filter(r =>
      _filters.every(f => f.negate ? r[f.col] !== f.val : r[f.col] === f.val)
    )
    if (_isInsert) {
      const toInsert = Array.isArray(_insertData) ? _insertData : [_insertData]
      const inserted = toInsert.map((d: any) => ({
        id: `evt-${++_id}`,
        created_at: new Date().toISOString(),
        status: 'upcoming',
        is_active: false,
        ...d,
      }))
      store[table] = [...rows, ...inserted]
      return { data: _isSingle ? inserted[0] : inserted, error: null }
    }
    if (_isUpdate) {
      store[table] = rows.map(r =>
        _filters.every(f => r[f.col] === f.val) ? { ...r, ..._updateData } : r
      )
      const updated = (store[table] ?? []).filter(r =>
        _filters.every(f => r[f.col] === f.val)
      )
      return { data: _isSingle ? updated[0] ?? null : updated, error: null }
    }
    if (_isDelete) {
      store[table] = rows.filter(r =>
        !_filters.every(f => r[f.col] === f.val)
      )
      return { data: null, error: null }
    }
    return { data: _isSingle ? filtered[0] ?? null : filtered, error: null }
  }

  const q: any = {
    select:      (cols?: string) => { _selectCols = cols ?? '*'; return q },
    insert:      (d: any) => { _isInsert = true; _insertData = d; return q },
    update:      (d: any) => { _isUpdate = true; _updateData = d; return q },
    delete:      () => { _isDelete = true; return q },
    eq:          (col: string, val: unknown) => { _filters.push({ col, val }); return q },
    neq:         (col: string, val: unknown) => { _filters.push({ col, val, negate: true }); return q },
    order:       () => q,
    limit:       () => q,
    maybeSingle: () => ({ then: (r: any, j: any) => execute().then(r, j) }),
    single:      () => { _isSingle = true; return { then: (r: any, j: any) => execute().then(r, j) } },
    then:        (r: any, j: any) => execute().then(r, j),
  }
  return q
}

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: (table: string) => buildQuery(table) },
}))

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }))
vi.mock('@/lib/events', () => ({ deactivateAllEvents: vi.fn() }))

function post(url: string, body: object) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/events — POST', () => {
  beforeEach(() => {
    store.events = []
    store.audit_logs = []
    _id = 0
    vi.clearAllMocks()
  })

  it('returns 400 when name is missing', async () => {
    const { POST } = await import('../api/events/route')
    const res = await POST(post('http://localhost/api/events', { location: 'Bangalore' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns 400 when name is empty string', async () => {
    const { POST } = await import('../api/events/route')
    const res = await POST(post('http://localhost/api/events', { name: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 201 with valid minimal payload', async () => {
    const { POST } = await import('../api/events/route')
    const res = await POST(post('http://localhost/api/events', { name: 'TechSummit 2025' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBeDefined()
  })

  it('returns 201 with all optional fields', async () => {
    const { POST } = await import('../api/events/route')
    const res = await POST(post('http://localhost/api/events', {
      name: 'WeWork Koramangala',
      venue_type: 'workspace',
      location: 'Bangalore',
      start_date: '2025-04-25',
    }))
    expect(res.status).toBe(201)
    expect((await res.json()).success).toBe(true)
  })

  it('returns 400 for unknown venue_type', async () => {
    const { POST } = await import('../api/events/route')
    const res = await POST(post('http://localhost/api/events', { name: 'X', venue_type: 'stadium' }))
    expect(res.status).toBe(400)
  })

  it('accepts every valid venue_type without error', async () => {
    const { POST } = await import('../api/events/route')
    const types = ['event', 'workspace', 'travel', 'housing', 'gym', 'clubhouse', 'party']
    for (const venue_type of types) {
      store.events = []; _id = 0
      const res = await POST(post('http://localhost/api/events', { name: 'X', venue_type }))
      expect(res.status, `venue_type "${venue_type}" should return 201`).toBe(201)
    }
  })

  it('calls logAudit after successful create', async () => {
    const { logAudit } = await import('@/lib/audit')
    const { POST } = await import('../api/events/route')
    await POST(post('http://localhost/api/events', { name: 'Audit Test' }))
    expect(logAudit).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      'create',
      'event',
      expect.any(String),
    )
  })

  it('calls deactivateAllEvents when is_active:true', async () => {
    const { deactivateAllEvents } = await import('@/lib/events')
    const { POST } = await import('../api/events/route')
    await POST(post('http://localhost/api/events', { name: 'Active Event', is_active: true }))
    expect(deactivateAllEvents).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001')
  })

  it('does NOT call deactivateAllEvents when is_active is omitted', async () => {
    const { deactivateAllEvents } = await import('@/lib/events')
    const { POST } = await import('../api/events/route')
    await POST(post('http://localhost/api/events', { name: 'Inactive Event' }))
    expect(deactivateAllEvents).not.toHaveBeenCalled()
  })
})

describe('/api/events — GET', () => {
  beforeEach(() => {
    store.events = [
      { id: 'evt-1', profile_id: '00000000-0000-0000-0000-000000000001', name: 'Past Summit', status: 'past', is_active: false, created_at: '2024-01-01' },
      { id: 'evt-2', profile_id: '00000000-0000-0000-0000-000000000001', name: 'Future Conf',  status: 'upcoming', is_active: false, created_at: '2025-01-01' },
    ]
    vi.clearAllMocks()
  })

  it('returns 200 with an array', async () => {
    const { GET } = await import('../api/events/route')
    const req = new NextRequest('http://localhost/api/events')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })
})
