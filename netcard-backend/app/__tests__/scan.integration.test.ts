import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({
  getProfile: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000002',
    clerk_user_id: 'user_scan',
    name: 'Scan User',
  }),
}))

const store: Record<string, any[]> = { contacts: [], events: [], notifications: [], audit_logs: [] }
let _id = 0

function buildQuery(table: string) {
  let _filters: Array<{ col: string; val: unknown }> = []
  let _insertData: any = null
  let _isInsert = false
  let _isMaybeSingle = false
  let _isSingle = false

  async function execute() {
    const rows = store[table] ?? []
    const filtered = rows.filter(r => _filters.every(f => r[f.col] === f.val))
    if (_isInsert) {
      const toInsert = Array.isArray(_insertData) ? _insertData : [_insertData]
      const inserted = toInsert.map((d: any) => ({
        id: `id-${++_id}`, created_at: new Date().toISOString(), ...d,
      }))
      store[table] = [...rows, ...inserted]
      return { data: _isSingle ? inserted[0] : inserted, error: null }
    }
    if (_isMaybeSingle) return { data: filtered[0] ?? null, error: null }
    return { data: _isSingle ? filtered[0] ?? null : filtered, error: null }
  }

  const q: any = {
    select:      () => q,
    insert:      (d: any) => { _isInsert = true; _insertData = d; return q },
    eq:          (col: string, val: unknown) => { _filters.push({ col, val }); return q },
    maybeSingle: () => { _isMaybeSingle = true; return { then: (r: any, j: any) => execute().then(r, j) } },
    single:      () => { _isSingle = true; return { then: (r: any, j: any) => execute().then(r, j) } },
    then:        (r: any, j: any) => execute().then(r, j),
  }
  return q
}

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: (table: string) => buildQuery(table) },
}))

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }))

function post(body: object) {
  return new NextRequest('http://localhost/api/contacts/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/contacts/scan — POST', () => {
  beforeEach(() => {
    store.contacts = []; store.notifications = []; store.events = []; store.audit_logs = []
    _id = 0
    vi.clearAllMocks()
  })

  it('returns 400 when no name is derivable', async () => {
    const { POST } = await import('../api/contacts/scan/route')
    const res = await POST(post({ email: 'nobody@example.com' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('creates a contact from pre-parsed fields', async () => {
    const { POST } = await import('../api/contacts/scan/route')
    const res = await POST(post({ name: 'Arjun Mehta', email: 'arjun@razorpay.com', phone: '+919876543210' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  it('derives avatar_initials from name', async () => {
    const { POST } = await import('../api/contacts/scan/route')
    await POST(post({ name: 'Sarah Raines' }))
    const saved = store.contacts[0]
    expect(saved.avatar_initials).toBe('SR')
  })

  it('parses a raw vCard and creates a contact', async () => {
    const { POST } = await import('../api/contacts/scan/route')
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Lisa Chen',
      'TEL:+12125550199',
      'EMAIL:lisa@figma.com',
      'ORG:Figma',
      'TITLE:VP Sales',
      'END:VCARD',
    ].join('\r\n')

    const res = await POST(post({ raw_vcard: vcard }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)

    const saved = store.contacts[0]
    expect(saved.name).toBe('Lisa Chen')
    expect(saved.email).toBe('lisa@figma.com')
    expect(saved.company).toBe('Figma')
    expect(saved.role).toBe('VP Sales')
  })

  it('stores qr_data as linkedin_url when it is a valid URL', async () => {
    const { POST } = await import('../api/contacts/scan/route')
    await POST(post({ name: 'James Wu', qr_data: 'https://linkedin.com/in/jameswu' }))
    const saved = store.contacts[0]
    expect(saved.linkedin_url).toBe('https://linkedin.com/in/jameswu')
  })

  it('does not overwrite linkedin_url when qr_data is also provided', async () => {
    const { POST } = await import('../api/contacts/scan/route')
    await POST(post({
      name: 'Omar Farooq',
      linkedin_url: 'https://linkedin.com/in/omarfarooq',
      qr_data: 'https://some-other-url.com',
    }))
    const saved = store.contacts[0]
    expect(saved.linkedin_url).toBe('https://linkedin.com/in/omarfarooq')
  })

  it('attaches the active event when one exists', async () => {
    store.events = [{
      id: 'evt-active',
      profile_id: '00000000-0000-0000-0000-000000000002',
      name: 'TechSummit 2025',
      location: 'Bangalore',
      venue_type: 'event',
      is_active: true,
    }]

    const { POST } = await import('../api/contacts/scan/route')
    await POST(post({ name: 'Priya Nair' }))
    const saved = store.contacts[0]
    expect(saved.event_id).toBe('evt-active')
    expect(saved.met_event_name).toBe('TechSummit 2025')
    expect(saved.met_venue_type).toBe('event')
  })

  it('leaves event fields null when no active event', async () => {
    const { POST } = await import('../api/contacts/scan/route')
    await POST(post({ name: 'No Event Contact' }))
    const saved = store.contacts[0]
    expect(saved.event_id).toBeNull()
    expect(saved.met_event_name).toBeNull()
  })

  it('inserts a connection notification after saving', async () => {
    const { POST } = await import('../api/contacts/scan/route')
    await POST(post({ name: 'Deepa Menon' }))
    expect(store.notifications.length).toBe(1)
    expect(store.notifications[0].type).toBe('connection')
    expect(store.notifications[0].title).toContain('Deepa Menon')
  })

  it('calls logAudit after successful scan', async () => {
    const { logAudit } = await import('@/lib/audit')
    const { POST } = await import('../api/contacts/scan/route')
    await POST(post({ name: 'Audit Scan' }))
    expect(logAudit).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000002',
      'create',
      'contact',
      expect.any(String),
    )
  })

  it('returns 400 for vCard with no FN field', async () => {
    const { POST } = await import('../api/contacts/scan/route')
    const vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nTEL:+1234567890\r\nEND:VCARD'
    const res = await POST(post({ raw_vcard: vcard }))
    expect(res.status).toBe(400)
  })

  it('sets source to qr_scan', async () => {
    const { POST } = await import('../api/contacts/scan/route')
    await POST(post({ name: 'Source Test' }))
    expect(store.contacts[0].source).toBe('qr_scan')
  })
})
