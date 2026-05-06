import { Sparkles, ChevronDown, X, Copy, Check, Bookmark, SlidersHorizontal, Clock, Trash2, Loader, RefreshCw, CalendarDays } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const API = import.meta.env.VITE_API_URL || ''

const WhatsAppIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)
const EmailIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)
const SmsIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const CallIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.43 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.18 6.18l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const CHANNEL_META = {
  WhatsApp: { bg: '#25D366', icon: <WhatsAppIcon /> },
  SMS:      { bg: 'var(--coral)', icon: <SmsIcon /> },
  Email:    { bg: 'var(--indigo)', icon: <EmailIcon /> },
  Call:     { bg: '#6B7280', icon: <CallIcon /> },
}

const GRADS = ['grad-purple', 'grad-green', 'grad-amber']
const PRIORITY_META = {
  High:   { color: 'var(--coral)',      bg: 'rgba(232,90,79,0.12)'  },
  Medium: { color: 'var(--amber)',      bg: 'rgba(255,181,71,0.12)' },
  Low:    { color: 'var(--text-muted)', bg: 'var(--border)'         },
}

function mapFollowup(f) {
  const name = f.contacts?.name || 'Unknown'
  const grad = GRADS[name.charCodeAt(0) % GRADS.length]
  const pm   = PRIORITY_META[f.priority] ?? PRIORITY_META.Low
  return {
    id:            f.id,
    contact_id:    f.contact_id,
    initials:      name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    grad,
    textDark:      grad !== 'grad-purple',
    name,
    role:          [f.contacts?.role, f.contacts?.company].filter(Boolean).join(' · '),
    email:         f.contacts?.email  || '',
    phone:         f.contacts?.phone  || '',
    bookmarked:    false,
    priority:      f.priority         || 'Low',
    priorityColor: pm.color,
    priorityBg:    pm.bg,
    message:       f.message          || '',
    reason:        f.reason           || '',
    action:        f.action           || '',
    eventName:     f.events?.name     || '',
  }
}

function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function sendViaWhatsApp(phone, msg) { window.open(`https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank') }
function sendViaEmail(email, msg) { window.open(`mailto:${email}?subject=Great connecting with you!&body=${encodeURIComponent(msg)}`, '_blank') }
function sendViaSms(phone, msg) { window.open(`sms:+${phone.replace(/\D/g,'')}?&body=${encodeURIComponent(msg)}`, '_blank') }
function placeCall(phone) { window.open(`tel:${phone}`, '_self') }

const CHIP = ({ label, active, color, onClick }) => (
  <button onClick={onClick} style={{
    padding: '6px 13px', borderRadius: 100, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
    border: active ? `1.5px solid ${color || 'var(--indigo)'}` : '1.5px solid var(--border)',
    background: active ? (color ? `${color}18` : 'rgba(99,102,241,0.12)') : 'transparent',
    color: active ? (color || 'var(--indigo)') : 'var(--text-secondary)',
    transition: 'all 0.15s',
  }}>{label}</button>
)

const FALLBACK_FOLLOWUPS = [
  { id:'sf1', contact_id:'s1', initials:'SR', grad:'grad-amber', textDark:true,  name:'Sarah Raines',  role:'Product Manager · Stripe',          email:'sarah.raines@stripe.com', phone:'+14155552671', bookmarked:true,  priority:'High',   priorityColor:'var(--coral)',      priorityBg:'rgba(232,90,79,0.12)',   message:"Hi Sarah, great connecting at TechConnect! I'd love to share our pricing deck — Stripe's AI-first CRM evaluation sounds like a perfect fit for what we've built. When's a good time for a quick call?", reason:'Based on: #hot-lead tag + explicit mention of evaluating AI CRM tools.', action:'Send via Email',    eventName:'TechConnect Summit 2025' },
  { id:'sf2', contact_id:'s3', initials:'AT', grad:'grad-amber', textDark:true,  name:'Anika Torres',  role:'Founder & CEO · Bloom AI',           email:'anika@bloom.ai',          phone:'+14155554432', bookmarked:true,  priority:'High',   priorityColor:'var(--coral)',      priorityBg:'rgba(232,90,79,0.12)',   message:"Hey Anika, loved your energy at the AI Founders Mixer! Happy to make that intro to Raj — I think there's a real fit there. Should I just connect you two over email?", reason:'Based on: #intro-requested tag + mutual connection noted.', action:'Send via WhatsApp', eventName:'AI Founders Mixer — NYC' },
  { id:'sf3', contact_id:'s4', initials:'RJ', grad:'grad-green', textDark:true,  name:'Raj Joshi',     role:'Principal · Sequoia Capital',        email:'raj@sequoiacap.com',      phone:'+16505551234', bookmarked:true,  priority:'High',   priorityColor:'var(--coral)',      priorityBg:'rgba(232,90,79,0.12)',   message:"Hi Raj, thanks for the chat in Brooklyn! We've polished the deck since — would love to get 20 mins on your calendar before end of quarter to walk through Series A readiness.", reason:'Based on: Investor VC/PE role + said to reach out with deck in Q2.', action:'Send via Email',    eventName:'AI Founders Mixer — NYC' },
  { id:'sf4', contact_id:'s6', initials:'DS', grad:'grad-amber', textDark:true,  name:'Devon Shaw',    role:'VP of Sales · Salesforce',           email:'dshaw@salesforce.com',    phone:'+14155557788', bookmarked:false, priority:'Medium', priorityColor:'var(--amber)',      priorityBg:'rgba(255,181,71,0.12)', message:"Devon, great meeting you at SaaS Growth! Given Salesforce's distribution reach, I think there's a compelling partnership angle for our AI automation layer. Would love to explore further.", reason:'Based on: #partnership tag + VP Sales role at enterprise company.', action:'Send via LinkedIn',  eventName:'SaaS Growth Summit'      },
  { id:'sf5', contact_id:'s2', initials:'MK', grad:'grad-amber', textDark:true,  name:'Marcus Kim',    role:'Head of Engineering · Linear',       email:'marcus@linear.app',       phone:'+14155559823', bookmarked:false, priority:'Low',    priorityColor:'var(--text-muted)', priorityBg:'var(--border)',          message:"Marcus, enjoyed the devtools panel at TechConnect! The Linear integration angle is worth a follow-up — happy to share our API docs if helpful.", reason:'Based on: already followed up, but integration opportunity noted.', action:'Send via Email',    eventName:'TechConnect Summit 2025' },
]

const LS_KEY = 'netcard_sent_log'
function loadLog() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveLog(log) { try { localStorage.setItem(LS_KEY, JSON.stringify(log)) } catch {} }

const DEFAULT_FILTER = { sort: 'Priority', priorities: [], statuses: ['Pending'], bookmarkedOnly: false, notesOnly: false }

export default function AIFollowupsScreen() {
  const [followups, setFollowups]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [generating, setGenerating]   = useState(false)
  const [dismissed, setDismissed]     = useState([])
  const [sentIds, setSentIds]         = useState({})
  const [sentLog, setSentLog]         = useState(loadLog)
  const [copied, setCopied]           = useState(null)
  const [showFilter, setShowFilter]   = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editingId, setEditingId]     = useState(null)
  const [editText, setEditText]       = useState('')
  const [editedMessages, setEditedMessages] = useState({})
  const [draft, setDraft]             = useState(DEFAULT_FILTER)
  const [applied, setApplied]         = useState(DEFAULT_FILTER)
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [events, setEvents]           = useState([])
  const [activeEvent, setActiveEvent] = useState(() => { try { return JSON.parse(localStorage.getItem('netcard_active_event') || 'null') } catch { return null } })

  // Fetch events for picker
  useEffect(() => {
    fetch(`${API}/api/events`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.length) setEvents(d.data) })
      .catch(() => {})
  }, [])

  const selectEvent = (ev) => {
    const val = ev === null ? null : ev
    try { localStorage.setItem('netcard_active_event', JSON.stringify(val)) } catch {}
    setActiveEvent(val)
    setShowEventPicker(false)
  }

  useEffect(() => {
    fetch(`${API}/api/ai/followups`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const rows = d.success ? (d.data || []) : []
        setFollowups(rows.length > 0 ? rows.map(mapFollowup) : FALLBACK_FOLLOWUPS)
      })
      .catch(() => setFollowups(FALLBACK_FOLLOWUPS))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { saveLog(sentLog) }, [sentLog])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const body = activeEvent?.id ? { event_id: activeEvent.id } : {}
      const r = await fetch(`${API}/api/ai/followups`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (d.success && d.data?.length) {
        setFollowups(prev => {
          const existingIds = new Set(prev.map(f => f.id))
          const newOnes = d.data.filter(f => !existingIds.has(f.id)).map(mapFollowup)
          return [...newOnes, ...prev]
        })
      }
    } catch {}
    setGenerating(false)
  }

  const hasActiveFilters = applied.priorities.length > 0 || applied.bookmarkedOnly || applied.notesOnly || applied.statuses.join(',') !== 'Pending'
  const toggleArr = (arr, val) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

  const handleSend = (s, channel) => {
    setSentIds(prev => ({ ...prev, [s.id]: channel }))
    const entry = {
      logId: `${s.id}_${Date.now()}`,
      id: s.id, name: s.name, role: s.role,
      initials: s.initials, grad: s.grad, textDark: s.textDark,
      bookmarked: s.bookmarked, channel, message: editedMessages[s.id] ?? s.message, sentAt: Date.now(),
    }
    setSentLog(log => [entry, ...log.filter(e => e.id !== s.id)])
    fetch(`${API}/api/ai/followups/${s.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    }).catch(() => {})
  }
  const handleDeleteSent = (id) => {
    setSentIds(prev => { const n = { ...prev }; delete n[id]; return n })
    setSentLog(log => log.filter(e => e.id !== id))
  }
  const handleDismiss = (id) => {
    setDismissed(d => [...d, id])
    fetch(`${API}/api/ai/followups/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'dismissed' }),
    }).catch(() => {})
  }
  const handleCopy = (id, message) => {
    navigator.clipboard?.writeText(message).catch(() => {})
    setCopied(id); setTimeout(() => setCopied(null), 2000)
  }
  const startEdit = (id, msg) => { setEditingId(id); setEditText(msg) }
  const saveEdit = (id) => { setEditedMessages(m => ({ ...m, [id]: editText })); setEditingId(null) }
  const cancelEdit = () => setEditingId(null)
  const msgFor = (s) => editedMessages[s.id] ?? s.message

  const openFilter = () => { setDraft({ ...applied }); setShowFilter(true) }
  const applyFilter = () => {
    setApplied({ ...draft })
    setShowFilter(false)
    if (draft.statuses.includes('Sent')) setShowHistory(true)
  }
  const resetFilter = () => { setDraft(DEFAULT_FILTER); setApplied(DEFAULT_FILTER); setShowFilter(false) }

  // Stats for filter sheet
  const bookmarkedCount = followups.filter(s => s.bookmarked).length

  // Visible list (pending + optionally sent, based on STATUS filter)
  let pending = followups.filter(s => !dismissed.includes(s.id))
  if (applied.statuses.length > 0) {
    pending = pending.filter(s => {
      if (applied.statuses.includes('Pending') && !sentIds[s.id]) return true
      if (applied.statuses.includes('Sent') && sentIds[s.id]) return true
      return false
    })
  }
  if (applied.bookmarkedOnly) pending = pending.filter(s => s.bookmarked)
  if (applied.notesOnly) pending = pending.filter(s => s.hasNotes)
  if (applied.priorities.length > 0) pending = pending.filter(s => applied.priorities.includes(s.priority))
  if (applied.sort === 'Name') pending = [...pending].sort((a, b) => a.name.localeCompare(b.name))
  else if (applied.sort === 'Priority') {
    const order = { High: 0, Medium: 1, Low: 2 }
    pending = [...pending].sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3))
  }

  const anySheetOpen = showFilter || showHistory

  return (
    <div className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
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
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ marginBottom: 4 }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 500, letterSpacing: -0.8, color: 'var(--text-primary)' }}>AI Followups</h1>
            </div>
            {/* Subtitle — "X sent" is tappable */}
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{pending.length} pending</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <button
                onClick={() => setShowHistory(true)}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontSize: 13, fontFamily: 'var(--font-sans)',
                  color: sentLog.length > 0 ? 'var(--green)' : 'var(--text-secondary)',
                  fontWeight: sentLog.length > 0 ? 600 : 400,
                  textDecoration: sentLog.length > 0 ? 'underline' : 'none',
                  textDecorationColor: 'rgba(50,213,131,0.4)',
                  textUnderlineOffset: 2,
                }}
              >
                {sentLog.length} sent
              </button>
            </p>
          </div>
          <div style={{ width: 40, height: 40, background: 'rgba(99,102,241,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="var(--indigo)" />
          </div>
        </div>

        {/* ── Event row + Filter icon ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowEventPicker(true)}
            style={{ flex: 1, background: 'var(--card)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeEvent ? 'var(--green)' : 'var(--border)', flexShrink: 0, boxShadow: activeEvent ? '0 0 6px var(--green)' : 'none' }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: activeEvent ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
              {activeEvent?.name || 'Select event…'}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>
          <button
            onClick={openFilter}
            style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              border: hasActiveFilters ? '1.5px solid var(--indigo)' : '1px solid var(--border)',
              background: hasActiveFilters ? 'rgba(99,102,241,0.1)' : 'var(--card)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: hasActiveFilters ? 'var(--indigo)' : 'var(--text-secondary)',
              position: 'relative',
            }}
          >
            <SlidersHorizontal size={16} />
            {hasActiveFilters && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--indigo)', border: '1.5px solid var(--card)',
              }} />
            )}
          </button>
        </div>

        {/* ── Generate button ── */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 0', borderRadius: 14,
            background: generating ? 'var(--card)' : 'linear-gradient(135deg, var(--indigo), var(--indigo-dark))',
            border: generating ? '1.5px solid var(--border)' : 'none',
            color: generating ? 'var(--text-secondary)' : '#fff',
            fontSize: 13, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)', boxShadow: generating ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {generating
            ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
            : <><RefreshCw size={14} /> Generate Follow-ups</>}
        </button>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* ── Pending Cards ── */}
        {!loading && pending.map(s => (
          <div key={s.id} style={{ background: 'var(--card)', borderRadius: 20, padding: 16, border: '1px solid var(--border)' }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={`avatar ${s.grad}`} style={{ width: 38, height: 38, fontSize: 12, color: s.textDark ? '#0B0B0E' : '#fff' }}>
                  {s.initials}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                    {s.bookmarked && <Bookmark size={12} fill="var(--amber)" color="var(--amber)" />}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: s.priorityBg, borderRadius: 100, padding: '4px 10px' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.priorityColor, display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: s.priorityColor }}>{s.priority}</span>
                </div>
                <button
                  onClick={() => handleDismiss(s.id)}
                  style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'var(--elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Message bubble */}
            <div style={{ background: 'var(--elevated)', borderRadius: 12, padding: 12, marginBottom: 10, position: 'relative' }}>
              {editingId === s.id ? (
                <>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%', minHeight: 90, fontSize: 13, lineHeight: 1.55,
                      color: 'var(--text-primary)', background: 'var(--card)',
                      border: '1.5px solid var(--indigo)', borderRadius: 8,
                      padding: '8px 10px', resize: 'none', outline: 'none',
                      fontFamily: 'var(--font-sans)', boxSizing: 'border-box', marginBottom: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={cancelEdit} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      Cancel
                    </button>
                    <button onClick={() => saveEdit(s.id)} style={{ flex: 2, padding: '7px 0', borderRadius: 8, border: 'none', background: 'var(--indigo)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p
                    onClick={() => startEdit(s.id, msgFor(s))}
                    style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55, marginBottom: 6, paddingRight: 32, cursor: 'text' }}
                  >{msgFor(s)}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.reason}</p>
                  {editedMessages[s.id] && (
                    <span style={{ fontSize: 10, color: 'var(--indigo)', fontWeight: 600, marginTop: 4, display: 'block' }}>✎ Edited</span>
                  )}
                  <button
                    onClick={() => handleCopy(s.id, msgFor(s))}
                    style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 6, border: 'none', background: copied === s.id ? 'rgba(50,213,131,0.15)' : 'var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied === s.id ? 'var(--green)' : 'var(--text-secondary)', transition: 'all 0.2s' }}
                  >
                    {copied === s.id ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
                  </button>
                </>
              )}
            </div>

            {/* Actions */}
            {sentIds[s.id] ? (
              <div style={{ background: 'var(--elevated)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: CHANNEL_META[sentIds[s.id]]?.bg || 'var(--indigo)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '3px 8px' }}>
                      {CHANNEL_META[sentIds[s.id]]?.icon} {sentIds[s.id]}
                    </span>
                    <Check size={11} color="var(--green)" strokeWidth={2.5} />
                    <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Sent</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSent(s.id)}
                    title="Remove"
                    style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, borderLeft: '2px solid var(--border)', paddingLeft: 8 }}>
                  {msgFor(s)}
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 7 }}>
                  <button onClick={() => { sendViaWhatsApp(s.phone, msgFor(s)); handleSend(s, 'WhatsApp') }}
                    style={{ background: '#25D366', border: 'none', borderRadius: 10, padding: '8px 0', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <WhatsAppIcon /> WA
                  </button>
                  <button onClick={() => { sendViaSms(s.phone, msgFor(s)); handleSend(s, 'SMS') }}
                    style={{ background: 'var(--coral)', border: 'none', borderRadius: 10, padding: '8px 0', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <SmsIcon /> SMS
                  </button>
                  <button onClick={() => { sendViaEmail(s.email, msgFor(s)); handleSend(s, 'Email') }}
                    style={{ background: 'var(--indigo)', border: 'none', borderRadius: 10, padding: '8px 0', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <EmailIcon /> Email
                  </button>
                </div>
                <button onClick={() => { placeCall(s.phone); handleSend(s, 'Call') }}
                  className="btn-ghost"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}>
                  <CallIcon /> Call instead
                </button>
              </>
            )}
          </div>
        ))}

        {!loading && pending.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <Check size={32} color="var(--green)" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>All caught up!</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              {sentLog.length > 0
                ? <button onClick={() => setShowHistory(true)} style={{ background: 'none', border: 'none', color: 'var(--green)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13 }}>View {sentLog.length} sent →</button>
                : 'Tap Generate Follow-ups to create suggestions'}
            </p>
          </div>
        )}
      </div>

      {/* ── Portals: shared backdrop + Filter sheet + History sheet ── */}
      {createPortal(
        <>
          {/* Shared backdrop */}
          <div
            onClick={() => { setShowFilter(false); setShowHistory(false) }}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 60,
              pointerEvents: anySheetOpen ? 'auto' : 'none',
              opacity: anySheetOpen ? 1 : 0,
              transition: 'opacity 0.25s',
            }}
          />

          {/* ── Filter Sheet ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'var(--card)', borderRadius: '22px 22px 0 0',
            padding: '0 20px 32px', zIndex: 61,
            transform: showFilter ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
            boxShadow: '0 -6px 40px rgba(0,0,0,0.45)',
            maxHeight: '78%', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingTop: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Filter & Sort</span>
              <button onClick={() => setShowFilter(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <X size={14} />
              </button>
            </div>

            {/* 3-stat summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 22 }}>
              {[
                { label: 'Total', value: followups.length, color: 'var(--indigo)', bg: 'rgba(99,102,241,0.1)' },
                { label: 'Sent', value: sentLog.length, color: 'var(--green)', bg: 'rgba(50,213,131,0.1)' },
                { label: 'Bookmarked', value: bookmarkedCount, color: 'var(--amber)', bg: 'rgba(255,181,71,0.1)' },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, borderRadius: 14, padding: '12px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--border)', marginBottom: 18 }} />

            {/* Sort by */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Sort by</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Priority', 'Name', 'Recent'].map(opt => (
                  <CHIP key={opt} label={opt} active={draft.sort === opt} onClick={() => setDraft(d => ({ ...d, sort: opt }))} />
                ))}
              </div>
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Priority</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: '● High', val: 'High', color: 'var(--coral)' },
                  { label: '● Medium', val: 'Medium', color: 'var(--amber)' },
                  { label: '● Low', val: 'Low', color: 'var(--text-secondary)' },
                ].map(({ label, val, color }) => (
                  <CHIP key={val} label={label} active={draft.priorities.includes(val)} color={color}
                    onClick={() => setDraft(d => ({ ...d, priorities: toggleArr(d.priorities, val) }))} />
                ))}
              </div>
            </div>

            {/* Status */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Status</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Pending', 'Sent'].map(val => (
                  <CHIP key={val} label={val} active={draft.statuses.includes(val)}
                    onClick={() => setDraft(d => ({ ...d, statuses: toggleArr(d.statuses, val) }))} />
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)', marginBottom: 18 }} />

            {/* Bookmarked toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bookmark size={14} fill={draft.bookmarkedOnly ? 'var(--amber)' : 'none'} color={draft.bookmarkedOnly ? 'var(--amber)' : 'var(--text-secondary)'} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Bookmarked only</span>
              </div>
              <button onClick={() => setDraft(d => ({ ...d, bookmarkedOnly: !d.bookmarkedOnly }))} style={{
                width: 44, height: 26, borderRadius: 100, border: 'none', cursor: 'pointer',
                background: draft.bookmarkedOnly ? 'var(--amber)' : 'var(--elevated)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <span style={{ position: 'absolute', top: 3, left: draft.bookmarkedOnly ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
              </button>
            </div>

            {/* Notes toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={draft.notesOnly ? 'var(--indigo)' : 'var(--text-secondary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Has notes</span>
              </div>
              <button onClick={() => setDraft(d => ({ ...d, notesOnly: !d.notesOnly }))} style={{
                width: 44, height: 26, borderRadius: 100, border: 'none', cursor: 'pointer',
                background: draft.notesOnly ? 'var(--indigo)' : 'var(--elevated)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <span style={{ position: 'absolute', top: 3, left: draft.notesOnly ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 24 }}>
              <button onClick={resetFilter} style={{ padding: '12px 0', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Reset
              </button>
              <button onClick={applyFilter} style={{ padding: '12px 0', borderRadius: 12, border: 'none', background: 'var(--indigo)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Apply Filters
              </button>
            </div>
          </div>

          {/* ── Sent History Sheet ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'var(--card)', borderRadius: '22px 22px 0 0',
            padding: '0 20px 32px', zIndex: 62,
            transform: showHistory ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
            boxShadow: '0 -6px 40px rgba(0,0,0,0.45)',
            maxHeight: '80%', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingTop: 4, position: 'sticky', top: 20, background: 'var(--card)', zIndex: 1 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Sent History</span>
                {sentLog.length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{sentLog.length} logged</span>
                )}
              </div>
              <button onClick={() => setShowHistory(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <X size={14} />
              </button>
            </div>

            {sentLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                <Clock size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontWeight: 500 }}>No sent follow-ups yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Send one from the pending list</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sentLog.map(entry => {
                  const ch = CHANNEL_META[entry.channel] || CHANNEL_META.Email
                  return (
                    <div key={entry.logId} style={{ background: 'var(--elevated)', borderRadius: 14, padding: '12px 13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div className={`avatar ${entry.grad}`} style={{ width: 34, height: 34, fontSize: 11, flexShrink: 0, color: entry.textDark ? '#0B0B0E' : '#fff' }}>
                          {entry.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{entry.name}</span>
                            {entry.bookmarked && <Bookmark size={11} fill="var(--amber)" color="var(--amber)" />}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{entry.role}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: ch.bg, color: '#fff',
                            fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '3px 8px',
                          }}>
                            {ch.icon} {entry.channel}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(entry.sentAt)}</span>
                          <button
                            onClick={() => handleDeleteSent(entry.id)}
                            title="Delete — moves back to pending"
                            style={{ marginTop: 2, width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(232,90,79,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral)' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <p style={{
                        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        background: 'var(--card)', borderRadius: 8, padding: '7px 10px', margin: 0,
                      }}>
                        {entry.message}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>,
        document.querySelector('.phone-shell')
      )}

      {/* ── Event Picker Portal ── */}
      {createPortal(
        <>
          <div
            onClick={() => setShowEventPicker(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)', zIndex: 70,
              opacity: showEventPicker ? 1 : 0,
              pointerEvents: showEventPicker ? 'auto' : 'none',
              transition: 'opacity 0.25s',
            }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'var(--card)', borderRadius: '22px 22px 0 0',
            padding: '0 20px 32px', zIndex: 71,
            transform: showEventPicker ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
            boxShadow: '0 -6px 40px rgba(0,0,0,0.45)',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingTop: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>Select Event</span>
              <button onClick={() => setShowEventPicker(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <X size={14} />
              </button>
            </div>

            {/* "All events" option */}
            <button
              onClick={() => selectEvent(null)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: !activeEvent ? 'rgba(99,102,241,0.1)' : 'var(--elevated)',
                marginBottom: 8, textAlign: 'left',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: !activeEvent ? 'rgba(99,102,241,0.15)' : 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CalendarDays size={16} color={!activeEvent ? 'var(--indigo)' : 'var(--text-muted)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: !activeEvent ? 'var(--indigo)' : 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>All Events</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Show follow-ups from every event</div>
              </div>
              {!activeEvent && <Check size={15} color="var(--indigo)" />}
            </button>

            {/* Event list */}
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-sans)' }}>No events yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.map(ev => {
                  const isSelected = activeEvent?.id === ev.id
                  const isPast = ev.status === 'past'
                  return (
                    <button
                      key={ev.id}
                      onClick={() => selectEvent(ev)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: isSelected ? 'rgba(99,102,241,0.1)' : 'var(--elevated)',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isPast ? 'var(--text-muted)' : 'var(--green)', boxShadow: isPast ? 'none' : '0 0 6px var(--green)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--indigo)' : 'var(--text-primary)', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                          {ev.location || ev.start_date || ''}{isPast ? ' · Past' : ' · Upcoming'}
                        </div>
                      </div>
                      {isSelected && <Check size={15} color="var(--indigo)" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>,
        document.querySelector('.phone-shell') ?? document.body
      )}
    </div>
  )
}
