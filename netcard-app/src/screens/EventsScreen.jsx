import { Plus, MapPin, Users, Pencil, Loader, WifiOff, UserPlus, Menu, Calendar, Mic2, Building2, PlaneTakeoff, Home, Dumbbell, Trophy, PartyPopper, Pin, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { readCache, writeCache } from '../lib/syncQueue.js'

const PINNED_KEY    = 'netcard_pinned_places'
const OVERRIDE_KEY  = 'netcard_venue_overrides'

function readPinned() { try { return JSON.parse(localStorage.getItem(PINNED_KEY) ?? '[]') } catch { return [] } }
function savePinned(ids) { localStorage.setItem(PINNED_KEY, JSON.stringify(ids)) }

export function readVenueOverrides() { try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY) ?? '{}') } catch { return {} } }
export function saveVenueOverride(id, type) {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify({ ...readVenueOverrides(), [id]: type }))
}

const API = import.meta.env.VITE_API_URL || ''
const CACHE_KEY = 'api/events'

export const PLACE_TYPES = [
  { id: 'event',     label: 'Event',     Icon: Mic2,         color: '#6366F1', bg: 'rgba(99,102,241,0.13)'  },
  { id: 'workspace', label: 'Workspace', Icon: Building2,    color: '#F59E0B', bg: 'rgba(245,158,11,0.13)'  },
  { id: 'travel',    label: 'Travel',    Icon: PlaneTakeoff, color: '#0EA5E9', bg: 'rgba(14,165,233,0.13)'  },
  { id: 'housing',   label: 'Housing',   Icon: Home,         color: '#10B981', bg: 'rgba(16,185,129,0.13)'  },
  { id: 'gym',       label: 'Gym',       Icon: Dumbbell,     color: '#EF4444', bg: 'rgba(239,68,68,0.13)'   },
  { id: 'clubhouse', label: 'Clubhouse', Icon: Trophy,       color: '#8B5CF6', bg: 'rgba(139,92,246,0.13)'  },
  { id: 'party',     label: 'Party',     Icon: PartyPopper,  color: '#F97316', bg: 'rgba(249,115,22,0.13)'  },
]

function getType(venueType) {
  return PLACE_TYPES.find(t => t.id === venueType) ?? PLACE_TYPES[0]
}

function formatDates(start, end) {
  if (!start) return ''
  const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return end && end !== start ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

const STATUS_FILTERS = ['All', 'Upcoming', 'Past']
// Only event & travel have meaningful start/end dates and upcoming/past states
const TIME_BOUNDED = new Set(['event', 'travel'])

const SAMPLE_EVENTS = [
  { id: 'sample-1', name: 'TechSummit 2025',          venue_type: 'event',     status: 'active',   is_active: true,  location: 'NIMHANS Convention Centre, Bangalore', start_date: '2026-04-25', end_date: '2026-04-27', contacts: [{ count: 6 }] },
  { id: 'sample-2', name: 'WeWork Manyata Tech Park',  venue_type: 'workspace', status: 'upcoming', is_active: false, location: 'Manyata Tech Park, Bangalore',          contacts: [{ count: 3 }] },
  { id: 'sample-3', name: 'Prestige Shantiniketan',    venue_type: 'housing',   status: 'upcoming', is_active: false, location: 'Whitefield, Bangalore',                contacts: [{ count: 2 }] },
  { id: 'sample-4', name: "Gold's Gym Koramangala",    venue_type: 'gym',       status: 'upcoming', is_active: false, location: 'Koramangala, Bangalore',               contacts: [{ count: 1 }] },
]

export default function EventsScreen({ navigate, onMenuOpen }) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter]     = useState(null)
  const [events, setEvents]             = useState(() => {
    const cached = readCache(CACHE_KEY) ?? []
    if (cached.length === 0) return SAMPLE_EVENTS
    const ov = readVenueOverrides()
    return cached.map(e => ({ ...e, venue_type: ov[e.id] ?? e.venue_type ?? 'event' }))
  })
  const [loading, setLoading]           = useState(true)
  const [isOffline, setIsOffline]       = useState(false)
  const [pinned, setPinned]             = useState(() => readPinned())
  const [confirmDelete, setConfirmDelete] = useState(null) // id being confirmed

  useEffect(() => {
    fetch(`${API}/api/events`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setLoading(false)
        setIsOffline(false)
        if (d.success && Array.isArray(d.data)) {
          const cached    = readCache(CACHE_KEY) ?? []
          const ov        = readVenueOverrides()
          const typeCache = Object.fromEntries(cached.map(e => [e.id, e.venue_type]))
          const merged    = d.data.map(e => ({ ...e, venue_type: ov[e.id] ?? e.venue_type ?? typeCache[e.id] ?? 'event' }))
          writeCache(CACHE_KEY, merged)
          // Blend in sample places whose names aren't in real data
          const realNames = new Set(merged.map(e => e.name.toLowerCase()))
          const blended   = [...merged, ...SAMPLE_EVENTS.filter(s => !realNames.has(s.name.toLowerCase()))]
          setEvents(blended)
        }
      })
      .catch(() => { setIsOffline(true); setLoading(false) })
  }, [])

  useEffect(() => {
    const active = events.find(e => e.is_active || e.status === 'active') ?? null
    localStorage.setItem('netcard_active_event', JSON.stringify(active))
  }, [events])

  const togglePin = (id, ev) => {
    ev.stopPropagation()
    const next = pinned.includes(id) ? pinned.filter(p => p !== id) : [id, ...pinned]
    setPinned(next)
    savePinned(next)
  }

  const handleDelete = async (id, ev) => {
    ev.stopPropagation()
    setConfirmDelete(null)
    const next = events.filter(e => e.id !== id)
    setEvents(next)
    writeCache(CACHE_KEY, next)
    setPinned(p => { const n = p.filter(p => p !== id); savePinned(n); return n })
    try {
      await fetch(`${API}/api/events/${id}`, { method: 'DELETE', credentials: 'include' })
    } catch {}
  }

  const presentTypes = [...new Set(events.map(e => e.venue_type ?? 'event'))]

  const filtered = events
    .filter(e => {
      const matchStatus = statusFilter === 'All' ? true
        : statusFilter === 'Upcoming' ? (e.status === 'upcoming' || e.status === 'active')
        : e.status === 'past'
      const matchType = typeFilter === null ? true : (e.venue_type ?? 'event') === typeFilter
      return matchStatus && matchType
    })
    // Pinned items float to top
    .sort((a, b) => {
      const ap = pinned.includes(a.id) ? 0 : 1
      const bp = pinned.includes(b.id) ? 0 : 1
      return ap - bp
    })

  return (
    <div className="screen">
      <div className="status-bar">
        <span className="status-time">9:41</span>
        <div className="status-icons">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
            <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/>
            <rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/>
            <rect x="9" y="0" width="3" height="12" rx="1" opacity="0.8"/>
            <rect x="13.5" y="0" width="3" height="12" rx="1"/>
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none"/>
            <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <div className="content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onMenuOpen} className="icon-btn"><Menu size={18} /></button>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 500, letterSpacing: -0.8, color: 'var(--text-primary)' }}>Places</h1>
          </div>
          <button
            onClick={() => navigate('addEvent')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, var(--indigo), var(--indigo-dark))',
              border: 'none', borderRadius: 100, padding: '8px 14px',
              color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
            }}
          >
            <Plus size={16} /> New Place
          </button>
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '7px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13,
                fontWeight: statusFilter === f ? 600 : 500,
                background: statusFilter === f ? 'var(--indigo)' : 'var(--card)',
                color: statusFilter === f ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Venue type filter — only show when >1 type present */}
        {presentTypes.length > 1 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            <button
              onClick={() => setTypeFilter(null)}
              style={{
                flexShrink: 0, padding: '5px 13px', borderRadius: 100, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: typeFilter === null ? 600 : 500,
                background: typeFilter === null ? 'var(--elevated)' : 'transparent',
                color: typeFilter === null ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              All types
            </button>
            {presentTypes.map(tid => {
              const t = getType(tid)
              const active = typeFilter === tid
              return (
                <button
                  key={tid}
                  onClick={() => setTypeFilter(active ? null : tid)}
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 100, border: `1.5px solid ${active ? t.color : 'transparent'}`,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: active ? 600 : 500,
                    background: active ? t.bg : 'var(--card)',
                    color: active ? t.color : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  <t.Icon size={13} /> {t.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Offline banner */}
        {isOffline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--amber, #F59E0B)', background: 'rgba(245,158,11,0.1)', borderRadius: 8, padding: '6px 10px' }}>
            <WifiOff size={12} /> Offline — showing cached data
          </div>
        )}

        {/* Loading */}
        {loading && events.length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Empty state — no places at all */}
        {!loading && events.length === 0 && !isOffline && (
          <div style={{ textAlign: 'center', padding: '28px 0 8px' }}>
            <div style={{ fontSize: 38, lineHeight: 1, marginBottom: 12 }}>📍</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', marginBottom: 6 }}>No places yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Add a place — an event, workspace,<br/>flight, or anywhere you meet people.</div>
          </div>
        )}

        {/* Places list */}
        {events.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                No places match this filter.
              </div>
            ) : filtered.map(e => {
              const isActive      = e.is_active || e.status === 'active'
              const type          = getType(e.venue_type)
              const isTimeBounded = TIME_BOUNDED.has(type.id)
              const contactCount  = Array.isArray(e.contacts) ? (e.contacts[0]?.count ?? 0) : (e.contacts ?? 0)
              const dateStr       = isTimeBounded ? (e.dates || formatDates(e.start_date, e.end_date)) : null

              return (
                <div
                  key={e.id}
                  onClick={() => navigate('eventContacts', e)}
                  style={{
                    background: 'var(--card)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: isActive ? '1.5px solid var(--green)' : `1.5px solid ${type.color}22`,
                    boxShadow: isActive ? '0 4px 20px rgba(50,213,131,0.12)' : `0 2px 12px ${type.color}0d`,
                    opacity: isTimeBounded && e.status === 'past' ? 0.7 : 1,
                    transition: 'opacity 0.15s, box-shadow 0.15s',
                  }}
                >
                  {/* Active banner */}
                  {isActive && (
                    <div style={{ background: 'rgba(50,213,131,0.1)', padding: '9px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--green)', borderRadius: 100, padding: '4px 10px' }}>
                        <span className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#0B0B0E', letterSpacing: 0.5 }}>ACTIVE</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={11} /> {contactCount} contacts
                      </span>
                    </div>
                  )}

                  {pinned.includes(e.id) && !isActive && (
                    <div style={{ background: 'rgba(99,102,241,0.07)', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Pin size={10} color="var(--indigo)" />
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--indigo)', letterSpacing: 0.3 }}>PINNED</span>
                    </div>
                  )}

                  <div style={{ padding: '13px 16px', display: 'flex', gap: 12 }}>
                    {/* Venue type icon badge */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0, marginTop: 1,
                      background: type.bg,
                      border: `1.5px solid ${type.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <type.Icon size={22} color={type.color} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{
                          fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600,
                          color: 'var(--text-primary)', letterSpacing: -0.2,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {e.name}
                        </span>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                          {/* Pin to top */}
                          <button
                            onClick={ev => togglePin(e.id, ev)}
                            title={pinned.includes(e.id) ? 'Unpin' : 'Pin to top'}
                            style={{
                              width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
                              background: pinned.includes(e.id) ? 'rgba(99,102,241,0.12)' : 'var(--elevated)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: pinned.includes(e.id) ? 'var(--indigo)' : 'var(--text-secondary)',
                              transition: 'all 0.15s',
                            }}
                          >
                            <Pin size={11} style={{ transform: pinned.includes(e.id) ? 'none' : 'rotate(45deg)', transition: 'transform 0.15s' }} />
                          </button>
                          {/* Delete */}
                          {confirmDelete === e.id ? (
                            <>
                              <button
                                onClick={ev => handleDelete(e.id, ev)}
                                style={{ height: 28, padding: '0 10px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--coral)', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)' }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={ev => { ev.stopPropagation(); setConfirmDelete(null) }}
                                style={{ height: 28, padding: '0 8px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--elevated)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)' }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={ev => { ev.stopPropagation(); setConfirmDelete(e.id) }}
                              style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                          {/* Edit */}
                          <button
                            onClick={ev => { ev.stopPropagation(); navigate('addEvent', e) }}
                            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Type chip + status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                          color: type.color, background: type.bg,
                          borderRadius: 6, padding: '3px 8px',
                          textTransform: 'uppercase',
                        }}>
                          {type.label}
                        </span>
                        {isTimeBounded && e.status === 'upcoming' && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--indigo)', background: 'rgba(99,102,241,0.15)', borderRadius: 6, padding: '3px 8px' }}>Upcoming</span>
                        )}
                        {isTimeBounded && e.status === 'past' && !isActive && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--border)', borderRadius: 6, padding: '3px 8px' }}>Past</span>
                        )}
                      </div>

                      {/* Meta info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 7 }}>
                        {e.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <MapPin size={11} style={{ flexShrink: 0, color: type.color, opacity: 0.7 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.location}</span>
                          </span>
                        )}
                        {dateStr && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <Calendar size={11} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                            {dateStr}
                          </span>
                        )}
                      </div>

                      {/* Past contact count + leads CTA — only for time-bounded types */}
                      {isTimeBounded && e.status === 'past' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={11} /> {contactCount} contacts
                          </span>
                          <button
                            onClick={ev => { ev.stopPropagation(); navigate('eventContacts', e) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: type.bg, border: `1.5px solid ${type.color}40`,
                              borderRadius: 8, padding: '5px 11px', cursor: 'pointer',
                              color: type.color, fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
                            }}
                          >
                            <UserPlus size={11} /> → Leads
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Quick-add row — always visible below the list */}
        {!loading && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Add a place
            </div>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
              {PLACE_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate('addEvent', { venue_type: t.id })}
                  style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 13px', borderRadius: 100,
                    border: `1.5px solid ${t.color}28`,
                    background: t.bg, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: t.color,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <t.Icon size={13} /> {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
