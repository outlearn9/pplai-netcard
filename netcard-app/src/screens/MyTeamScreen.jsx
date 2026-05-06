import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, ChevronDown, Shield, Eye, Pencil, Check, Users, X, Loader } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''
const PROFILE_KEY = 'netcard_my_profile'
function loadProfile() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') } catch { return {} } }

const ACCESS_OPTIONS = [
  { id: 'admin',  label: 'Admin',     sub: 'Full access + export', icon: Shield, color: '#6366F1' },
  { id: 'editor', label: 'Can Edit',  sub: 'Add & edit contacts',  icon: Pencil, color: '#059669' },
  { id: 'viewer', label: 'View Only', sub: 'Read contacts only',   icon: Eye,    color: '#D97706' },
]

function AccessPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const cur = ACCESS_OPTIONS.find(o => o.id === value) || ACCESS_OPTIONS[2]
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, background: cur.color + '18', border: '1.5px solid transparent', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', color: cur.color, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {cur.label} <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 44, zIndex: 60, background: 'var(--card)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid var(--border)', overflow: 'hidden', minWidth: 190 }}>
          {ACCESS_OPTIONS.map(opt => {
            const Ic = opt.icon
            return (
              <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: value === opt.id ? opt.color + '10' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <Ic size={14} color={opt.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{opt.sub}</div>
                </div>
                <Check size={13} color={opt.color} style={{ opacity: value === opt.id ? 1 : 0, flexShrink: 0 }} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatDate(str) {
  if (!str) return ''
  try { return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return '' }
}

const GRADS = ['grad-indigo', 'grad-purple', 'grad-green', 'grad-amber', 'grad-coral']
function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function gradFor(id) {
  let h = 0
  for (let i = 0; i < (id || '').length; i++) h = ((h << 5) - h) + id.charCodeAt(i)
  return GRADS[Math.abs(h) % GRADS.length]
}

export default function MyTeamScreen({ navigate, goBack }) {
  const [members,   setMembers]  = useState([])
  const [loading,   setLoading]  = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [input,     setInput]    = useState('')
  const [nameInput, setNameInput] = useState('')
  const [role,      setRole]     = useState('viewer')
  const [inputErr,  setInputErr] = useState('')
  const [saving,    setSaving]   = useState(false)
  const [saved,     setSaved]    = useState(false)
  const [apiErr,    setApiErr]   = useState('')

  const profile = loadProfile()
  const myName  = profile.name  || 'You'
  const myEmail = profile.email || ''

  useEffect(() => {
    fetch(`${API}/api/team`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setMembers(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleInvite = async () => {
    if (!nameInput.trim()) { setInputErr('Enter a name'); return }
    if (!input.trim() || !/\S+@\S+\.\S+/.test(input)) { setInputErr('Enter a valid email'); return }
    setSaving(true); setInputErr(''); setApiErr('')
    try {
      const r = await fetch(`${API}/api/team`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim(), email: input.trim(), access: role }),
      })
      const d = await r.json()
      if (!d.success) { setInputErr(d.error || 'Failed to invite'); return }
      setMembers(prev => [...prev, d.data])
      setInput(''); setNameInput(''); setSaved(true)
      setTimeout(() => { setSaved(false); setShowInvite(false) }, 1800)
    } catch {
      setApiErr('Network error — try again')
    } finally {
      setSaving(false)
    }
  }

  const handleChangeAccess = async (id, access) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, access } : m))
    await fetch(`${API}/api/team/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access }),
    }).catch(() => {})
  }

  const handleRemove = async (id) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    await fetch(`${API}/api/team/${id}`, {
      method: 'DELETE', credentials: 'include',
    }).catch(() => {})
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
        <button className="icon-btn" onClick={goBack ?? (() => navigate('home'))}><ArrowLeft size={20} /></button>
        <span className="header-title">My Team</span>
        <button className="icon-btn" onClick={() => setShowInvite(true)}><Plus size={20} /></button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 16px 32px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader size={22} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Owner row */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-sans)' }}>
              Workspace Members
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: members.length > 0 ? '1px solid var(--border)' : 'none' }}>
                <div className="avatar grad-indigo" style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0 }}>
                  {initials(myName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{myName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{myEmail}</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--indigo)', fontFamily: 'var(--font-sans)', fontWeight: 600, background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: 8 }}>Owner</span>
              </div>
              {members.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className={`avatar ${gradFor(m.id)}`} style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0 }}>
                    {initials(m.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{m.email} · Added {formatDate(m.invited_at)}</div>
                  </div>
                  <AccessPicker value={m.access} onChange={v => handleChangeAccess(m.id, v)} />
                  <button onClick={() => handleRemove(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', padding: 4, flexShrink: 0 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {members.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <Users size={32} color="var(--border)" style={{ margin: '0 auto 10px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>No team members yet</div>
                <div style={{ fontSize: 12, marginTop: 5, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>Invite colleagues to collaborate on your contacts and events.</div>
                <button onClick={() => setShowInvite(true)} className="btn-primary" style={{ marginTop: 16 }}>
                  <Plus size={14} /> Invite Member
                </button>
              </div>
            )}

            {apiErr && <div style={{ fontSize: 12, color: 'var(--coral)', fontFamily: 'var(--font-sans)', textAlign: 'center', marginTop: 8 }}>{apiErr}</div>}
          </>
        )}
      </div>

      {/* Invite sheet */}
      {showInvite && (
        <>
          <div onClick={() => setShowInvite(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '16px 20px 40px', zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 20 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              <button onClick={() => setShowInvite(false)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'var(--elevated)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Invite a teammate</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>Name</div>
              <input
                value={nameInput} onChange={e => { setNameInput(e.target.value); setInputErr('') }}
                placeholder="Full name"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--indigo)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>Email</div>
              <input
                value={input} onChange={e => { setInput(e.target.value); setInputErr('') }}
                placeholder="colleague@company.com"
                type="email"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${inputErr ? 'var(--coral)' : 'var(--border)'}`, background: 'var(--card)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--indigo)'}
                onBlur={e => e.target.style.borderColor = inputErr ? 'var(--coral)' : 'var(--border)'}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
              />
              {inputErr && <div style={{ fontSize: 11, color: 'var(--coral)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>{inputErr}</div>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>Access Level</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {ACCESS_OPTIONS.map(opt => {
                  const Ic = opt.icon
                  const active = role === opt.id
                  return (
                    <button key={opt.id} onClick={() => setRole(opt.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 6px', borderRadius: 12, border: `1.5px solid ${active ? opt.color : 'var(--border)'}`, background: active ? opt.color + '12' : 'var(--card)', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <Ic size={15} color={active ? opt.color : 'var(--text-muted)'} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: active ? opt.color : 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <button onClick={handleInvite} disabled={saving} className="btn-primary" style={{ width: '100%' }}>
              {saving ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
               : saved  ? <><Check size={15} /> Invited!</>
               : 'Send Invite'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
