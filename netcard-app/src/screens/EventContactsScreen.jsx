import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Users, UserPlus, QrCode, BookUser, Link, Loader, MapPin, Calendar, Check, Bookmark, Phone, MessageCircle, ChevronRight } from 'lucide-react'
import { PLACE_TYPES } from './EventsScreen.jsx'

const API   = import.meta.env.VITE_API_URL || ''
const GRADS = ['grad-purple', 'grad-green', 'grad-amber']
const TIME_BOUNDED = new Set(['event', 'travel'])

// ── Sample data for demo when API returns no contacts ─────────────────────────
const SAMPLE_CONTACTS = {
  'sample-1': [
    { id:'sc1', name:'Sarah Raines',  role:'Product Manager', company:'Stripe',          phone:'+14155550101', linkedin_url:'https://linkedin.com/in/sarairaines',  contact_tags:[{tag:'#fintech'},{tag:'#hot-lead'}],          bookmarked:true,  followed_up:false },
    { id:'sc2', name:'Arjun Mehta',   role:'CTO',             company:'Razorpay',        phone:'+919876543210',linkedin_url:'https://linkedin.com/in/arjunmehta',   contact_tags:[{tag:'#fintech'},{tag:'#decision-maker'}],    bookmarked:true,  followed_up:true  },
    { id:'sc3', name:'Lisa Chen',     role:'VP Sales',        company:'Figma',           phone:'+12125550199', linkedin_url:'https://linkedin.com/in/lisachen',     contact_tags:[{tag:'#design'},{tag:'#warm'}],               bookmarked:false, followed_up:false },
    { id:'sc4', name:'Omar Farooq',   role:'Founder',         company:'Bloom AI',        phone:'+447700900000',linkedin_url:'https://linkedin.com/in/omarfarooq',   contact_tags:[{tag:'#ai'},{tag:'#seed'}],                   bookmarked:true,  followed_up:false },
    { id:'sc5', name:'Priya Nair',    role:'Head of Growth',  company:'Notion',          phone:'+14155550188', linkedin_url:'',                                      contact_tags:[{tag:'#saas'}],                               bookmarked:false, followed_up:true  },
    { id:'sc6', name:'James Wu',      role:'Angel Investor',  company:'Self',            phone:'',             linkedin_url:'https://linkedin.com/in/jameswu',      contact_tags:[{tag:'#investor'}],                           bookmarked:false, followed_up:false },
  ],
  'sample-2': [
    { id:'sc7', name:'Rahul Sharma',  role:'SaaS Founder',    company:'CloudStack',      phone:'+919900001111',linkedin_url:'',                                      contact_tags:[{tag:'#saas'}],                               bookmarked:false, followed_up:false },
    { id:'sc8', name:'Neha Joshi',    role:'Product Lead',    company:'Groww',           phone:'+919900002222',linkedin_url:'https://linkedin.com/in/nehajoshi',     contact_tags:[{tag:'#fintech'}],                            bookmarked:true,  followed_up:false },
    { id:'sc9', name:'Kiran Rao',     role:'CTO',             company:'FinPay',          phone:'',             linkedin_url:'',                                      contact_tags:[],                                            bookmarked:false, followed_up:true  },
  ],
  'sample-3': [
    { id:'sc10', name:'Deepa Menon',  role:'Architect',       company:'HDC Designs',     phone:'+919800001111',linkedin_url:'',                                      contact_tags:[],                                            bookmarked:false, followed_up:false },
    { id:'sc11', name:'Suresh Iyer',  role:'Resident',        company:'Tower B',         phone:'+919800002222',linkedin_url:'',                                      contact_tags:[],                                            bookmarked:false, followed_up:false },
  ],
  'sample-4': [
    { id:'sc12', name:'Vikram Bose',  role:'Personal Trainer',company:"Gold's Gym",      phone:'+919700001111',linkedin_url:'',                                      contact_tags:[{tag:'#fitness'}],                            bookmarked:false, followed_up:false },
  ],
}

function mapC(c) {
  const name = c.name || 'Unknown'
  return {
    id:         c.id,
    name,
    role:       [c.role, c.company].filter(Boolean).join(' · '),
    initials:   name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    grad:       GRADS[name.charCodeAt(0) % GRADS.length],
    bookmarked: c.bookmarked   || false,
    followed:   c.followed_up  || false,
    phone:      c.phone        || '',
    email:      c.email        || '',
    linkedin:   c.linkedin_url || '',
    tags:       (c.contact_tags || []).map(t => t.tag),
  }
}

function parseLinkedInUrl(raw) {
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

function formatDates(start, end) {
  if (!start) return ''
  const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return end && end !== start ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

const EMPTY_FORM = { name: '', role: '', company: '', email: '', phone: '' }

export default function EventContactsScreen({ navigate, goBack, screenData }) {
  const place = screenData ?? {}
  const pt    = PLACE_TYPES.find(t => t.id === (place.venue_type || 'event')) ?? PLACE_TYPES[0]

  const [contacts,    setContacts]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activeFilter,setActiveFilter]= useState(null)  // null | 'followups' | 'bookmarked'
  const [addMode,     setAddMode]     = useState(null)   // 'manual' | 'url'
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [urlInput,    setUrlInput]    = useState('')
  const [urlForm,     setUrlForm]     = useState({ name:'', role:'', company:'', email:'', phone:'', linkedin:'' })
  const [urlStep,     setUrlStep]     = useState('input') // 'input' | 'form'
  const [saving,      setSaving]      = useState(false)
  const [activating,  setActivating]  = useState(false)
  const fileRef = useRef(null)

  const isActive     = place.is_active || place.status === 'active'
  const isTimeBounded= TIME_BOUNDED.has(pt.id)
  const dateStr      = isTimeBounded ? formatDates(place.start_date, place.end_date) : ''

  // ── Load contacts ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!place.id) { setLoading(false); return }
    if (place.id.startsWith('sample-')) {
      setContacts((SAMPLE_CONTACTS[place.id] ?? []).map(mapC))
      setLoading(false)
      return
    }
    fetch(`${API}/api/contacts?event_id=${place.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setContacts(d.success && Array.isArray(d.data) ? d.data.map(mapC) : []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false))
  }, [place.id])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalContacts = contacts.length
  const totalFollowups = contacts.filter(c => !c.followed).length
  const totalBookmarked= contacts.filter(c => c.bookmarked).length

  // ── Filtered list ──────────────────────────────────────────────────────────
  const displayed = contacts.filter(c => {
    if (activeFilter === 'followups')  return !c.followed
    if (activeFilter === 'bookmarked') return c.bookmarked
    return true
  })

  // ── Activate place ─────────────────────────────────────────────────────────
  const ensureActive = async () => {
    if (isActive) return
    setActivating(true)
    try {
      await fetch(`${API}/api/events/${place.id}/activate`, { method: 'POST', credentials: 'include' })
      localStorage.setItem('netcard_active_event', JSON.stringify({ ...place, is_active: true }))
    } finally {
      setActivating(false)
    }
  }

  // ── Optimistic toggles ─────────────────────────────────────────────────────
  const toggleBookmark = (contactId) => {
    const contact = contacts.find(c => c.id === contactId)
    if (!contact) return
    const next = !contact.bookmarked
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, bookmarked: next } : c))
    if (!contactId.toString().startsWith('sc')) {
      fetch(`${API}/api/contacts/${contactId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ bookmarked: next }),
      }).catch(() => {})
    }
  }

  // ── Save new contact ───────────────────────────────────────────────────────
  const saveContact = async (data) => {
    if (!data.name?.trim()) return
    setSaving(true)
    try {
      await ensureActive()
      // Sample place IDs aren't real UUIDs — omit event_id so the backend uses the active event
      const isSample = place.id?.toString().startsWith('sample-')
      const body = { ...data, ...(isSample ? {} : { event_id: place.id }) }
      const res = await fetch(`${API}/api/contacts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(body),
      })
      const d = await res.json()
      if (d.success && d.data) {
        setAddMode(null); setForm(EMPTY_FORM); setUrlInput('')
        setUrlForm({ name:'', role:'', company:'', email:'', phone:'', linkedin:'' }); setUrlStep('input')
        // Navigate to the contact so the user can see exactly where it landed
        navigate('contact', d.data)
      }
    } finally { setSaving(false) }
  }

  const handleVCF = (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      await ensureActive()
      const res = await fetch(`${API}/api/contacts/scan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ raw_vcard: e.target.result }),
      })
      const d = await res.json()
      if (d.success && d.data) setContacts(prev => [mapC(d.data), ...prev])
      fileRef.current.value = ''
    }
    reader.readAsText(file)
  }

  const handleScanTap = async () => { await ensureActive(); navigate('scan', { returnTo: 'eventContacts', returnData: place }) }
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12,
    border: '1.5px solid var(--border)', background: 'var(--elevated)', outline: 'none',
    fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
  }

  return (
    <div className="screen">
      {/* Status bar */}
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

      {/* Header bar */}
      <div className="screen-header">
        <button className="icon-btn" onClick={goBack ?? (() => navigate('events'))}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0, justifyContent:'center' }}>
          <div style={{ width:26, height:26, borderRadius:8, background:pt.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <pt.Icon size={14} color={pt.color} />
          </div>
          <span style={{ fontSize:15, fontWeight:700, fontFamily:'var(--font-sans)', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {place.name || 'Place'}
          </span>
        </div>
        <div style={{ width:36 }} />
      </div>

      {/* Scrollable body */}
      <div style={{ flex:1, minHeight:0, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>

        {/* ── Place info card ── */}
        <div style={{ margin:'0 16px 12px', background:'var(--card)', borderRadius:20, padding:'14px 16px' }}>

          {/* Active badge + Set Active */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            {isActive ? (
              <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(50,213,131,0.12)', borderRadius:100, padding:'4px 10px' }}>
                <span className="pulse" style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', display:'inline-block' }} />
                <span style={{ fontSize:10, fontWeight:700, color:'var(--green)', letterSpacing:0.6 }}>ACTIVE PLACE</span>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:6, background:pt.bg, borderRadius:100, padding:'4px 10px' }}>
                <pt.Icon size={11} color={pt.color} />
                <span style={{ fontSize:10, fontWeight:700, color:pt.color, letterSpacing:0.5, textTransform:'uppercase' }}>{pt.label}</span>
              </div>
            )}
            {!isActive && (
              <button
                onClick={ensureActive}
                disabled={activating}
                style={{ fontSize:12, fontWeight:600, color:pt.color, background:pt.bg, border:`1.5px solid ${pt.color}40`, borderRadius:8, padding:'5px 12px', cursor:'pointer', fontFamily:'var(--font-sans)', display:'flex', alignItems:'center', gap:5 }}
              >
                {activating ? <Loader size={11} style={{ animation:'spin 0.8s linear infinite' }} /> : <Check size={11} />}
                Set Active
              </button>
            )}
          </div>

          {/* Place name */}
          <div style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:600, color:'var(--text-primary)', letterSpacing:-0.3, marginBottom:8 }}>
            {place.name || 'Unnamed Place'}
          </div>

          {/* Location + dates — event/travel only */}
          {(place.location || dateStr) && (
            <div style={{ display:'flex', gap:16, marginBottom:12, flexWrap:'wrap' }}>
              {place.location && (
                <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-secondary)', fontSize:12 }}>
                  <MapPin size={12} color={pt.color} style={{ opacity:0.7 }} /> {place.location}
                </div>
              )}
              {dateStr && (
                <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-secondary)', fontSize:12 }}>
                  <Calendar size={12} /> {dateStr}
                </div>
              )}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display:'flex', gap:8 }}>
            {[
              { key:null,          val: loading ? '…' : totalContacts,  label:'Contacts',   color:'var(--green)'  },
              { key:'followups',   val: loading ? '…' : totalFollowups, label:'Follow-ups', color:'var(--indigo)' },
              { key:'bookmarked',  val: loading ? '…' : totalBookmarked,label:'Bookmarked', color:'var(--coral)'  },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setActiveFilter(activeFilter === s.key ? null : s.key)}
                style={{
                  flex:1, background: activeFilter === s.key ? s.color + '18' : 'var(--elevated)',
                  border: activeFilter === s.key ? `1.5px solid ${s.color}40` : '1.5px solid transparent',
                  borderRadius:12, padding:'10px 12px', cursor:'pointer', textAlign:'left',
                  transition:'all 0.15s',
                }}
              >
                <div style={{ fontFamily:'var(--font-sans)', fontSize:20, fontWeight:700, color:s.color, letterSpacing:-0.5 }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:1 }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Add Contact section ── */}
        <div style={{ margin:'0 16px 12px' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color:'var(--text-muted)', marginBottom:8 }}>Add Contact</div>
          <div style={{ display:'flex', gap:7 }}>
            {[
              { id:'manual',  label:'Manually',     Icon:UserPlus  },
              { id:'scan',    label:'Scan QR',      Icon:QrCode    },
              { id:'address', label:'Address\nBook',Icon:BookUser  },
              { id:'url',     label:'From URL',     Icon:Link      },
            ].map(m => {
              const active = addMode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (m.id === 'scan')    { handleScanTap(); return }
                    if (m.id === 'address') { fileRef.current?.click(); return }
                    setAddMode(active ? null : m.id)
                  }}
                  style={{
                    flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                    padding:'10px 4px', borderRadius:14,
                    border:`1.5px solid ${active ? pt.color : 'var(--border)'}`,
                    background: active ? pt.bg : 'var(--card)', cursor:'pointer', transition:'all 0.15s',
                  }}
                >
                  <m.Icon size={18} color={active ? pt.color : 'var(--text-secondary)'} />
                  <span style={{ fontSize:10, fontWeight:600, color:active ? pt.color : 'var(--text-secondary)', fontFamily:'var(--font-sans)', textAlign:'center', whiteSpace:'pre', lineHeight:1.3 }}>
                    {m.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Manual form */}
        {addMode === 'manual' && (
          <div style={{ margin:'0 16px 12px', display:'flex', flexDirection:'column', gap:8 }}>
            <input style={inputStyle} placeholder="Name *" value={form.name} onChange={f('name')} autoFocus />
            <div style={{ display:'flex', gap:8 }}>
              <input style={{ ...inputStyle, flex:1 }} placeholder="Role"    value={form.role}    onChange={f('role')} />
              <input style={{ ...inputStyle, flex:1 }} placeholder="Company" value={form.company} onChange={f('company')} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input style={{ ...inputStyle, flex:1 }} placeholder="Email" value={form.email} onChange={f('email')} type="email" />
              <input style={{ ...inputStyle, flex:1 }} placeholder="Phone" value={form.phone} onChange={f('phone')} type="tel" />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setAddMode(null); setForm(EMPTY_FORM) }} style={{ flex:1, padding:'10px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--elevated)', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}>Cancel</button>
              <button onClick={() => saveContact(form)} disabled={saving || !form.name.trim()} style={{ flex:2, padding:'10px', borderRadius:12, border:'none', background:form.name.trim() ? pt.color : 'var(--border)', cursor:form.name.trim() ? 'pointer' : 'default', fontSize:13, fontWeight:700, color:'#fff', fontFamily:'var(--font-sans)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {saving ? <Loader size={13} style={{ animation:'spin 0.8s linear infinite' }} /> : <Check size={13} />} Save Contact
              </button>
            </div>
          </div>
        )}

        {/* URL form — Step 1: paste URL */}
        {addMode === 'url' && urlStep === 'input' && (
          <div style={{ margin:'0 16px 12px', display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-sans)', lineHeight:1.5 }}>
              Paste a LinkedIn profile URL — we'll extract the name and pre-fill a form for you.
            </div>
            <input
              style={inputStyle}
              placeholder="linkedin.com/in/username"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && urlInput.trim()) { const p = parseLinkedInUrl(urlInput); setUrlForm({ ...urlForm, name: p.name, linkedin: p.linkedin }); setUrlStep('form') } }}
              autoFocus
            />
            <div style={{ display:'flex', gap:8 }}>
              <button
                onClick={() => { setAddMode(null); setUrlInput(''); setUrlStep('input') }}
                style={{ flex:1, padding:'10px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--elevated)', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { const p = parseLinkedInUrl(urlInput); setUrlForm({ name: p.name, role:'', company:'', email:'', phone:'', linkedin: p.linkedin }); setUrlStep('form') }}
                disabled={!urlInput.trim()}
                style={{ flex:2, padding:'10px', borderRadius:12, border:'none', background: urlInput.trim() ? pt.color : 'var(--border)', cursor: urlInput.trim() ? 'pointer' : 'default', fontSize:13, fontWeight:700, color:'#fff', fontFamily:'var(--font-sans)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              >
                <Link size={13} /> Next →
              </button>
            </div>
          </div>
        )}

        {/* URL form — Step 2: fill in details */}
        {addMode === 'url' && urlStep === 'form' && (
          <div style={{ margin:'0 16px 12px', display:'flex', flexDirection:'column', gap:8 }}>
            {/* LinkedIn URL — read-only display */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, background:'rgba(99,102,241,0.08)', border:'1.5px solid rgba(99,102,241,0.2)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#6366F1"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              <span style={{ fontSize:11, color:'var(--indigo)', fontFamily:'var(--font-sans)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{urlForm.linkedin}</span>
              <button onClick={() => setUrlStep('input')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-sans)', flexShrink:0 }}>Change</button>
            </div>

            <input
              style={{ ...inputStyle, borderColor: urlForm.name ? pt.color : 'var(--border)' }}
              placeholder="Full Name *"
              value={urlForm.name}
              onChange={e => setUrlForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
            <div style={{ display:'flex', gap:8 }}>
              <input style={{ ...inputStyle, flex:1 }} placeholder="Designation / Role" value={urlForm.role}    onChange={e => setUrlForm(f => ({ ...f, role: e.target.value }))} />
              <input style={{ ...inputStyle, flex:1 }} placeholder="Company"            value={urlForm.company} onChange={e => setUrlForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <input style={inputStyle} placeholder="Mobile Number" value={urlForm.phone} onChange={e => setUrlForm(f => ({ ...f, phone: e.target.value }))} type="tel" />
            <input style={inputStyle} placeholder="Email (optional)" value={urlForm.email} onChange={e => setUrlForm(f => ({ ...f, email: e.target.value }))} type="email" />

            <div style={{ display:'flex', gap:8 }}>
              <button
                onClick={() => { setUrlStep('input') }}
                style={{ flex:1, padding:'10px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--elevated)', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}
              >
                ← Back
              </button>
              <button
                onClick={() => saveContact({ name: urlForm.name, role: urlForm.role, company: urlForm.company, email: urlForm.email, phone: urlForm.phone, linkedin_url: urlForm.linkedin })}
                disabled={saving || !urlForm.name.trim()}
                style={{ flex:2, padding:'10px', borderRadius:12, border:'none', background: urlForm.name.trim() ? pt.color : 'var(--border)', cursor: urlForm.name.trim() ? 'pointer' : 'default', fontSize:13, fontWeight:700, color:'#fff', fontFamily:'var(--font-sans)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              >
                {saving ? <Loader size={13} style={{ animation:'spin 0.8s linear infinite' }} /> : <Check size={13} />} Save Contact
              </button>
            </div>
          </div>
        )}

        <input ref={fileRef} type="file" accept=".vcf,text/vcard" style={{ display:'none' }} onChange={e => e.target.files?.[0] && handleVCF(e.target.files[0])} />

        {/* ── Contact list ── */}
        <div style={{ padding:'0 16px 80px' }}>

          {/* Active filter label */}
          {activeFilter && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:0.4, color:'var(--text-muted)', textTransform:'uppercase' }}>
                {activeFilter === 'followups' ? 'Needs Follow-up' : 'Bookmarked'}
              </span>
              <button onClick={() => setActiveFilter(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-sans)' }}>
                Show all
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
              <Loader size={20} color="var(--text-muted)" style={{ animation:'spin 1s linear infinite' }} />
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <Users size={36} color="var(--border)" style={{ margin:'0 auto 12px', display:'block' }} />
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text-secondary)', fontFamily:'var(--font-serif)', marginBottom:4 }}>
                {contacts.length === 0 ? 'No contacts yet' : 'No contacts match'}
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-sans)', lineHeight:1.5 }}>
                {contacts.length === 0 ? 'Add contacts with the buttons above' : 'Tap a stat to clear the filter'}
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {displayed.map(c => (
                <div
                  key={c.id}
                  className="card"
                  onClick={() => navigate('contact', c)}
                  style={{ borderRadius:16, padding:'12px 14px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', transition:'opacity 0.15s' }}
                >
                  {/* Avatar */}
                  <div className={`avatar ${c.grad}`} style={{ width:44, height:44, fontSize:14, borderRadius:12, flexShrink:0 }}>
                    {c.initials}
                  </div>

                  {/* Main content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    {/* Name + action buttons */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap' }}>
                      <span style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{c.name}</span>
                      {c.linkedin && (
                        <button
                          onClick={e => { e.stopPropagation(); window.open(c.linkedin.startsWith('http') ? c.linkedin : `https://${c.linkedin}`, '_blank') }}
                          style={{ width:22, height:22, borderRadius:6, background:'rgba(99,102,241,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#6366F1"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                        </button>
                      )}
                      {c.phone && (
                        <button
                          onClick={e => { e.stopPropagation(); window.open(`tel:${c.phone}`) }}
                          style={{ width:22, height:22, borderRadius:6, background:'rgba(50,213,131,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                        >
                          <Phone size={11} color="var(--green)" />
                        </button>
                      )}
                      {c.phone && (
                        <button
                          onClick={e => { e.stopPropagation(); window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}`, '_blank') }}
                          style={{ width:22, height:22, borderRadius:6, background:'rgba(232,90,79,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                        >
                          <MessageCircle size={11} color="var(--coral)" />
                        </button>
                      )}
                    </div>

                    {/* Role */}
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom: c.tags.length ? 5 : 0 }}>{c.role}</div>

                    {/* Tags */}
                    {c.tags.length > 0 && (
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {c.tags.map(t => <span key={t} className="tag" style={{ fontSize:10, padding:'2px 8px' }}>{t}</span>)}
                      </div>
                    )}
                  </div>

                  {/* Right side: bookmark + chevron */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0 }}>
                    <button
                      onClick={e => { e.stopPropagation(); toggleBookmark(c.id) }}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:2 }}
                    >
                      <Bookmark size={17} fill={c.bookmarked ? 'var(--amber)' : 'none'} color={c.bookmarked ? 'var(--amber)' : 'var(--text-tertiary)'} />
                    </button>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
