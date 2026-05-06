import { describe, it, expect } from 'vitest'

// Replicated from AllContactsScreen.jsx for unit testing
const GRADS = ['grad-purple', 'grad-green', 'grad-amber']
function mapContact(c: Record<string, any>) {
  const name = c.name || 'Unknown'
  const grad = GRADS[name.charCodeAt(0) % GRADS.length]
  return {
    id:         c.id,
    initials:   name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    grad,
    textDark:   grad !== 'grad-purple',
    name,
    role:       [c.role, c.company].filter(Boolean).join(' · '),
    tags:       (c.contact_tags || []).map((t: { tag: string }) => t.tag),
    bookmarked: c.bookmarked  || false,
    followed:   c.followed_up || false,
    event:      c.met_event_name   || '',
    roleBucket: c.role_bucket      || '',
    type:       c.contact_type     || '',
    offering:   c.offering_bucket  || '',
    seeking:    c.seeking_bucket   || '',
  }
}

describe('mapContact', () => {
  const raw = {
    id: 'c-1',
    name: 'Jane Doe',
    role: 'Engineer',
    company: 'Acme',
    contact_tags: [{ tag: '#backend' }, { tag: '#api' }],
    bookmarked: true,
    followed_up: false,
    met_event_name: 'TechConf 2025',
    role_bucket: 'Engg',
    contact_type: 'Visitor',
    offering_bucket: 'SaaS',
    seeking_bucket: 'Clients',
  }

  it('produces two-character uppercase initials', () => {
    const c = mapContact(raw)
    expect(c.initials).toBe('JD')
    expect(c.initials).toMatch(/^[A-Z]{1,2}$/)
  })

  it('derives grad from first character code', () => {
    const c = mapContact(raw)
    const expectedGrad = GRADS['J'.charCodeAt(0) % GRADS.length]
    expect(c.grad).toBe(expectedGrad)
  })

  it('textDark is false only for grad-purple', () => {
    const purpleContact = mapContact({ ...raw, name: 'Alex' }) // 'A' → charCode 65, 65%3=2 → grad-amber
    const purpleC = mapContact({ ...raw, name: 'Bob' })        // 'B' → charCode 66, 66%3=0 → grad-purple
    expect(purpleC.grad).toBe('grad-purple')
    expect(purpleC.textDark).toBe(false)
    if (purpleContact.grad !== 'grad-purple') {
      expect(purpleContact.textDark).toBe(true)
    }
  })

  it('joins role and company with ·', () => {
    const c = mapContact(raw)
    expect(c.role).toBe('Engineer · Acme')
  })

  it('maps contact_tags to flat string array', () => {
    const c = mapContact(raw)
    expect(c.tags).toEqual(['#backend', '#api'])
  })

  it('maps followed_up → followed', () => {
    const c = mapContact({ ...raw, followed_up: true })
    expect(c.followed).toBe(true)
  })

  it('handles missing optional fields gracefully', () => {
    const c = mapContact({ id: 'c-2', name: 'Solo' })
    expect(c.role).toBe('')
    expect(c.tags).toEqual([])
    expect(c.bookmarked).toBe(false)
    expect(c.followed).toBe(false)
  })

  it('falls back to Unknown when name is missing', () => {
    const c = mapContact({ id: 'c-3' })
    expect(c.name).toBe('Unknown')
  })
})
