import { describe, it, expect } from 'vitest'

/**
 * Unit tests for the analytics response shape computation logic.
 * Tests the pure aggregation functions without hitting the DB.
 */

// Replicates the aggregation logic from GET /api/analytics
function computeEventsStats(events: Array<{ status: string; is_active: boolean }>) {
  return {
    total:    events.length,
    active:   events.filter(e => e.is_active).length,
    past:     events.filter(e => e.status === 'past').length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
  }
}

function computeTopEvents(contacts: Array<{ met_event_name?: string | null }>, limit = 5) {
  const counts: Record<string, number> = {}
  for (const c of contacts) {
    if (c.met_event_name) counts[c.met_event_name] = (counts[c.met_event_name] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

function computeSeniority(contacts: Array<{ role_bucket?: string | null }>) {
  const counts: Record<string, number> = {}
  for (const c of contacts) {
    if (c.role_bucket) counts[c.role_bucket] = (counts[c.role_bucket] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
}

describe('analytics — computeEventsStats', () => {
  it('returns the correct shape with all keys', () => {
    const result = computeEventsStats([])
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('active')
    expect(result).toHaveProperty('past')
    expect(result).toHaveProperty('upcoming')
  })

  it('counts active, past, and upcoming correctly', () => {
    const events = [
      { status: 'active',   is_active: true  },
      { status: 'upcoming', is_active: false },
      { status: 'upcoming', is_active: false },
      { status: 'past',     is_active: false },
    ]
    const result = computeEventsStats(events)
    expect(result.total).toBe(4)
    expect(result.active).toBe(1)
    expect(result.past).toBe(1)
    expect(result.upcoming).toBe(2)
  })

  it('returns zeros for empty events', () => {
    const result = computeEventsStats([])
    expect(result).toEqual({ total: 0, active: 0, past: 0, upcoming: 0 })
  })
})

describe('analytics — computeTopEvents', () => {
  it('returns events sorted by contact count descending', () => {
    const contacts = [
      { met_event_name: 'Event A' },
      { met_event_name: 'Event B' },
      { met_event_name: 'Event A' },
      { met_event_name: 'Event A' },
      { met_event_name: 'Event B' },
      { met_event_name: 'Event C' },
    ]
    const result = computeTopEvents(contacts)
    expect(result[0]).toEqual({ name: 'Event A', count: 3 })
    expect(result[1]).toEqual({ name: 'Event B', count: 2 })
    expect(result[2]).toEqual({ name: 'Event C', count: 1 })
  })

  it('limits to the specified maximum', () => {
    const contacts = Array.from({ length: 10 }, (_, i) => ({ met_event_name: `Event ${i}` }))
    const result = computeTopEvents(contacts, 3)
    expect(result).toHaveLength(3)
  })

  it('ignores null/undefined met_event_name', () => {
    const contacts = [
      { met_event_name: null },
      { met_event_name: undefined },
      { met_event_name: 'Real Event' },
    ]
    const result = computeTopEvents(contacts)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Real Event')
  })
})

describe('analytics — computeSeniority', () => {
  it('returns seniority breakdown sorted by count descending', () => {
    const contacts = [
      { role_bucket: 'Engg' },
      { role_bucket: 'CXO' },
      { role_bucket: 'Engg' },
      { role_bucket: 'Founders' },
      { role_bucket: 'Engg' },
    ]
    const result = computeSeniority(contacts)
    expect(result[0]).toEqual({ label: 'Engg', count: 3 })
    expect(result[1]).toEqual({ label: 'CXO', count: 1 })
    expect(result[2]).toEqual({ label: 'Founders', count: 1 })
  })

  it('returns empty array when no contacts', () => {
    expect(computeSeniority([])).toEqual([])
  })
})
