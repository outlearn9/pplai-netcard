import { apiFetch } from '../lib/apiFetch'
import { useState, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, X, Bookmark, Check, Loader, Users, ChevronRight, Phone, MessageCircle } from 'lucide-react'
import { createPortal } from 'react-dom'
import { PLACE_TYPES } from './EventsScreen.jsx'

const GRADS = ['grad-purple', 'grad-green', 'grad-amber']
function mapContact(c) {
  const name = c.name || 'Unknown'
  const grad = GRADS[name.charCodeAt(0) % GRADS.length]
  return {
    id:         c.id,
    initials:   name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    grad,
    textDark:   grad !== 'grad-purple',
    name,
    role:       [c.role, c.company].filter(Boolean).join(' · '),
    tags:       (c.contact_tags || []).map(t => t.tag),
    bookmarked: c.bookmarked  || false,
    followed:   c.followed_up || false,
    event:      c.met_event_name   || '',
    eventId:    c.met_event_id     || '',
    venueType:  c.met_venue_type   || 'event',
    roleBucket: c.role_bucket      || '',
    type:       c.contact_type     || '',
    offering:   c.offering_bucket  || '',
    seeking:    c.seeking_bucket   || '',
    phone:      c.phone            || '',
    linkedin:   c.linkedin_url     || '',
  }
}

const FALLBACK_RAW = [
  { id:'s1', name:'Sarah Raines',  role:'Product Manager',    company:'Stripe',           contact_tags:[{tag:'#fintech'},{tag:'#hot-lead'}],       bookmarked:true,  followed_up:false, met_event_name:'TechConnect Summit 2025', met_venue_type:'event',     role_bucket:'CXO',     contact_type:'Panelist' },
  { id:'s2', name:'Marcus Kim',    role:'Head of Engineering', company:'Linear',           contact_tags:[{tag:'#devtools'},{tag:'#api'}],            bookmarked:false, followed_up:true,  met_event_name:'TechConnect Summit 2025', met_venue_type:'event',     role_bucket:'Engg',    contact_type:'Panelist' },
  { id:'s3', name:'Anika Torres',  role:'Founder & CEO',       company:'Bloom AI',         contact_tags:[{tag:'#seed'},{tag:'#ai'}],                bookmarked:true,  followed_up:false, met_event_name:'AI Founders Mixer — NYC', met_venue_type:'event',     role_bucket:'Founders',contact_type:'Visitor'  },
  { id:'s4', name:'Raj Joshi',     role:'Principal',           company:'Sequoia Capital',  contact_tags:[{tag:'#vc'},{tag:'#fintech'}],             bookmarked:true,  followed_up:false, met_event_name:'AI Founders Mixer — NYC', met_venue_type:'event',     role_bucket:'Investor VC/PE', contact_type:'Visitor' },
  { id:'s5', name:'Lena Park',     role:'Head of Design',      company:'Figma',            contact_tags:[{tag:'#design'},{tag:'#ux'}],              bookmarked:true,  followed_up:true,  met_event_name:'WeWork Manyata Tech Park', met_venue_type:'workspace', role_bucket:'UX',      contact_type:'Exhibitor'},
  { id:'s6', name:'Devon Shaw',    role:'VP of Sales',         company:'Salesforce',       contact_tags:[{tag:'#crm'},{tag:'#enterprise'}],         bookmarked:false, followed_up:false, met_event_name:'WeWork Manyata Tech Park', met_venue_type:'workspace', role_bucket:'Sales',   contact_type:'Exhibitor'},
]

const ROLE_BUCKETS = ['Sales', 'Engg', 'UX', 'CXO', 'Ops', 'Investor VC/PE', 'Angel', 'Banker', 'Founders']
const TYPES = ['Exhibitor', 'Visitor', 'Panelist', 'Student', 'Organiser']
const OFFERING_BUCKETS = ['IT Services', 'AI Services', 'SaaS', 'Funding', 'Bankers']
const SEEKING_BUCKETS = ['Job', 'Clients', 'Dist. Partners', 'Early Customers']

const TABS = [
  { id: 'all',        label: 'All'       },
  { id: 'bookmarked', label: 'Bookmarked'},
  { id: 'by-place',   label: 'By Place'  },
]

export default function AllContactsScreen({ navigate }) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('all')
  const [search, setSearch]     = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    events: [],
    roleBuckets: [],
    types: [],
    offerings: [],
    seekings: [],
    followedUp: null,
  })
  // Expanded place groups in By Place tab
  const [expandedPlaces, setExpandedPlaces] = useState({})

  const portalRef = useRef(null)
  useEffect(() => {
    portalRef.current = document.querySelector('.phone-shell') ?? document.body
  }, [])

  useEffect(() => {
    apiFetch(`/api/contacts`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const rows = d.success ? (d.data || []) : []
        setContacts(rows.length > 0 ? rows.map(mapContact) : FALLBACK_RAW.map(mapContact))
      })
      .catch(() => setContacts(FALLBACK_RAW.map(mapContact)))
      .finally(() => setLoading(false))
  }, [])

  // Derive unique places from contacts
  const PLACE_OPTIONS = [...new Map(
    contacts.filter(c => c.event).map(c => [c.event, c.venueType])
  ).entries()].map(([name, venueType]) => ({ name, venueType: venueType || 'event' }))

  const toggleArr = (key, val) => setFilters(f => ({
    ...f,
    [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val]
  }))

  const baseFiltered = contacts.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.role.toLowerCase().includes(search.toLowerCase())) return false
    if (filters.events.length && !filters.events.includes(c.event)) return false
    if (filters.roleBuckets.length && !filters.roleBuckets.includes(c.roleBucket)) return false
    if (filters.types.length && !filters.types.includes(c.type)) return false
    if (filters.offerings.length && !filters.offerings.includes(c.offering)) return false
    if (filters.seekings.length && !filters.seekings.includes(c.seeking)) return false
    if (filters.followedUp === true && !c.followed) return false
    if (filters.followedUp === false && c.followed) return false
    return true
  })

  const filtered = tab === 'bookmarked'
    ? baseFiltered.filter(c => c.bookmarked)
    : baseFiltered

  const activeFilterCount = filters.events.length + filters.roleBuckets.length + filters.types.length +
    filters.offerings.length + filters.seekings.length + (filters.followedUp !== null ? 1 : 0)

  const clearAll = () => setFilters({ events: [], roleBuckets: [], types: [], offerings: [], seekings: [], followedUp: null })

  // Group contacts by place for By Place tab
  const byPlace = (() => {
    const groups = new Map()
    filtered.forEach(c => {
      const key = c.event || '—'
      if (!groups.has(key)) groups.set(key, { name: key, venueType: c.venueType, contacts: [] })
      groups.get(key).contacts.push(c)
    })
    return [...groups.values()].sort((a, b) => b.contacts.length - a.contacts.length)
  })()

  const bookmarkedCount = contacts.filter(c => c.bookmarked).length

  const Chip = ({ label, active, onToggle, activeColor = 'var(--indigo)', activeBg = 'rgba(99,102,241,0.12)' }) => (
    <button onClick={onToggle} style={{
      padding: '5px 13px', borderRadius: 100,
      border: active ? `1.5px solid ${activeColor}` : '1.5px solid var(--border)',
      background: active ? activeBg : 'var(--elevated)',
      color: active ? activeColor : 'var(--text-secondary)',
      fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer',
      fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )

  const Toggle = ({ active, onToggle, activeColor = 'var(--green)' }) => (
    <button onClick={onToggle} style={{
      width: 44, height: 26, borderRadius: 100, border: 'none', cursor: 'pointer',
      background: active ? activeColor : 'var(--elevated)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{ position: 'absolute', top: 3, left: active ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
    </button>
  )

  const ContactCard = ({ c }) => (
    <div
      onClick={() => navigate('contact', c)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', borderRadius: 16, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.15s' }}
    >
      <div className={`avatar ${c.grad}`} style={{ width: 42, height: 42, fontSize: 13, borderRadius: 12, color: c.textDark ? '#0B0B0E' : '#fff', flexShrink: 0 }}>
        {c.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{c.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: c.event ? 3 : (c.tags.length ? 4 : 0), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.role}</div>
        {c.event && tab !== 'by-place' && (() => {
          const pt = PLACE_TYPES.find(t => t.id === c.venueType) ?? PLACE_TYPES[0]
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: c.tags.length ? 4 : 0, overflow: 'hidden' }}>
              <pt.Icon size={10} color={pt.color} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: pt.color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{c.event}</span>
            </div>
          )
        })()}
        {c.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {c.tags.map(t => (
              <span key={t} style={{ fontSize: 10, fontWeight: 500, color: 'var(--indigo)', background: 'rgba(99,102,241,0.1)', borderRadius: 5, padding: '2px 7px' }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        {c.bookmarked && <Bookmark size={15} fill="var(--amber)" color="var(--amber)" />}
        <div style={{ display: 'flex', gap: 4 }}>
          {c.phone && (
            <button
              onClick={e => { e.stopPropagation(); window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}`, '_blank') }}
              style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(37,211,102,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MessageCircle size={11} color="#25D366" />
            </button>
          )}
          {c.phone && (
            <button
              onClick={e => { e.stopPropagation(); window.open(`tel:${c.phone}`) }}
              style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(50,213,131,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Phone size={11} color="var(--green)" />
            </button>
          )}
        </div>
        {c.followed ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: 'var(--green)', background: 'rgba(50,213,131,0.12)', borderRadius: 6, padding: '3px 7px' }}>
            <Check size={9} /> Done
          </span>
        ) : (
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--coral)', background: 'rgba(232,90,79,0.1)', borderRadius: 6, padding: '3px 7px' }}>
            Follow-up
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="screen" style={{ position: 'relative' }}>
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

      {/* Header */}
      <div style={{ padding: '6px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 500, letterSpacing: -0.8, color: 'var(--text-primary)', marginBottom: 2 }}>
            Contacts
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {loading ? 'Loading…' : `${contacts.length} total · ${bookmarkedCount} bookmarked`}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px',
            background: activeFilterCount > 0 ? 'rgba(99,102,241,0.12)' : 'var(--card)',
            border: activeFilterCount > 0 ? '1px solid var(--indigo)' : '1px solid var(--border)',
            borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            color: activeFilterCount > 0 ? 'var(--indigo)' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
          }}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--indigo)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 16px 10px', display: 'flex', gap: 6 }}>
        {TABS.map(t => {
          const isActive = tab === t.id
          const showBadge = t.id === 'bookmarked' && bookmarkedCount > 0
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 16px', borderRadius: 100, cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                background: isActive
                  ? (t.id === 'bookmarked' ? 'rgba(255,181,71,0.18)' : 'var(--indigo)')
                  : 'var(--card)',
                color: isActive
                  ? (t.id === 'bookmarked' ? 'var(--amber)' : '#fff')
                  : 'var(--text-secondary)',
                transition: 'all 0.15s',
                border: isActive && t.id === 'bookmarked' ? '1.5px solid rgba(255,181,71,0.4)' : '1.5px solid transparent',
              }}
            >
              {t.id === 'bookmarked' && <Bookmark size={12} fill={isActive ? 'var(--amber)' : 'none'} color={isActive ? 'var(--amber)' : 'var(--text-secondary)'} />}
              {t.label}
              {showBadge && !isActive && (
                <span style={{ width: 17, height: 17, borderRadius: '50%', background: 'rgba(255,181,71,0.2)', color: 'var(--amber)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {bookmarkedCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', borderRadius: 14, padding: '0 14px', height: 44, border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'bookmarked' ? 'Search bookmarked…' : tab === 'by-place' ? 'Search by name or role…' : 'Search contacts…'}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}><X size={14} /></button>}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {filters.events.map(e => {
            const pt = PLACE_TYPES.find(t => t.id === (PLACE_OPTIONS.find(p => p.name === e)?.venueType)) ?? PLACE_TYPES[0]
            return (
              <button key={e} onClick={() => toggleArr('events', e)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: pt.color, borderRadius: 100, border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                <pt.Icon size={10} /> {e} <X size={9} />
              </button>
            )
          })}
          {filters.roleBuckets.map(r => (
            <button key={r} onClick={() => toggleArr('roleBuckets', r)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(99,102,241,0.12)', borderRadius: 100, border: 'none', color: 'var(--indigo)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              {r} <X size={9} />
            </button>
          ))}
          {filters.followedUp === false && (
            <button onClick={() => setFilters(f => ({ ...f, followedUp: null }))} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(232,90,79,0.1)', borderRadius: 100, border: 'none', color: 'var(--coral)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              Pending Follow-up <X size={9} />
            </button>
          )}
          <button onClick={clearAll} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', textDecoration: 'underline' }}>
            Clear all
          </button>
        </div>
      )}

      {/* Contact list */}
      <div className="content" style={{ paddingTop: 4, paddingBottom: 100 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
            <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />
          </div>

        ) : tab === 'by-place' ? (
          // ── By Place grouped view ──────────────────────────────────────────
          byPlace.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Users size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: 15, fontWeight: 500 }}>No contacts yet</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Scan a QR or add contacts from a place</p>
            </div>
          ) : byPlace.map(group => {
            const pt = PLACE_TYPES.find(t => t.id === group.venueType) ?? PLACE_TYPES[0]
            const expanded = expandedPlaces[group.name] !== false  // default expanded
            const bookmarked = group.contacts.filter(c => c.bookmarked).length
            return (
              <div key={group.name} style={{ marginBottom: 14 }}>
                {/* Group header */}
                <button
                  onClick={() => setExpandedPlaces(prev => ({ ...prev, [group.name]: !expanded }))}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', background: pt.bg,
                    borderRadius: expanded ? '14px 14px 0 0' : 14,
                    border: `1.5px solid ${pt.color}30`,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'border-radius 0.15s',
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 9, background: `${pt.color}20`, border: `1.5px solid ${pt.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <pt.Icon size={15} color={pt.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</div>
                    <div style={{ fontSize: 10, color: pt.color, fontWeight: 600, marginTop: 1 }}>
                      {group.contacts.length} contact{group.contacts.length !== 1 ? 's' : ''}
                      {bookmarked > 0 && <span style={{ color: 'var(--amber)', marginLeft: 6 }}>· {bookmarked} <Bookmark size={9} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>}
                    </div>
                  </div>
                  <ChevronRight size={16} color={pt.color} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>

                {/* Group contacts */}
                {expanded && (
                  <div style={{ borderRadius: '0 0 14px 14px', overflow: 'hidden', border: `1.5px solid ${pt.color}20`, borderTop: 'none' }}>
                    {group.contacts.map((c, i) => (
                      <div
                        key={c.id}
                        onClick={() => navigate('contact', c)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px',
                          background: 'var(--card)',
                          borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                          cursor: 'pointer', transition: 'opacity 0.15s',
                        }}
                      >
                        <div className={`avatar ${c.grad}`} style={{ width: 36, height: 36, fontSize: 11, borderRadius: 10, color: c.textDark ? '#0B0B0E' : '#fff', flexShrink: 0 }}>
                          {c.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role}</div>
                          {c.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                              {c.tags.map(t => (
                                <span key={t} style={{ fontSize: 9, fontWeight: 500, color: 'var(--indigo)', background: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 6px' }}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {c.bookmarked && <Bookmark size={13} fill="var(--amber)" color="var(--amber)" />}
                          {c.phone && (
                            <button
                              onClick={e => { e.stopPropagation(); window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}`, '_blank') }}
                              style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(37,211,102,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <MessageCircle size={11} color="#25D366" />
                            </button>
                          )}
                          <ChevronRight size={14} color="var(--text-muted)" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })

        ) : tab === 'bookmarked' && filtered.length === 0 ? (
          // ── Bookmarked empty state ─────────────────────────────────────────
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <Bookmark size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>No bookmarks yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Tap the bookmark icon on any contact to save them here</p>
          </div>

        ) : filtered.length === 0 ? (
          // ── All contacts empty state ───────────────────────────────────────
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <Search size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>{contacts.length === 0 ? 'No contacts yet' : 'No contacts match'}</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>{contacts.length === 0 ? 'Scan a QR or add contacts from a place' : 'Try adjusting your filters'}</p>
          </div>

        ) : (
          // ── Flat list (All / Bookmarked) ───────────────────────────────────
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tab === 'bookmarked' && (
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: 'var(--amber)', textTransform: 'uppercase', padding: '0 2px 4px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Bookmark size={11} fill="var(--amber)" color="var(--amber)" /> {filtered.length} bookmarked across all places
              </div>
            )}
            {filtered.map(c => <ContactCard key={c.id} c={c} />)}
          </div>
        )}
      </div>

      {/* Filter bottom sheet — portal */}
      {portalRef.current && createPortal(
        <>
          <div
            onClick={() => setShowFilters(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)', zIndex: 60,
              pointerEvents: showFilters ? 'auto' : 'none',
              opacity: showFilters ? 1 : 0,
              transition: 'opacity 0.25s',
            }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'var(--card)', borderRadius: '22px 22px 0 0',
            zIndex: 61,
            transform: showFilters ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
            boxShadow: '0 -6px 40px rgba(0,0,0,0.4)',
            maxHeight: '90%',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '0 20px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingTop: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>Filters</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAll} style={{ background: 'rgba(232,90,79,0.1)', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--coral)', fontFamily: 'var(--font-sans)' }}>
                      Clear All
                    </button>
                  )}
                  <button onClick={() => setShowFilters(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', minHeight: 0 }}>

              {/* Place */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Place</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PLACE_OPTIONS.length === 0
                    ? <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>No places yet</span>
                    : PLACE_OPTIONS.map(({ name, venueType }) => {
                        const pt = PLACE_TYPES.find(t => t.id === venueType) ?? PLACE_TYPES[0]
                        const active = filters.events.includes(name)
                        return (
                          <button
                            key={name}
                            onClick={() => toggleArr('events', name)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 13px', borderRadius: 100,
                              border: active ? `1.5px solid ${pt.color}` : '1.5px solid var(--border)',
                              background: active ? pt.bg : 'var(--elevated)',
                              color: active ? pt.color : 'var(--text-secondary)',
                              fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer',
                              fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', transition: 'all 0.15s',
                            }}
                          >
                            <pt.Icon size={12} /> {name}
                          </button>
                        )
                      })}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

              {/* Followed-up */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Follow-up status</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Chip label="Done" active={filters.followedUp === true}  onToggle={() => setFilters(f => ({ ...f, followedUp: f.followedUp === true  ? null : true  }))} activeColor="var(--green)" activeBg="rgba(50,213,131,0.12)" />
                  <Chip label="Pending" active={filters.followedUp === false} onToggle={() => setFilters(f => ({ ...f, followedUp: f.followedUp === false ? null : false }))} activeColor="var(--coral)" activeBg="rgba(232,90,79,0.1)" />
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

              {/* Role Bucket */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Role</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ROLE_BUCKETS.map(r => <Chip key={r} label={r} active={filters.roleBuckets.includes(r)} onToggle={() => toggleArr('roleBuckets', r)} />)}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

              {/* Type */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Type</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TYPES.map(t => <Chip key={t} label={t} active={filters.types.includes(t)} onToggle={() => toggleArr('types', t)} />)}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

              {/* Offering */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Offering</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {OFFERING_BUCKETS.map(o => <Chip key={o} label={o} active={filters.offerings.includes(o)} onToggle={() => toggleArr('offerings', o)} activeColor="var(--green)" activeBg="rgba(50,213,131,0.12)" />)}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

              {/* Seeking */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Seeking</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SEEKING_BUCKETS.map(s => <Chip key={s} label={s} active={filters.seekings.includes(s)} onToggle={() => toggleArr('seekings', s)} activeColor="var(--coral)" activeBg="rgba(232,90,79,0.1)" />)}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 20px 28px', flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
              <button
                onClick={() => setShowFilters(false)}
                style={{ width: '100%', height: 50, background: 'var(--indigo)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Check size={16} /> Apply · {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>,
        portalRef.current
      )}
    </div>
  )
}
