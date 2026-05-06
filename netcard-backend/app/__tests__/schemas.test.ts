import { describe, it, expect } from 'vitest'
import { ContactSchema, ContactUpdateSchema, EventSchema, EventUpdateSchema, NotificationSchema } from '@/lib/schemas'

// ── ContactSchema ────────────────────────────────────────────────────────────

describe('ContactSchema', () => {
  it('accepts a minimal valid contact (name only)', () => {
    const result = ContactSchema.safeParse({ name: 'Jane Doe' })
    expect(result.success).toBe(true)
  })

  it('rejects when name is missing', () => {
    const result = ContactSchema.safeParse({ email: 'jane@example.com' })
    expect(result.success).toBe(false)
  })

  it('rejects when name is empty string', () => {
    const result = ContactSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email format', () => {
    const result = ContactSchema.safeParse({ name: 'Jane', email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts empty string email (allowed by schema)', () => {
    const result = ContactSchema.safeParse({ name: 'Jane', email: '' })
    expect(result.success).toBe(true)
  })

  it('rejects a non-UUID event_id', () => {
    const result = ContactSchema.safeParse({ name: 'Jane', event_id: 'sample-1' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid UUID event_id', () => {
    const result = ContactSchema.safeParse({ name: 'Jane', event_id: '00000000-0000-0000-0000-000000000001' })
    expect(result.success).toBe(true)
  })

  it('accepts all optional met_* fields', () => {
    const result = ContactSchema.safeParse({
      name: 'Jane',
      met_venue_type: 'gym',
      met_context: 'morning session',
      met_highlights: 'discussed partnership',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all sharedContactFields', () => {
    const result = ContactSchema.safeParse({
      name: 'Jane',
      role: 'Engineer',
      company: 'Acme',
      phone: '+14155550100',
      linkedin_url: 'https://linkedin.com/in/jane',
      mode: 'Seeking',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid mode value', () => {
    const result = ContactSchema.safeParse({ name: 'Jane', mode: 'Watching' })
    expect(result.success).toBe(false)
  })
})

// ── ContactUpdateSchema ──────────────────────────────────────────────────────

describe('ContactUpdateSchema', () => {
  it('accepts bookmarked:true alone', () => {
    const result = ContactUpdateSchema.safeParse({ bookmarked: true })
    expect(result.success).toBe(true)
  })

  it('accepts followed_up:false alone', () => {
    const result = ContactUpdateSchema.safeParse({ followed_up: false })
    expect(result.success).toBe(true)
  })

  it('accepts empty object (all optional)', () => {
    const result = ContactUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects name as empty string', () => {
    const result = ContactUpdateSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = ContactUpdateSchema.safeParse({ email: 'bad' })
    expect(result.success).toBe(false)
  })
})

// ── EventSchema ──────────────────────────────────────────────────────────────

describe('EventSchema', () => {
  it('accepts minimal valid event', () => {
    const result = EventSchema.safeParse({ name: 'TechSummit 2025' })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = EventSchema.safeParse({ location: 'Bangalore' })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = EventSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid venue_type values', () => {
    const types = ['event', 'workspace', 'travel', 'housing', 'gym', 'clubhouse', 'party']
    for (const venue_type of types) {
      const result = EventSchema.safeParse({ name: 'X', venue_type })
      expect(result.success, `venue_type "${venue_type}" should be valid`).toBe(true)
    }
  })

  it('rejects an unknown venue_type', () => {
    const result = EventSchema.safeParse({ name: 'X', venue_type: 'stadium' })
    expect(result.success).toBe(false)
  })

  it('accepts is_active boolean', () => {
    const result = EventSchema.safeParse({ name: 'X', is_active: true })
    expect(result.success).toBe(true)
  })
})

// ── EventUpdateSchema ────────────────────────────────────────────────────────

describe('EventUpdateSchema', () => {
  it('accepts empty object (all optional)', () => {
    expect(EventUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts valid status values', () => {
    for (const status of ['active', 'upcoming', 'past']) {
      expect(EventUpdateSchema.safeParse({ status }).success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    expect(EventUpdateSchema.safeParse({ status: 'cancelled' }).success).toBe(false)
  })

  it('rejects empty name', () => {
    expect(EventUpdateSchema.safeParse({ name: '' }).success).toBe(false)
  })
})

// ── NotificationSchema ───────────────────────────────────────────────────────

describe('NotificationSchema', () => {
  it('accepts minimal valid notification', () => {
    const result = NotificationSchema.safeParse({ type: 'connection', title: 'New connection' })
    expect(result.success).toBe(true)
  })

  it('rejects missing type', () => {
    expect(NotificationSchema.safeParse({ title: 'Hi' }).success).toBe(false)
  })

  it('rejects missing title', () => {
    expect(NotificationSchema.safeParse({ type: 'connection' }).success).toBe(false)
  })

  it('rejects empty type string', () => {
    expect(NotificationSchema.safeParse({ type: '', title: 'Hi' }).success).toBe(false)
  })

  it('accepts action_data as a plain object', () => {
    const result = NotificationSchema.safeParse({
      type: 'connection', title: 'Hi',
      action_data: { id: '123', name: 'Jane' },
    })
    expect(result.success).toBe(true)
  })
})
