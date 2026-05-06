import { ArrowLeft, Calendar, Search, Gift, Check, Link, CalendarDays, Loader, Type } from 'lucide-react'
import { useState } from 'react'
import { readCache, writeCache, enqueue } from '../lib/syncQueue.js'
import { PLACE_TYPES, readVenueOverrides, saveVenueOverride } from './EventsScreen.jsx'
import LocationInput from '../components/LocationInput.jsx'

const API = import.meta.env.VITE_API_URL || ''

function loadProfileDefaults() {
  try {
    const p = JSON.parse(localStorage.getItem('netcard_my_profile') || '{}')
    return { seeking: p.seeking || '', offering: p.offering || '' }
  } catch { return { seeking: '', offering: '' } }
}

const EMPTY_FORM = { name: '', startDate: '', endDate: '', location: '', seeking: '', offering: '' }

const IMPORT_TABS = [
  { id: 'manual',   label: 'Manual',   icon: Type },
  { id: 'luma',     label: 'Lu.ma',    icon: Link },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
]

const NAME_PLACEHOLDER = {
  event:     'e.g. NASSCOM Summit 2025',
  workspace: 'e.g. WeWork Manyata Techpark, Bangalore',
  travel:    'e.g. Air India AI-302 BLR→DEL · or Rajdhani Express',
  housing:   'e.g. Prestige Lakeside Habitat, Whitefield',
  gym:       'e.g. Cult Fit, Indiranagar',
  clubhouse: 'e.g. Aravali Country Club, Delhi',
  party:     "e.g. Diwali Party at Priya's",
}

const SHOW_DATES = ['event', 'travel']

function isLumaUrl(url) {
  return url.includes('luma.com') || url.includes('lu.ma')
}

function eventToForm(e, isEdit) {
  const defaults = isEdit ? {} : loadProfileDefaults()
  if (!e) return { ...EMPTY_FORM, ...defaults }
  return {
    name: e.name || '', startDate: '', endDate: '',
    location: e.location || '',
    seeking:  e.seeking  || defaults.seeking  || '',
    offering: e.offering || defaults.offering || '',
  }
}

export default function AddEventScreen({ navigate, event }) {
  const isEdit      = Boolean(event?.id)
  const [venueType, setVenueType] = useState(event?.venue_type ?? 'event')
  const [tab, setTab]             = useState('manual')
  const [form, setForm]           = useState(() => eventToForm(event, isEdit))
  const [setActive, setSetActive] = useState(!isEdit)
  const [lumaUrl, setLumaUrl]     = useState('')
  const [lumaLoading, setLumaLoading] = useState(false)
  const [lumaError, setLumaError]   = useState(null)
  const [calConnected, setCalConnected] = useState(false)
  const [calLoading, setCalLoading] = useState(false)
  const [error, setError]         = useState(null)
  const [saving, setSaving]       = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const type   = PLACE_TYPES.find(t => t.id === venueType) ?? PLACE_TYPES[0]

  const handleLumaFetch = async () => {
    setLumaError(null)
    if (!lumaUrl.trim()) { setLumaError('Paste a Lu.ma event URL first'); return }
    if (!isLumaUrl(lumaUrl)) { setLumaError('Must be a luma.com or lu.ma URL'); return }
    setLumaLoading(true)
    try {
      const res  = await fetch(`${API}/api/events/import?url=${encodeURIComponent(lumaUrl)}`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not fetch event')
      const pd = loadProfileDefaults()
      setForm({ ...json.data, seeking: pd.seeking, offering: pd.offering })
      setTab('manual')
    } catch (e) {
      setLumaError(e.message || 'Could not fetch event details')
    } finally {
      setLumaLoading(false)
    }
  }

  const handleCalConnect = () => {
    setCalLoading(true)
    setTimeout(() => { setCalConnected(true); setCalLoading(false) }, 1400)
  }

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Place name is required'); return }
    setError(null)
    setSaving(true)

    const body = {
      name:       form.name.trim(),
      venue_type: venueType,
      start_date: form.startDate || undefined,
      end_date:   form.endDate   || undefined,
      location:   form.location  || undefined,
      seeking:    form.seeking   || undefined,
      offering:   form.offering  || undefined,
      is_active:  setActive,
    }

    // Optimistic cache update
    const cached = readCache('api/events') ?? []
    if (isEdit && event?.id) {
      writeCache('api/events', cached.map(e => e.id === event.id ? { ...e, ...body } : e))
    } else {
      const optimistic = { id: `tmp-${Date.now()}`, status: setActive ? 'active' : 'upcoming', ...body }
      writeCache('api/events', [optimistic, ...cached])
    }

    const method = isEdit && event?.id ? 'PUT' : 'POST'
    const url    = isEdit && event?.id ? `${API}/api/events/${event.id}` : `${API}/api/events`

    try {
      const res  = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`)
      // Save venue type override so it survives API re-fetches (until DB migration runs)
      const savedId = json.data?.id ?? event?.id
      if (savedId) saveVenueOverride(savedId, venueType)

      const fresh = await fetch(`${API}/api/events`, { credentials: 'include' }).catch(() => null)
      if (fresh?.ok) {
        const fd   = await fresh.json()
        const ov   = readVenueOverrides()
        const refreshed = (fd.data ?? []).map(e => ({ ...e, venue_type: ov[e.id] ?? e.venue_type ?? 'event' }))
        writeCache('api/events', refreshed)
      }
      navigate('events')
    } catch {
      enqueue({ method, url, body, cacheKey: 'api/events' })
      navigate('events')
    } finally {
      setSaving(false)
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
        <span className="header-title">{isEdit ? 'Edit Place' : 'Add Place'}</span>
        <div style={{ width: 40 }} />
      </div>

      {/* ── Venue type picker ── */}
      <div style={{ padding: '4px 20px 14px' }}>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
          {PLACE_TYPES.map(t => {
            const active = venueType === t.id
            return (
              <button
                key={t.id}
                onClick={() => setVenueType(t.id)}
                style={{
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 100, cursor: 'pointer',
                  border: active ? `2px solid ${t.color}` : '2px solid transparent',
                  background: active ? t.bg : 'var(--card)',
                  transition: 'all 0.15s',
                  boxShadow: active ? `0 2px 8px ${t.color}25` : 'none',
                }}
              >
                <t.Icon size={17} />
                <span style={{
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? t.color : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                }}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Import / Manual tabs — event type only ── */}
      {venueType === 'event' && !isEdit && (
        <div style={{ display: 'flex', gap: 6, padding: '0 20px 12px' }}>
          {IMPORT_TABS.map(t => {
            const Icon   = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: active ? 700 : 500,
                  background: active ? 'var(--indigo)' : 'var(--card)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={13} /> {t.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="content" style={{ paddingTop: 4 }}>

        {/* ── Lu.ma import ── */}
        {venueType === 'event' && tab === 'luma' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--card)', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Import from Lu.ma</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
                Paste your event URL — we'll auto-fill the details for you.
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <Link size={14} style={{ position: 'absolute', left: 13, color: 'var(--indigo)', pointerEvents: 'none' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: 36, margin: 0 }}
                  placeholder="luma.com/my-event or lu.ma/slug"
                  value={lumaUrl}
                  onChange={e => { setLumaUrl(e.target.value); setLumaError(null) }}
                />
              </div>
              {lumaError && <div style={{ fontSize: 12, color: 'var(--coral)', marginBottom: 10 }}>{lumaError}</div>}
              <button
                onClick={handleLumaFetch}
                disabled={lumaLoading}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: 'linear-gradient(135deg, var(--indigo), var(--indigo-dark))',
                  border: 'none', borderRadius: 10, padding: '10px 0',
                  color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                  cursor: lumaLoading ? 'wait' : 'pointer', opacity: lumaLoading ? 0.7 : 1,
                }}
              >
                {lumaLoading
                  ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Fetching…</>
                  : <><Link size={14} /> Import Event</>}
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              Or <button onClick={() => setTab('manual')} style={{ background: 'none', border: 'none', color: 'var(--indigo)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>fill in manually</button>
            </div>
          </div>
        )}

        {/* ── Calendar import ── */}
        {venueType === 'event' && tab === 'calendar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--card)', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Sync from Calendar</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                Connect Google or Apple Calendar to pull upcoming events automatically.
              </div>
              {calConnected ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(50,213,131,0.1)', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
                    <Check size={14} color="var(--green)" />
                    <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Calendar connected</span>
                  </div>
                  {[
                    { name: 'YC Demo Day SF',    date: 'Apr 14',      location: 'San Francisco, CA' },
                    { name: 'SaaStr Annual 2025', date: 'May 13–15',  location: 'San Mateo, CA' },
                    { name: 'Founders Dinner',    date: 'Apr 22',     location: 'Mission District, SF' },
                  ].map((ev, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        const pd = loadProfileDefaults()
                        setForm({ name: ev.name, startDate: '', endDate: '', location: ev.location, seeking: pd.seeking, offering: pd.offering })
                        setTab('manual')
                      }}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ev.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          <Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />{ev.date} · {ev.location}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--indigo)', fontWeight: 600 }}>Use →</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['Google Calendar', 'Apple Calendar'].map(cal => (
                    <button
                      key={cal}
                      onClick={handleCalConnect}
                      disabled={calLoading}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 10,
                        padding: '11px 0', color: 'var(--text-primary)',
                        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                        cursor: calLoading ? 'wait' : 'pointer', opacity: calLoading ? 0.6 : 1,
                      }}
                    >
                      {calLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CalendarDays size={14} color="var(--indigo)" />}
                      {calLoading ? 'Connecting…' : `Connect ${cal}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Manual form ── */}
        {(tab === 'manual' || venueType !== 'event') && (
          <>
            <div className="input-group">
              <label className="input-label">
                {venueType === 'event' ? 'Event Name' : venueType === 'workspace' ? 'Workspace Name' : venueType === 'travel' ? 'Route / Trip' : venueType === 'housing' ? 'Society / Building' : venueType === 'gym' ? 'Gym Name' : venueType === 'clubhouse' ? 'Clubhouse Name' : 'Place Name'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <type.Icon size={15} style={{ position: 'absolute', left: 13, pointerEvents: 'none' }} color={type.color} />
                <input
                  className="input-field"
                  style={{ paddingLeft: 40, borderColor: form.name ? type.color : 'var(--border)' }}
                  placeholder={NAME_PLACEHOLDER[venueType] ?? 'Place name'}
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                />
              </div>
            </div>

            {/* Dates — only for event/travel types */}
            {SHOW_DATES.includes(venueType) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Start Date</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: 13, color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                    <input type="date" className="input-field" style={{ paddingLeft: 36, colorScheme: 'dark' }}
                      value={form.startDate} onChange={e => update('startDate', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">End Date</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: 13, color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                    <input type="date" className="input-field" style={{ paddingLeft: 36, colorScheme: 'dark' }}
                      value={form.endDate} onChange={e => update('endDate', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Location</label>
              <LocationInput
                value={form.location}
                onChange={v => update('location', v)}
                accentColor={type.color}
                placeholder={
                  venueType === 'workspace' ? 'e.g. Manyata Tech Park, Bangalore' :
                  venueType === 'travel'    ? 'e.g. BLR → DEL, Rajdhani Express' :
                  venueType === 'housing'   ? 'e.g. Whitefield, Bangalore' :
                  'City or venue address'
                }
              />
            </div>

            {/* Seeking & Offering — for events only */}
            {(venueType === 'event' || venueType === 'workspace') && (
              <>
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Search size={12} color="var(--indigo)" /> <span style={{ color: 'var(--indigo)' }}>Purpose / Seeking</span>
                  </label>
                  <textarea className="input-field" style={{ borderColor: 'rgba(99,102,241,0.3)' }}
                    placeholder="What are you looking for? (e.g. investors, customers, co-founders)"
                    value={form.seeking} onChange={e => update('seeking', e.target.value)} rows={2} />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Gift size={12} color="var(--green)" /> <span style={{ color: 'var(--green)' }}>Offer / Service or Product</span>
                  </label>
                  <textarea className="input-field" style={{ borderColor: 'rgba(50,213,131,0.25)' }}
                    placeholder="What can you offer others? (e.g. your product, expertise, introductions)"
                    value={form.offering} onChange={e => update('offering', e.target.value)} rows={2} />
                </div>
              </>
            )}

            {/* Set as Active toggle */}
            <div style={{ background: 'var(--card)', borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Set as Active Place</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>New contacts will be tagged to this place</div>
              </div>
              <div className="toggle-track" onClick={() => setSetActive(!setActive)}
                style={{ background: setActive ? 'var(--green)' : 'var(--border)' }}>
                <div className="toggle-thumb" style={{ left: setActive ? 24 : 2 }} />
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(232,90,79,0.12)', border: '1px solid var(--coral)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--coral)' }}>
                {error}
              </div>
            )}

            <button
              className="btn-green"
              onClick={handleCreate}
              disabled={saving}
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              <Check size={18} />
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : `Add ${type.label}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
