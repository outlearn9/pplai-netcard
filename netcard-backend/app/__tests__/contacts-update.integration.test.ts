import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const OWNER_ID = '00000000-0000-0000-0000-000000000003'

vi.mock('@/lib/auth', () => ({
  getProfile: vi.fn().mockResolvedValue({
    id: OWNER_ID,
    clerk_user_id: 'user_update',
    name: 'Update User',
  }),
}))

const store: Record<string, any[]> = {
  contacts: [],
  contact_notes: [],
  contact_tags: [],
  events: [],
  audit_logs: [],
}

function buildQuery(table: string) {
  let _filters: Array<{ col: string; val: unknown }> = []
  let _updateData: any = null
  let _isUpdate = false
  let _isDelete = false
  let _isSingle = false
  let _selectCols = '*'

  async function execute() {
    const rows = store[table] ?? []
    const filtered = rows.filter(r => _filters.every(f => r[f.col] === f.val))
    if (_isUpdate) {
      store[table] = rows.map(r =>
        _filters.every(f => r[f.col] === f.val) ? { ...r, ..._updateData } : r
      )
      const updated = (store[table] ?? []).filter(r => _filters.every(f => r[f.col] === f.val))
      return { data: _isSingle ? updated[0] ?? null : updated, error: null }
    }
    if (_isDelete) {
      store[table] = rows.filter(r => !_filters.every(f => r[f.col] === f.val))
      return { data: null, error: null }
    }
    return { data: _isSingle ? filtered[0] ?? null : filtered, error: null }
  }

  const q: any = {
    select:      (cols?: string) => { _selectCols = cols ?? '*'; return q },
    update:      (d: any) => { _isUpdate = true; _updateData = d; return q },
    delete:      () => { _isDelete = true; return q },
    eq:          (col: string, val: unknown) => { _filters.push({ col, val }); return q },
    order:       () => q,
    single:      () => { _isSingle = true; return { then: (r: any, j: any) => execute().then(r, j) } },
    maybeSingle: () => ({ then: (r: any, j: any) => execute().then(r, j) }),
    then:        (r: any, j: any) => execute().then(r, j),
  }
  return q
}

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: (table: string) => buildQuery(table) },
}))

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }))

function seedContact(overrides: object = {}) {
  const c = {
    id: 'contact-abc',
    owner_id: OWNER_ID,
    name: 'Sarah Raines',
    bookmarked: false,
    followed_up: false,
    ...overrides,
  }
  store.contacts.push(c)
  return c
}

function put(id: string, body: object) {
  return new NextRequest(`http://localhost/api/contacts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function del(id: string) {
  return new NextRequest(`http://localhost/api/contacts/${id}`, { method: 'DELETE' })
}

describe('/api/contacts/[id] — PUT (update)', () => {
  beforeEach(() => {
    store.contacts = []; store.audit_logs = []
    vi.clearAllMocks()
  })

  it('toggles bookmarked to true', async () => {
    seedContact({ bookmarked: false })
    const { PUT } = await import('../api/contacts/[id]/route')
    const res = await PUT(put('contact-abc', { bookmarked: true }), { params: Promise.resolve({ id: 'contact-abc' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(store.contacts[0].bookmarked).toBe(true)
  })

  it('toggles followed_up to true', async () => {
    seedContact({ followed_up: false })
    const { PUT } = await import('../api/contacts/[id]/route')
    const res = await PUT(put('contact-abc', { followed_up: true }), { params: Promise.resolve({ id: 'contact-abc' }) })
    expect(res.status).toBe(200)
    expect(store.contacts[0].followed_up).toBe(true)
  })

  it('returns 400 when name is empty string', async () => {
    seedContact()
    const { PUT } = await import('../api/contacts/[id]/route')
    const res = await PUT(put('contact-abc', { name: '' }), { params: Promise.resolve({ id: 'contact-abc' }) })
    expect(res.status).toBe(400)
  })

  it('accepts partial update (only role)', async () => {
    seedContact()
    const { PUT } = await import('../api/contacts/[id]/route')
    const res = await PUT(put('contact-abc', { role: 'CTO' }), { params: Promise.resolve({ id: 'contact-abc' }) })
    expect(res.status).toBe(200)
    expect(store.contacts[0].role).toBe('CTO')
  })

  it('rejects invalid email in update', async () => {
    seedContact()
    const { PUT } = await import('../api/contacts/[id]/route')
    const res = await PUT(put('contact-abc', { email: 'not-an-email' }), { params: Promise.resolve({ id: 'contact-abc' }) })
    expect(res.status).toBe(400)
  })

  it('calls logAudit with update action', async () => {
    const { logAudit } = await import('@/lib/audit')
    seedContact()
    const { PUT } = await import('../api/contacts/[id]/route')
    await PUT(put('contact-abc', { bookmarked: true }), { params: Promise.resolve({ id: 'contact-abc' }) })
    expect(logAudit).toHaveBeenCalledWith(OWNER_ID, 'update', 'contact', 'contact-abc')
  })

  it('only updates own contacts (scoped by owner_id in query)', async () => {
    // A contact owned by a different user
    store.contacts.push({ id: 'other-contact', owner_id: 'other-user', bookmarked: false })
    const { PUT } = await import('../api/contacts/[id]/route')
    await PUT(put('other-contact', { bookmarked: true }), { params: Promise.resolve({ id: 'other-contact' }) })
    // The mock filters by owner_id — other user's contact stays unchanged
    const other = store.contacts.find(c => c.id === 'other-contact')
    expect(other?.bookmarked).toBe(false)
  })
})

describe('/api/contacts/[id] — DELETE', () => {
  beforeEach(() => {
    store.contacts = []; store.audit_logs = []
    vi.clearAllMocks()
  })

  it('removes the contact and returns { deleted: true }', async () => {
    seedContact()
    expect(store.contacts).toHaveLength(1)
    const { DELETE } = await import('../api/contacts/[id]/route')
    const res = await DELETE(del('contact-abc'), { params: Promise.resolve({ id: 'contact-abc' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.deleted).toBe(true)
    expect(store.contacts).toHaveLength(0)
  })

  it('calls logAudit with delete action', async () => {
    const { logAudit } = await import('@/lib/audit')
    seedContact()
    const { DELETE } = await import('../api/contacts/[id]/route')
    await DELETE(del('contact-abc'), { params: Promise.resolve({ id: 'contact-abc' }) })
    expect(logAudit).toHaveBeenCalledWith(OWNER_ID, 'delete', 'contact', 'contact-abc')
  })
})
