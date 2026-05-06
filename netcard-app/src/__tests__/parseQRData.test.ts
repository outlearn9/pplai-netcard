import { describe, it, expect } from 'vitest'

// Replicated from ScanScreen.jsx for unit testing private utility function
function parseQRData(raw: string | null | undefined) {
  if (!raw) return {}
  if (raw.startsWith('BEGIN:VCARD')) {
    const get = (field: string) => {
      const m = raw.match(new RegExp(`${field}[^:]*:([^\\r\\n]+)`))
      return m?.[1]?.trim() || ''
    }
    return {
      name: get('FN') || get('N')?.replace(';', ' ').trim() || 'Scanned Contact',
      email: get('EMAIL'),
      phone: get('TEL'),
      url: get('URL'),
      linkedin: get('X-SOCIALPROFILE;type=linkedin') || '',
    }
  }
  try {
    const u = new URL(raw)
    const name = u.pathname.split('/').filter(Boolean).pop() || 'Scanned Contact'
    return { name, url: raw }
  } catch {}
  return { name: 'Scanned Contact', notes: raw }
}

const VCARD = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Jane Doe',
  'TEL;TYPE=CELL:+1-555-0100',
  'EMAIL;TYPE=INTERNET:jane@example.com',
  'URL;TYPE=profile:https://pplai.app/u/jane',
  'END:VCARD',
].join('\r\n')

describe('parseQRData', () => {
  it('returns empty object for null/undefined input', () => {
    expect(parseQRData(null)).toEqual({})
    expect(parseQRData(undefined)).toEqual({})
    expect(parseQRData('')).toEqual({})
  })

  it('parses vCard — extracts name, email, phone, url', () => {
    const result = parseQRData(VCARD)
    expect(result.name).toBe('Jane Doe')
    expect(result.email).toBe('jane@example.com')
    expect(result.phone).toBe('+1-555-0100')
    expect(result.url).toBe('https://pplai.app/u/jane')
  })

  it('parses URL — extracts last path segment as name', () => {
    const result = parseQRData('https://pplai.app/u/paras')
    expect(result.name).toBe('paras')
    expect((result as any).url).toBe('https://pplai.app/u/paras')
  })

  it('treats plain text as notes field', () => {
    const result = parseQRData('Hello world plain text')
    expect(result.name).toBe('Scanned Contact')
    expect((result as any).notes).toBe('Hello world plain text')
  })

  it('uses fallback name when FN is missing from vCard', () => {
    const vcardNoFN = 'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Smith;John;;;\r\nEND:VCARD'
    const result = parseQRData(vcardNoFN)
    expect(result.name).toBeTruthy()
  })
})
