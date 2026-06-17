import { apiFetch } from '../lib/apiFetch'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Mail, Phone, Send, Search, Gift, Copy, Globe, X, Check, Menu, AlertCircle, Plus, Trash2 } from 'lucide-react'

const FIELD_LABELS = {
  title:    'Job title',
  company:  'Company',
  phone:    'Phone number',
  linkedin: 'LinkedIn',
  seeking:  'What you\'re seeking',
  offering: 'What you\'re offering',
}

const WAIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const INITIAL = {
  name: 'Paras Gupta', title: 'Founder & CEO', company: 'PPL AI',
  email: 'paras@pplai.co', phone: '+1 (415) 555-0192',
  whatsapp: '+1 (415) 555-0192', linkedin: 'linkedin.com/in/parasgupta',
  web: 'pplai.co',
  seeking: 'Distribution partners & early customers for AI tools',
  offering: 'AI workflow automation & custom LLM integrations',
}

const BLANK_CARD = (base) => ({
  label: 'Secondary', name: base.name, title: '', company: '',
  email: base.email, phone: '', whatsapp: '', linkedin: '', web: '',
  seeking: '', offering: '',
})

const Field = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
    <input value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--elevated)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none' }}
      onFocus={e => { e.target.style.borderColor = 'var(--indigo)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
    />
  </div>
)

const TextArea = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--elevated)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'none', lineHeight: 1.5 }}
      onFocus={e => { e.target.style.borderColor = 'var(--indigo)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
    />
  </div>
)

const PROFILE_KEY    = 'netcard_my_profile'
const EXTRA_KEY      = 'netcard_extra_cards'

function loadProfile() {
  try { return { ...INITIAL, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') } } catch { return INITIAL }
}
function loadExtraCards() {
  try { return JSON.parse(localStorage.getItem(EXTRA_KEY) || '[]') } catch { return [] }
}
function saveExtraCards(cards) {
  try { localStorage.setItem(EXTRA_KEY, JSON.stringify(cards)) } catch {}
}

export default function MyCardScreen({ navigate, onMenuOpen, incompleteFields = [], onFieldsFilled }) {
  const [profile, setProfile]       = useState(loadProfile)
  const [draft, setDraft]           = useState(loadProfile)
  const [extraCards, setExtraCards] = useState(loadExtraCards)
  const [activeIdx, setActiveIdx]   = useState(0) // 0 = primary
  const [showEdit, setShowEdit]     = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCardDraft, setNewCardDraft] = useState(null)
  const [copied, setCopied]         = useState(null)
  const [waSameAsPhone, setWaSameAsPhone] = useState(() => { const p = loadProfile(); return p.whatsapp === p.phone })
  const [username, setUsername]     = useState('')
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlDraft, setUrlDraft]     = useState('')
  const [urlStatus, setUrlStatus]   = useState(null)
  const [avatarUrl, setAvatarUrl]   = useState(() => { try { return localStorage.getItem('netcard_avatar') || '' } catch { return '' } })
  const [saveError, setSaveError]   = useState('')
  const [saving, setSaving]         = useState(false)
  const urlCheckTimer               = useRef(null)
  const avatarInputRef              = useRef(null)
  const portalRef                   = useRef(null)

  useEffect(() => { portalRef.current = document.querySelector('.phone-shell') || document.body }, [])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (showEdit) { cancelEdit(); return }
      if (editingUrl) { setEditingUrl(false); return }
      if (showAddCard) { setShowAddCard(false); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showEdit, editingUrl, showAddCard])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result
      if (typeof dataUrl !== 'string') return
      setAvatarUrl(dataUrl)
      try { localStorage.setItem('netcard_avatar', dataUrl) } catch {}
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    apiFetch('/api/profile').then(r => r.ok ? r.json() : null).then(d => {
      if (!d?.data) return
      const p = d.data
      const cached = loadProfile()
      const merged = {
        name: p.name || cached.name, title: p.role || cached.title,
        company: p.company || cached.company, email: p.email || cached.email,
        phone: p.phone || cached.phone, whatsapp: p.whatsapp || cached.whatsapp,
        linkedin: p.linkedin_url || cached.linkedin, web: p.web_url || cached.web,
        seeking: p.seeking || cached.seeking, offering: p.offering || cached.offering,
      }
      setProfile(merged); setDraft(merged)
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(merged)) } catch {}
      if (p.username) setUsername(p.username)
    }).catch(() => {})
  }, [])

  // The card currently being viewed
  const activeCard = activeIdx === 0 ? profile : extraCards[activeIdx - 1]
  const allCards   = [{ ...profile, label: 'Primary' }, ...extraCards]
  const cardUrl    = username ? `https://pplai.app/u/${username}` : ''

  // URL editing
  const startEditUrl = () => { setUrlDraft(username); setUrlStatus(null); setEditingUrl(true) }
  const handleUrlDraftChange = (val) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setUrlDraft(slug)
    clearTimeout(urlCheckTimer.current)
    if (!slug || slug.length < 3) { setUrlStatus(slug.length ? 'invalid' : null); return }
    setUrlStatus('checking')
    urlCheckTimer.current = setTimeout(() => {
      apiFetch(`/api/profile/username?check=${encodeURIComponent(slug)}`).then(r => r.json())
        .then(d => {
          if (d?.data?.yours) setUrlStatus('available')
          else setUrlStatus(d?.data?.available ? 'available' : (d?.data?.reason ? 'invalid' : 'taken'))
        }).catch(() => setUrlStatus(null))
    }, 400)
  }
  const saveUrl = async () => {
    if (!urlDraft || urlStatus !== 'available') return
    const r = await apiFetch('/api/profile/username', { method: 'PATCH', body: JSON.stringify({ username: urlDraft }) })
    if (r.ok) { setUsername(urlDraft); setEditingUrl(false) }
    else { const d = await r.json(); setUrlStatus(d?.error === 'Username already taken' ? 'taken' : 'invalid') }
  }

  // Primary card edit
  const set = (key) => (val) => setDraft(d => ({ ...d, [key]: val }))
  const openEdit = () => { setDraft({ ...profile }); setShowEdit(true) }
  const cancelEdit = () => setShowEdit(false)
  const saveEdit = async () => {
    setSaving(true); setSaveError('')
    setProfile({ ...draft })
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(draft)) } catch {}
    try {
      const r = await apiFetch('/api/profile', { method: 'PATCH', body: JSON.stringify({ name: draft.name, role: draft.title, company: draft.company, email: draft.email, phone: draft.phone, whatsapp: draft.whatsapp, linkedin_url: draft.linkedin, website: draft.web, seeking: draft.seeking, offering: draft.offering }) })
      const d = await r.json()
      if (!r.ok || !d.success) { setSaveError(d.error || 'Save failed — changes kept locally only'); setSaving(false); return }
    } catch { setSaveError('Network error — changes kept locally only'); setSaving(false); return }
    setSaving(false); setShowEdit(false)
    if (onFieldsFilled && incompleteFields.length > 0) {
      const map = { title: 'title', company: 'company', phone: 'phone', linkedin: 'linkedin', seeking: 'seeking', offering: 'offering' }
      if (incompleteFields.every(f => draft[map[f]]?.trim())) onFieldsFilled()
    }
  }

  // Extra card operations
  const openAddCard = () => { setNewCardDraft(BLANK_CARD(profile)); setShowAddCard(true) }
  const setNC = (key) => (val) => setNewCardDraft(d => ({ ...d, [key]: val }))
  const saveNewCard = () => {
    if (!newCardDraft) return
    const updated = [...extraCards, newCardDraft]
    setExtraCards(updated); saveExtraCards(updated)
    setActiveIdx(updated.length) // switch to new card
    setShowAddCard(false)
  }
  const deleteExtraCard = (idx) => { // idx into extraCards array
    const updated = extraCards.filter((_, i) => i !== idx)
    setExtraCards(updated); saveExtraCards(updated)
    setActiveIdx(0)
  }

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(key); setTimeout(() => setCopied(null), 2000)
  }

  const initials = (activeCard?.name || profile.name).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const contactRows = [
    { key: 'email',    icon: <Mail size={16} color="var(--indigo)" />,   text: activeCard?.email },
    { key: 'phone',    icon: <Phone size={16} color="var(--green)" />,   text: activeCard?.phone },
    { key: 'whatsapp', icon: <WAIcon />,                                  text: activeCard?.whatsapp },
    { key: 'linkedin', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, text: activeCard?.linkedin },
    { key: 'web',      icon: <Globe size={16} color="var(--indigo)" />,   text: activeCard?.web },
  ].filter(row => !!row.text?.trim())

  return (
    <div className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="status-bar">
        <span className="status-time">9:41</span>
        <div className="status-icons">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/><rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/><rect x="9" y="0" width="3" height="12" rx="1" opacity="0.8"/><rect x="13.5" y="0" width="3" height="12" rx="1"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none"/><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/></svg>
        </div>
      </div>

      <div className="content" style={{ paddingTop: 12 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onMenuOpen} className="icon-btn"><Menu size={18} /></button>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 500, letterSpacing: -0.8, color: 'var(--text-primary)' }}>My Card</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeIdx === 0 && (
              <button onClick={openEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card)', border: 'none', borderRadius: 10, padding: '8px 14px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500 }}>
                <Pencil size={13} /> Edit
              </button>
            )}
            <button onClick={openAddCard} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--indigo)', border: 'none', borderRadius: 10, padding: '8px 12px', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>
              <Plus size={13} /> Card
            </button>
          </div>
        </div>

        {/* Card tabs — shown when multiple cards exist */}
        {allCards.length > 1 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {allCards.map((card, i) => (
              <button key={i} onClick={() => setActiveIdx(i)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${activeIdx === i ? 'var(--indigo)' : 'var(--border)'}`, background: activeIdx === i ? 'rgba(99,102,241,0.1)' : 'transparent', color: activeIdx === i ? 'var(--indigo)' : 'var(--text-muted)', fontSize: 12, fontWeight: activeIdx === i ? 600 : 400, fontFamily: 'var(--font-sans)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {card.label || (i === 0 ? 'Primary' : `Card ${i + 1}`)}
                {i > 0 && activeIdx === i && (
                  <span onClick={e => { e.stopPropagation(); deleteExtraCard(i - 1) }} style={{ display: 'flex', alignItems: 'center', marginLeft: 2, opacity: 0.6 }}>
                    <X size={11} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Incomplete fields banner */}
        {incompleteFields.length > 0 && activeIdx === 0 && (
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.08))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', fontFamily: 'var(--font-sans)', marginBottom: 3 }}>Complete your card</div>
              <div style={{ fontSize: 12, color: '#B45309', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>Missing: {incompleteFields.map(f => FIELD_LABELS[f] || f).join(', ')}</div>
              <button onClick={openEdit} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#D97706', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Complete now →</button>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <div style={{ borderRadius: 28, overflow: 'hidden', position: 'relative', height: 210, background: 'linear-gradient(145deg, #2D2F6B 0%, #3D3080 45%, #252560 100%)', boxShadow: '0 20px 60px rgba(45,47,107,0.45), 0 0 0 1px rgba(255,255,255,0.10)' }}>
          <div style={{ position: 'absolute', top: -40, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.5) 0%, transparent 70%)', filter: 'blur(32px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, right: 40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)', filter: 'blur(28px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 20, right: -20, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)', filter: 'blur(24px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

          {/* Top strip — logo + URL */}
          <button onClick={startEditUrl} style={{ position: 'absolute', top: 10, left: 14, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '4px 8px 4px 5px', cursor: 'pointer' }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg,#6366F1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="4" cy="4" r="2.2" fill="white" opacity="0.9"/><circle cx="8.5" cy="4" r="2.2" fill="white" opacity="0.55"/><circle cx="6.5" cy="8.5" r="2.2" fill="white" opacity="0.72"/></svg>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.3, fontFamily: 'var(--font-sans)' }}>
              {cardUrl ? cardUrl.replace('https://', '') : 'Set card URL'}
            </span>
            <Pencil size={9} color="rgba(255,255,255,0.4)" />
          </button>

          {/* Card label badge for secondary cards */}
          {activeIdx > 0 && (
            <div style={{ position: 'absolute', top: 10, right: 14, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '3px 8px' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>{activeCard?.label || 'Secondary'}</span>
            </div>
          )}

          {/* Avatar */}
          <div style={{ position: 'absolute', left: 20, top: 44 }}>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:'none' }} />
            <div style={{ width:56, height:56, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.2)', background:'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(168,85,247,0.6))', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', backdropFilter:'blur(8px)' }}>
              {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontFamily:'var(--font-sans)', fontSize:18, fontWeight:700, color:'#fff', letterSpacing:-0.5 }}>{initials}</span>}
            </div>
          </div>

          {/* Name & title */}
          <div style={{ position: 'absolute', left: 20, bottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: -0.6, lineHeight: 1.15, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>{activeCard?.name}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontFamily: 'var(--font-sans)' }}>{activeCard?.title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1, fontFamily: 'var(--font-sans)', letterSpacing: 0.2 }}>{activeCard?.company}</div>
          </div>

          {/* QR */}
          <div style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
            <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 14, padding: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
                <rect x="2" y="2" width="28" height="28" rx="4" fill="#2D2F6B"/><rect x="7" y="7" width="18" height="18" rx="2" fill="white"/><rect x="11" y="11" width="10" height="10" rx="1" fill="#2D2F6B"/>
                <rect x="60" y="2" width="28" height="28" rx="4" fill="#2D2F6B"/><rect x="65" y="7" width="18" height="18" rx="2" fill="white"/><rect x="69" y="11" width="10" height="10" rx="1" fill="#2D2F6B"/>
                <rect x="2" y="60" width="28" height="28" rx="4" fill="#2D2F6B"/><rect x="7" y="65" width="18" height="18" rx="2" fill="white"/><rect x="11" y="69" width="10" height="10" rx="1" fill="#2D2F6B"/>
                {[36,42,48,54,60,66,72,78].flatMap((x,xi) => [36,42,48,54,60,66,72,78].map((y,yi) => (xi+yi)%2===0 && !(x<34&&y<34) && !(x>58&&y<34) && !(x<34&&y>58) ? <rect key={`${x}${y}`} x={x} y={y} width="5" height="5" rx="1" fill="#2D2F6B"/> : null))}
              </svg>
            </div>
            <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 0.5, fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>Scan to connect</span>
          </div>

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(165,180,252,0.6), rgba(192,132,252,0.6), transparent)' }} />
        </div>

        {/* Seeking + Offering */}
        {(activeCard?.seeking || activeCard?.offering) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {activeCard?.seeking && (
              <div style={{ background: 'var(--card)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}><Search size={11} color="var(--indigo)" /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--indigo)', letterSpacing: 0.5 }}>SEEKING</span></div>
                <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.45 }}>{activeCard.seeking}</p>
              </div>
            )}
            {activeCard?.offering && (
              <div style={{ background: 'var(--card)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}><Gift size={11} color="var(--green)" /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: 0.5 }}>OFFERING</span></div>
                <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.45 }}>{activeCard.offering}</p>
              </div>
            )}
          </div>
        )}

        {/* Contact Details */}
        {contactRows.length > 0 && (
          <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden' }}>
            {contactRows.map((row, i) => (
              <div key={row.key}>
                {i > 0 && <div style={{ height: 1, background: 'var(--border)' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  {row.icon}
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{row.text}</span>
                  <button onClick={() => handleCopy(row.key, row.text)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: copied === row.key ? 'var(--green)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
                    {copied === row.key ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Share button */}
        <button className="btn-primary" onClick={() => navigate('shareCard')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Send size={16} /> Share My Card
        </button>
      </div>

      {/* URL edit sheet */}
      {portalRef.current && createPortal(
        <>
          <div onClick={() => setEditingUrl(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', zIndex:60, pointerEvents: editingUrl ? 'auto' : 'none', opacity: editingUrl ? 1 : 0, transition:'opacity 0.2s' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'var(--card)', borderRadius:'22px 22px 0 0', padding:'20px 20px 36px', zIndex:61, transform: editingUrl ? 'translateY(0)' : 'translateY(100%)', transition:'transform 0.28s cubic-bezier(0.32,0.72,0,1)', boxShadow:'0 -6px 40px rgba(0,0,0,0.45)' }}>
            {editingUrl && <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <span style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-sans)' }}>Your card URL</span>
                <button onClick={() => setEditingUrl(false)} style={{ width:28, height:28, borderRadius:'50%', border:'none', background:'var(--elevated)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}><X size={14}/></button>
              </div>
              <div style={{ display:'flex', alignItems:'center', background:'var(--elevated)', border:`1.5px solid ${urlStatus==='available' ? 'var(--green)' : urlStatus==='taken'||urlStatus==='invalid' ? 'var(--coral)' : 'var(--border)'}`, borderRadius:12, overflow:'hidden', height:46 }}>
                <span style={{ padding:'0 4px 0 14px', fontSize:13, color:'var(--text-muted)', whiteSpace:'nowrap', fontFamily:'var(--font-sans)' }}>pplai.app/u/</span>
                <input autoFocus value={urlDraft} onChange={e => handleUrlDraftChange(e.target.value)} placeholder="your-username" style={{ flex:1, padding:'0 8px', height:'100%', border:'none', background:'transparent', fontSize:14, fontFamily:'var(--font-sans)', color:'var(--text-primary)', outline:'none', minWidth:0 }} />
              </div>
              <div style={{ fontSize:11, color: urlStatus==='available' ? 'var(--green)' : urlStatus==='taken'||urlStatus==='invalid' ? 'var(--coral)' : 'var(--text-muted)', marginTop:6, fontFamily:'var(--font-sans)', minHeight:16 }}>
                {urlStatus==='available' && '✓ Available'}{urlStatus==='taken' && '✗ Already taken'}{urlStatus==='invalid' && '✗ Min 3 chars: a–z, 0–9, - or _'}{urlStatus==='checking' && 'Checking…'}{!urlStatus && 'Letters, numbers, - and _ only'}
              </div>
              <button onClick={saveUrl} disabled={urlStatus !== 'available'} className="btn-primary" style={{ marginTop:14, display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity: urlStatus==='available' ? 1 : 0.4 }}>
                <Check size={15}/> Save URL
              </button>
            </>}
          </div>
        </>,
        portalRef.current
      )}

      {/* Add Card sheet */}
      {portalRef.current && createPortal(
        <>
          <div onClick={() => setShowAddCard(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', zIndex:60, pointerEvents: showAddCard ? 'auto' : 'none', opacity: showAddCard ? 1 : 0, transition:'opacity 0.2s' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'var(--card)', borderRadius:'22px 22px 0 0', padding:'0 20px 32px', zIndex:61, transform: showAddCard ? 'translateY(0)' : 'translateY(100%)', transition:'transform 0.32s cubic-bezier(0.32,0.72,0,1)', boxShadow:'0 -6px 40px rgba(0,0,0,0.45)', maxHeight:'85%', overflowY: showAddCard ? 'auto' : 'hidden' }}>
            {showAddCard && newCardDraft && <>
              <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px', position:'sticky', top:0, background:'var(--card)', zIndex:62 }}>
                <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, paddingTop:4, position:'sticky', top:20, background:'var(--card)', zIndex:62 }}>
                <span style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>New Card</span>
                <button onClick={() => setShowAddCard(false)} style={{ width:28, height:28, borderRadius:'50%', border:'none', background:'var(--elevated)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}><X size={14}/></button>
              </div>

              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:12 }}>Card name</div>
              <Field label="Label (e.g. Investor, Personal)" value={newCardDraft.label} onChange={setNC('label')} />

              <div style={{ height:1, background:'var(--border)', margin:'4px 0 18px' }} />
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:12 }}>Identity</div>
              <Field label="Name" value={newCardDraft.name} onChange={setNC('name')} />
              <Field label="Title" value={newCardDraft.title} onChange={setNC('title')} />
              <Field label="Company" value={newCardDraft.company} onChange={setNC('company')} />

              <div style={{ height:1, background:'var(--border)', margin:'4px 0 18px' }} />
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:12 }}>Contact</div>
              <Field label="Email" value={newCardDraft.email} onChange={setNC('email')} />
              <Field label="Phone" value={newCardDraft.phone} onChange={setNC('phone')} />
              <Field label="LinkedIn" value={newCardDraft.linkedin} onChange={setNC('linkedin')} />
              <Field label="Website" value={newCardDraft.web} onChange={setNC('web')} />

              <div style={{ height:1, background:'var(--border)', margin:'4px 0 18px' }} />
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:12 }}>Networking intent</div>
              <TextArea label="Seeking" value={newCardDraft.seeking} onChange={setNC('seeking')} />
              <TextArea label="Offering" value={newCardDraft.offering} onChange={setNC('offering')} />

              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginTop:8 }}>
                <button onClick={() => setShowAddCard(false)} style={{ padding:'12px 0', borderRadius:12, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)' }}>Cancel</button>
                <button onClick={saveNewCard} style={{ padding:'12px 0', borderRadius:12, border:'none', background:'var(--indigo)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)' }}>Save Card</button>
              </div>
            </>}
          </div>
        </>,
        portalRef.current
      )}

      {/* Edit sheet portal */}
      {portalRef.current && createPortal(
        <>
          <div onClick={cancelEdit} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', zIndex:60, pointerEvents: showEdit ? 'auto' : 'none', opacity: showEdit ? 1 : 0, transition:'opacity 0.25s' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'var(--card)', borderRadius:'22px 22px 0 0', padding:'0 20px 32px', zIndex:61, transform: showEdit ? 'translateY(0)' : 'translateY(100%)', transition:'transform 0.32s cubic-bezier(0.32,0.72,0,1)', boxShadow:'0 -6px 40px rgba(0,0,0,0.45)', maxHeight:'85%', overflowY: showEdit ? 'auto' : 'hidden' }}>
          {showEdit && <>
            <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px', position:'sticky', top:0, background:'var(--card)', zIndex:62 }}>
              <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)' }} />
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, paddingTop:4, position:'sticky', top:20, background:'var(--card)', zIndex:62 }}>
              <span style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>Edit Card</span>
              <button onClick={cancelEdit} style={{ width:28, height:28, borderRadius:'50%', border:'none', background:'var(--elevated)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}><X size={14}/></button>
            </div>

            {/* Photo */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
              <button onClick={() => avatarInputRef.current?.click()} style={{ width:60, height:60, borderRadius:'50%', padding:0, border:'2px solid var(--border)', background:'var(--elevated)', cursor:'pointer', position:'relative', overflow:'hidden', flexShrink:0 }}>
                {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontFamily:'var(--font-sans)', fontSize:20, fontWeight:700, color:'var(--text-secondary)' }}>{initials}</span>}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:20, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
              </button>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-sans)' }}>Profile photo</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginTop:2 }}>Tap to upload from camera roll</div>
                {avatarUrl && <button onClick={() => { setAvatarUrl(''); try { localStorage.removeItem('netcard_avatar') } catch {} }} style={{ marginTop:4, fontSize:11, color:'var(--coral)', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'var(--font-sans)' }}>Remove photo</button>}
              </div>
            </div>

            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:12 }}>Identity</div>
            <Field label="Name" value={draft.name} onChange={set('name')} />
            <Field label="Title" value={draft.title} onChange={set('title')} />
            <Field label="Company" value={draft.company} onChange={set('company')} />
            <div style={{ height:1, background:'var(--border)', margin:'4px 0 18px' }} />

            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:12 }}>Contact</div>
            <Field label="Email" value={draft.email} onChange={set('email')} />
            <Field label="Phone" value={draft.phone} onChange={val => { set('phone')(val); if (waSameAsPhone) setDraft(d => ({ ...d, phone: val, whatsapp: val })) }} />
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase' }}>WhatsApp</div>
                <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer' }}>
                  <input type="checkbox" checked={waSameAsPhone} onChange={e => { setWaSameAsPhone(e.target.checked); if (e.target.checked) setDraft(d => ({ ...d, whatsapp: d.phone })) }} style={{ width:14, height:14, accentColor:'var(--indigo)', cursor:'pointer' }} />
                  <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}>Same as phone</span>
                </label>
              </div>
              <input value={draft.whatsapp} onChange={e => { setWaSameAsPhone(false); set('whatsapp')(e.target.value) }} disabled={waSameAsPhone} style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid var(--border)', background: waSameAsPhone ? 'var(--border)' : 'var(--elevated)', color: waSameAsPhone ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize:13, fontFamily:'var(--font-sans)', outline:'none', opacity: waSameAsPhone ? 0.7 : 1 }} onFocus={e => { if (!waSameAsPhone) e.target.style.borderColor = 'var(--indigo)' }} onBlur={e => { e.target.style.borderColor = 'var(--border)' }} />
            </div>
            <Field label="LinkedIn" value={draft.linkedin} onChange={set('linkedin')} />
            <Field label="Website" value={draft.web} onChange={set('web')} />
            <div style={{ height:1, background:'var(--border)', margin:'4px 0 18px' }} />

            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:12 }}>Networking intent</div>
            <TextArea label="Seeking" value={draft.seeking} onChange={set('seeking')} />
            <TextArea label="Offering" value={draft.offering} onChange={set('offering')} />

            {saveError && <div style={{ fontSize:12, color:'var(--coral)', background:'rgba(232,90,79,0.08)', borderRadius:8, padding:'8px 12px', marginTop:8, fontFamily:'var(--font-sans)' }}>{saveError}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginTop:8 }}>
              <button onClick={cancelEdit} disabled={saving} style={{ padding:'12px 0', borderRadius:12, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)' }}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} style={{ padding:'12px 0', borderRadius:12, border:'none', background: saving ? 'var(--border)' : 'var(--indigo)', color: saving ? 'var(--text-muted)' : '#fff', fontSize:13, fontWeight:600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'var(--font-sans)' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </>}
          </div>
        </>,
        portalRef.current
      )}
    </div>
  )
}
