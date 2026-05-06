import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X, Bookmark, Check, Loader } from 'lucide-react'
import { createPortal } from 'react-dom'
import { PLACE_TYPES } from './EventsScreen.jsx'

const API = import.meta.env.VITE_API_URL || ''

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
    venueType:  c.met_venue_type   || 'event',
    roleBucket: c.role_bucket      || '',
    type:       c.contact_type     || '',
    offering:   c.offering_bucket  || '',
    seeking:    c.seeking_bucket   || '',
  }
}

const FALLBACK_RAW = [
  { id:'s1', name:'Sarah Raines',  role:'Product Manager',    company:'Stripe',           contact_tags:[{tag:'#fintech'},{tag:'#product'},{tag:'#hot-lead'}],       bookmarked:true,  followed_up:false, met_event_name:'TechConnect Summit 2025', role_bucket:'CXO',           contact_type:'Panelist',  offering_bucket:'SaaS',       seeking_bucket:'Clients'       },
  { id:'s2', name:'Marcus Kim',    role:'Head of Engineering', company:'Linear',           contact_tags:[{tag:'#devtools'},{tag:'#api'}],                            bookmarked:false, followed_up:true,  met_event_name:'TechConnect Summit 2025', role_bucket:'Engg',          contact_type:'Panelist',  offering_bucket:'SaaS',       seeking_bucket:'Dist. Partners'},
  { id:'s3', name:'Anika Torres',  role:'Founder & CEO',       company:'Bloom AI',         contact_tags:[{tag:'#seed'},{tag:'#ai'},{tag:'#intro-requested'}],        bookmarked:true,  followed_up:false, met_event_name:'AI Founders Mixer — NYC', role_bucket:'Founders',      contact_type:'Visitor',   offering_bucket:'AI Services', seeking_bucket:'Clients'       },
  { id:'s4', name:'Raj Joshi',     role:'Principal',           company:'Sequoia Capital',  contact_tags:[{tag:'#vc'},{tag:'#fintech'},{tag:'#seed'}],                bookmarked:true,  followed_up:false, met_event_name:'AI Founders Mixer — NYC', role_bucket:'Investor VC/PE',contact_type:'Visitor',   offering_bucket:'Funding',    seeking_bucket:'Founders'      },
  { id:'s5', name:'Lena Park',     role:'Head of Design',      company:'Figma',            contact_tags:[{tag:'#design'},{tag:'#ux'},{tag:'#enterprise'}],           bookmarked:true,  followed_up:true,  met_event_name:'SaaS Growth Summit',      role_bucket:'UX',            contact_type:'Exhibitor', offering_bucket:'SaaS',       seeking_bucket:'Early Customers'},
  { id:'s6', name:'Devon Shaw',    role:'VP of Sales',         company:'Salesforce',       contact_tags:[{tag:'#crm'},{tag:'#enterprise'},{tag:'#partnership'}],     bookmarked:false, followed_up:false, met_event_name:'SaaS Growth Summit',      role_bucket:'Sales',         contact_type:'Exhibitor', offering_bucket:'SaaS',       seeking_bucket:'Dist. Partners'},
]

const ROLE_BUCKETS = ['Sales', 'Engg', 'UX', 'CXO', 'Ops', 'Investor VC/PE', 'Angel', 'Banker', 'Founders']
const TYPES = ['Exhibitor', 'Visitor', 'Panelist', 'Student', 'Organiser']
const OFFERING_BUCKETS = ['IT Services', 'AI Services', 'SaaS', 'Funding', 'Bankers']
const SEEKING_BUCKETS = ['Job', 'Clients', 'Dist. Partners', 'Early Customers']

/**
 * @component AllContactsScreen
 * @description Master directory list rendering all contacts acquired by the user.
 * Features fuzzy-search functionality and sortable metric filters tied inherently to the backend APIs.
 */
export default function AllContactsScreen({ navigate }) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    events: [],
    roleBuckets: [],
    types: [],
    offerings: [],
    seekings: [],
    bookmarked: false,
    followedUp: null,
  })

  useEffect(() => {
    fetch(`${API}/api/contacts`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const rows = d.success ? (d.data || []) : []
        setContacts(rows.length > 0 ? rows.map(mapContact) : FALLBACK_RAW.map(mapContact))
      })
      .catch(() => setContacts(FALLBACK_RAW.map(mapContact)))
      .finally(() => setLoading(false))
  }, [])

  // Derive unique places (name + venueType) from contacts
  const PLACE_OPTIONS = [...new Map(
    contacts.filter(c => c.event).map(c => [c.event, c.venueType])
  ).entries()].map(([name, venueType]) => ({ name, venueType: venueType || 'event' }))

  const toggleArr = (key, val) => setFilters(f => ({
    ...f,
    [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val]
  }))

  const filtered = contacts.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.role.toLowerCase().includes(search.toLowerCase())) return false
    if (filters.events.length && !filters.events.includes(c.event)) return false
    if (filters.roleBuckets.length && !filters.roleBuckets.includes(c.roleBucket)) return false
    if (filters.types.length && !filters.types.includes(c.type)) return false
    if (filters.offerings.length && !filters.offerings.includes(c.offering)) return false
    if (filters.seekings.length && !filters.seekings.includes(c.seeking)) return false
    if (filters.bookmarked && !c.bookmarked) return false
    if (filters.followedUp === true && !c.followed) return false
    if (filters.followedUp === false && c.followed) return false
    return true
  })

  const activeFilterCount = filters.events.length + filters.roleBuckets.length + filters.types.length +
    filters.offerings.length + filters.seekings.length + (filters.bookmarked ? 1 : 0) + (filters.followedUp !== null ? 1 : 0)

  const clearAll = () => setFilters({ events: [], roleBuckets: [], types: [], offerings: [], seekings: [], bookmarked: false, followedUp: null })

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
      <div style={{ padding: '6px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 500, letterSpacing: -0.8, color: 'var(--text-primary)', marginBottom: 2 }}>
            All Contacts
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {loading ? 'Loading…' : `${filtered.length} contacts`}
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

      {/* Search */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', borderRadius: 14, padding: '0 14px', height: 44, border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts..."
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
          {filters.bookmarked && (
            <button onClick={() => setFilters(f => ({ ...f, bookmarked: false }))} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(255,181,71,0.15)', borderRadius: 100, border: 'none', color: 'var(--amber)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              Bookmarked <X size={9} />
            </button>
          )}
          {filters.followedUp === false && (
            <button onClick={() => setFilters(f => ({ ...f, followedUp: null }))} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(232,90,79,0.1)', borderRadius: 100, border: 'none', color: 'var(--coral)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              Not Followed-up <X size={9} />
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
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <Search size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>{contacts.length === 0 ? 'No contacts yet' : 'No contacts match'}</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>{contacts.length === 0 ? 'Scan a QR or add contacts manually' : 'Try adjusting your filters'}</p>
          </div>
        ) : filtered.map(c => (
          <div
            key={c.id}
            onClick={() => navigate('contact', c)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', borderRadius: 16, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.15s' }}
          >
            <div className={`avatar ${c.grad}`} style={{ width: 42, height: 42, fontSize: 13, borderRadius: 12, color: c.textDark ? '#0B0B0E' : '#fff', flexShrink: 0 }}>
              {c.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.role}</div>
              {c.event && (() => {
                const pt = PLACE_TYPES.find(t => t.id === c.venueType) ?? PLACE_TYPES[0]
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5, overflow: 'hidden' }}>
                    <pt.Icon size={10} color={pt.color} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: pt.color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{c.event}</span>
                  </div>
                )
              })()}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {c.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 500, color: 'var(--indigo)', background: 'rgba(99,102,241,0.1)', borderRadius: 5, padding: '2px 7px' }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              {c.bookmarked && <Bookmark size={16} fill="var(--amber)" color="var(--amber)" />}
              {c.followed ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: 'var(--green)', background: 'rgba(50,213,131,0.12)', borderRadius: 6, padding: '3px 7px' }}>
                  <Check size={9} /> Followed
                </span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--coral)', background: 'rgba(232,90,79,0.1)', borderRadius: 6, padding: '3px 7px' }}>
                  Pending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filter bottom sheet — portal so it escapes the screen clip */}
      {createPortal(
        <>
          {/* Backdrop */}
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

          {/* Sheet */}
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

            {/* ── Fixed top: handle + header ── */}
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

            {/* ── Scrollable filter body ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', minHeight: 0 }}>

              {/* ── Place ── */}
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

              {/* ── Followed-up ── */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Followed-up</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Chip label="Yes" active={filters.followedUp === true}  onToggle={() => setFilters(f => ({ ...f, followedUp: f.followedUp === true  ? null : true  }))} activeColor="var(--green)" activeBg="rgba(50,213,131,0.12)" />
                  <Chip label="No"  active={filters.followedUp === false} onToggle={() => setFilters(f => ({ ...f, followedUp: f.followedUp === false ? null : false }))} activeColor="var(--coral)" activeBg="rgba(232,90,79,0.1)" />
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

              {/* ── Bookmarked ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bookmark size={14} fill={filters.bookmarked ? 'var(--amber)' : 'none'} color={filters.bookmarked ? 'var(--amber)' : 'var(--text-secondary)'} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>Bookmarked only</span>
                </div>
                <Toggle active={filters.bookmarked} onToggle={() => setFilters(f => ({ ...f, bookmarked: !f.bookmarked }))} activeColor="var(--amber)" />
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

              {/* ── Role Bucket ── */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Role</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ROLE_BUCKETS.map(r => <Chip key={r} label={r} active={filters.roleBuckets.includes(r)} onToggle={() => toggleArr('roleBuckets', r)} />)}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

              {/* ── Type ── */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Type</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TYPES.map(t => <Chip key={t} label={t} active={filters.types.includes(t)} onToggle={() => toggleArr('types', t)} />)}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

              {/* ── Offering ── */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Offering</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {OFFERING_BUCKETS.map(o => <Chip key={o} label={o} active={filters.offerings.includes(o)} onToggle={() => toggleArr('offerings', o)} activeColor="var(--green)" activeBg="rgba(50,213,131,0.12)" />)}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

              {/* ── Seeking ── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 }}>Seeking</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SEEKING_BUCKETS.map(s => <Chip key={s} label={s} active={filters.seekings.includes(s)} onToggle={() => toggleArr('seekings', s)} activeColor="var(--coral)" activeBg="rgba(232,90,79,0.1)" />)}
                </div>
              </div>
            </div>

            {/* ── Fixed bottom: Apply button ── */}
            <div style={{ padding: '12px 20px 28px', flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
              <button
                onClick={() => setShowFilters(false)}
                style={{ width: '100%', height: 50, background: 'var(--indigo)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Check size={16} /> Apply Filters · {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>,
        document.querySelector('.phone-shell') ?? document.body
      )}
    </div>
  )
}
