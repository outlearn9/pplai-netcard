import { apiFetch } from '../lib/apiFetch'
import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, MapPin, Info, Loader } from 'lucide-react'

const API = import.meta.env.VITE_API_URL ?? ''

function formatDateRange(start, end) {
  if (!start) return ''
  const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return end && end !== start ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

function deriveStatus(ev) {
  if (ev.is_active) return 'active'
  if (ev.status) return ev.status
  const now = new Date()
  if (ev.end_date && new Date(ev.end_date) < now) return 'past'
  if (ev.start_date && new Date(ev.start_date) > now) return 'upcoming'
  return 'upcoming'
}

export default function SwitchEventScreen({ navigate }) {
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [activating, setActivating] = useState(null)
  const [error, setError]       = useState(null)

  useEffect(() => {
    apiFetch(`/api/events`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const list = data.data ?? data ?? []
        setEvents(list)
        // Sync active event to localStorage cache
        const active = list.find(e => e.is_active) ?? null
        try { localStorage.setItem('netcard_active_event', JSON.stringify(active)) } catch {}
      })
      .catch(() => {
        // Fall back to cached data
        try {
          const cached = JSON.parse(localStorage.getItem('netcard_active_event') || 'null')
          if (cached) setEvents([cached])
        } catch {}
        setError('Could not load events')
      })
      .finally(() => setLoading(false))
  }, [])

  const selectEvent = async (ev) => {
    const status = deriveStatus(ev)
    if (status === 'past') return
    if (ev.is_active) { navigate('events'); return }

    setActivating(ev.id)
    try {
      await apiFetch(`/api/events/${ev.id}/activate`, {
        method: 'POST',
        credentials: 'include',
      })
      // Update local state
      setEvents(prev => prev.map(e => ({ ...e, is_active: e.id === ev.id })))
      try { localStorage.setItem('netcard_active_event', JSON.stringify({ ...ev, is_active: true })) } catch {}
    } catch {
      setError('Failed to switch event')
    } finally {
      setActivating(null)
      navigate('events')
    }
  }

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

      <div className="screen-header">
        <button className="icon-btn" onClick={() => navigate('events')}>
          <ArrowLeft size={20} />
        </button>
        <span className="header-title">Switch Event</span>
        <div style={{ width: 40 }} />
      </div>

      <div className="content" style={{ paddingTop: 8 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 4 }}>
          Tap an event to make it active. New contacts will be added under the active event.
        </p>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Loader size={20} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!loading && error && events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {error}
          </div>
        )}

        {!loading && events.map(ev => {
          const status = deriveStatus(ev)
          const isActive = !!ev.is_active
          const isPast = status === 'past'
          const isActivating = activating === ev.id

          return (
            <div
              key={ev.id}
              onClick={() => selectEvent(ev)}
              style={{
                background: 'var(--card)',
                borderRadius: 20,
                overflow: 'hidden',
                cursor: isPast ? 'default' : 'pointer',
                border: isActive ? '1.5px solid var(--green)' : '1.5px solid var(--border)',
                boxShadow: isActive ? '0 4px 20px rgba(50,213,131,0.12)' : 'none',
                opacity: isPast ? 0.65 : 1,
                transition: 'all 0.15s',
                marginBottom: 10,
              }}
            >
              {isActive && (
                <div style={{ background: 'rgba(50,213,131,0.08)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--green)', borderRadius: 100, padding: '4px 10px' }}>
                    <span className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0B0B0E', letterSpacing: 0.5 }}>ACTIVE</span>
                  </div>
                </div>
              )}

              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.2, flex: 1, paddingRight: 8 }}>
                    {ev.name}
                  </span>
                  {isActivating && <Loader size={14} color="var(--indigo)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                  {!isActivating && status === 'upcoming' && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--indigo)', background: 'rgba(99,102,241,0.15)', borderRadius: 100, padding: '4px 10px', flexShrink: 0 }}>
                      Upcoming
                    </span>
                  )}
                  {!isActivating && isPast && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--border)', borderRadius: 100, padding: '4px 10px', flexShrink: 0 }}>
                      Past
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {(ev.start_date || ev.end_date) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <Calendar size={12} /> {formatDateRange(ev.start_date, ev.end_date)}
                    </span>
                  )}
                  {ev.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <MapPin size={12} /> {ev.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Info note */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(99,102,241,0.08)', borderRadius: 14, padding: '12px 14px', marginTop: 4 }}>
          <Info size={14} color="var(--indigo)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--indigo)', lineHeight: 1.55 }}>
            Switching the active event won't affect existing contacts.
          </p>
        </div>
      </div>
    </div>
  )
}
