import { describe, it, expect } from 'vitest'

// Replicated from EventContactsScreen.jsx for unit testing
function parseLinkedInUrl(raw: string): { linkedin: string; name: string } {
  const s = raw.trim()
  try {
    const url = new URL(s.startsWith('http') ? s : `https://${s}`)
    const match = url.pathname.match(/\/in\/([^/?#]+)/i)
    if (match) {
      const slug = decodeURIComponent(match[1]).replace(/-+$/, '')
      const name = slug.includes('-')
        ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : slug.charAt(0).toUpperCase() + slug.slice(1)
      return { linkedin: `https://www.linkedin.com/in/${slug}`, name }
    }
  } catch {}
  return { linkedin: s, name: '' }
}

describe('parseLinkedInUrl', () => {
  it('parses a full https LinkedIn URL', () => {
    const result = parseLinkedInUrl('https://linkedin.com/in/parasgupta')
    expect(result.linkedin).toBe('https://www.linkedin.com/in/parasgupta')
    expect(result.name).toBe('Parasgupta')
  })

  it('parses a URL without https prefix', () => {
    const result = parseLinkedInUrl('linkedin.com/in/parasgupta')
    expect(result.linkedin).toBe('https://www.linkedin.com/in/parasgupta')
    expect(result.name).toBe('Parasgupta')
  })

  it('converts hyphenated slug to title-cased name', () => {
    const result = parseLinkedInUrl('https://linkedin.com/in/sarah-raines')
    expect(result.name).toBe('Sarah Raines')
    expect(result.linkedin).toBe('https://www.linkedin.com/in/sarah-raines')
  })

  it('handles multi-word hyphenated slugs', () => {
    const result = parseLinkedInUrl('linkedin.com/in/omar-al-farooq')
    expect(result.name).toBe('Omar Al Farooq')
  })

  it('strips trailing hyphens from slug', () => {
    const result = parseLinkedInUrl('https://linkedin.com/in/arjunmehta-')
    expect(result.linkedin).toBe('https://www.linkedin.com/in/arjunmehta')
  })

  it('preserves the canonical linkedin.com domain in output', () => {
    const result = parseLinkedInUrl('https://www.linkedin.com/in/lisachen')
    expect(result.linkedin).toContain('linkedin.com/in/')
  })

  it('decodes URL-encoded characters in slug', () => {
    const result = parseLinkedInUrl('https://linkedin.com/in/priya%20nair')
    expect(result.name).toContain('Priya')
  })

  it('returns empty name and raw string for non-LinkedIn URL', () => {
    const result = parseLinkedInUrl('https://twitter.com/parasgupta')
    expect(result.name).toBe('')
    expect(result.linkedin).toBe('https://twitter.com/parasgupta')
  })

  it('returns empty name and raw string for plain text', () => {
    const result = parseLinkedInUrl('just some text')
    expect(result.name).toBe('')
    expect(result.linkedin).toBe('just some text')
  })

  it('handles URL with query params gracefully', () => {
    const result = parseLinkedInUrl('https://linkedin.com/in/james-wu?utm_source=share')
    expect(result.name).toBe('James Wu')
    expect(result.linkedin).toBe('https://www.linkedin.com/in/james-wu')
  })

  it('handles empty string input', () => {
    const result = parseLinkedInUrl('')
    expect(result.name).toBe('')
    expect(result.linkedin).toBe('')
  })
})
