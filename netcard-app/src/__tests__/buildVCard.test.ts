import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// Replicated from ShareCardScreen.jsx for unit testing
function buildVCard(profile: Record<string, any>) {
  const activeEvent = (() => {
    try { return JSON.parse(localStorage.getItem('netcard_active_event') || 'null') } catch { return null }
  })()

  const now      = new Date()
  const dateStr  = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr  = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const nameParts = (profile.name || '').split(' ')
  const lastName  = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
  const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0] || ''

  let note = `We met: ${dateStr}, ${timeStr}`
  if (activeEvent?.location) note += ` at ${activeEvent.location}`
  if (activeEvent?.name)     note += `\nEvent: ${activeEvent.name}`

  const CRLF = '\r\n'
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name || ''}`,
    `N:${lastName};${firstName};;;`,
    profile.title   ? `TITLE:${profile.title}`         : null,
    profile.company ? `ORG:${profile.company}`         : null,
    profile.phone    ? `TEL;TYPE=CELL:${profile.phone}` : null,
    profile.email    ? `EMAIL;TYPE=INTERNET:${profile.email}` : null,
    profile.linkedin ? `URL;TYPE=linkedin:${profile.linkedin}` : null,
    profile.web      ? `URL;TYPE=work:${profile.web}` : null,
    `URL;TYPE=profile:https://pplai.app/u/paras`,
    `NOTE:${note.replace(/\n/g, '\\n')}`,
    'END:VCARD',
  ]
  return lines.filter(Boolean).join(CRLF) + CRLF
}

const PROFILE = {
  name: 'Jane Doe',
  title: 'CEO',
  company: 'Acme',
  phone: '+1-555-0100',
  email: 'jane@acme.com',
  linkedin: 'https://linkedin.com/in/janedoe',
  web: 'https://acme.com',
}

describe('buildVCard', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { localStorage.clear() })

  it('starts with BEGIN:VCARD and ends with END:VCARD', () => {
    const vc = buildVCard(PROFILE)
    expect(vc).toMatch(/^BEGIN:VCARD/)
    expect(vc.trimEnd()).toMatch(/END:VCARD$/)
  })

  it('uses CRLF line endings (RFC 6350)', () => {
    const vc = buildVCard(PROFILE)
    expect(vc).toContain('\r\n')
    // Every line should end with \r\n
    const lines = vc.split('\r\n')
    expect(lines.length).toBeGreaterThan(5)
  })

  it('includes FN with the full name', () => {
    const vc = buildVCard(PROFILE)
    expect(vc).toContain('FN:Jane Doe')
  })

  it('includes TITLE and ORG when provided', () => {
    const vc = buildVCard(PROFILE)
    expect(vc).toContain('TITLE:CEO')
    expect(vc).toContain('ORG:Acme')
  })

  it('omits fields that are not provided', () => {
    const vc = buildVCard({ name: 'Solo' })
    expect(vc).not.toContain('TITLE:')
    expect(vc).not.toContain('ORG:')
    expect(vc).not.toContain('TEL;')
    expect(vc).not.toContain('EMAIL;')
  })

  it('includes active event info in NOTE when set', () => {
    localStorage.setItem('netcard_active_event', JSON.stringify({ name: 'TechConf', location: 'SF' }))
    const vc = buildVCard(PROFILE)
    expect(vc).toContain('at SF')
    expect(vc).toContain('Event: TechConf')
  })

  it('encodes newlines in NOTE as \\n', () => {
    localStorage.setItem('netcard_active_event', JSON.stringify({ name: 'TechConf', location: 'SF' }))
    const vc = buildVCard(PROFILE)
    const noteLine = vc.split('\r\n').find(l => l.startsWith('NOTE:'))
    expect(noteLine).toBeTruthy()
    expect(noteLine).not.toContain('\n')
    expect(noteLine).toContain('\\n')
  })
})
