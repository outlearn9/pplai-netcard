import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Check, Copy, ExternalLink, Pencil, Trash2, Loader } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''
const PROFILE_KEY = 'netcard_my_profile'
function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') } catch { return {} }
}

function Field({ label, value, onChange, type = 'text', readOnly, hint }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          readOnly={readOnly}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: isPassword ? '11px 42px 11px 14px' : '11px 14px',
            borderRadius: 12, border: '1.5px solid var(--border)',
            background: readOnly ? 'var(--elevated)' : 'var(--card)',
            color: readOnly ? 'var(--text-secondary)' : 'var(--text-primary)',
            fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
          }}
          onFocus={e => { if (!readOnly) e.target.style.borderColor = 'var(--indigo)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
        {isPassword && (
          <button
            onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>{hint}</div>}
    </div>
  )
}

export default function AccountDetailsScreen({ navigate, goBack }) {
  const p = loadProfile()
  const [email,    setEmail]    = useState(p.email    || 'paras@pplai.app')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [username, setUsername] = useState('paras')
  const [saved,    setSaved]    = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [pwErr,    setPwErr]    = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleted,  setDeleted]  = useState(false)
  const [delErr,   setDelErr]   = useState('')

  const profileUrl = `pplai.app/u/${username}`

  const handleSave = () => {
    if (password && password !== confirm) { setPwErr('Passwords do not match'); return }
    setPwErr('')
    // persist username to profile
    try {
      const existing = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...existing, email, username }))
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://${profileUrl}`).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteSampleData = async () => {
    setDeleting(true); setDelErr('')
    try {
      const r = await fetch(`${API}/api/onboarding/seed`, {
        method: 'DELETE', credentials: 'include',
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.error || 'Failed')
      localStorage.removeItem('netcard_seed_attempted')
      // Clear sample CRM leads (all are sample — only wipe if they match sample ids)
      try {
        const leads = JSON.parse(localStorage.getItem('netcard_crm_leads') || '[]')
        const filtered = leads.filter(l => !['s1','s2','s3','s4','s5','s6'].includes(l.id))
        localStorage.setItem('netcard_crm_leads', JSON.stringify(filtered))
      } catch {}
      setDeleted(true)
    } catch (e) {
      setDelErr(e instanceof Error ? e.message : 'Something went wrong')
    }
    setDeleting(false)
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
        <span className="header-title">Account Details</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="content" style={{ paddingTop: 12 }}>

        {/* Profile URL card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: '14px 16px', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Your PPL-AI URL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--indigo)', fontFamily: 'var(--font-sans)' }}>{profileUrl}</div>
            <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--green)' : 'var(--indigo)', padding: 4 }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button onClick={() => window.open(`https://${profileUrl}`, '_blank')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--indigo)', padding: 4 }}>
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* Username */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '16px 16px 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'var(--font-sans)' }}>PPL-AI Profile</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Username</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--elevated)' }}>
              <span style={{ padding: '11px 12px', fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', borderRight: '1px solid var(--border)', background: 'var(--bg)', whiteSpace: 'nowrap' }}>pplai.app/u/</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase())}
                style={{ flex: 1, padding: '11px 12px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}
              />
              <Pencil size={13} color="var(--text-muted)" style={{ marginRight: 12 }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>Lowercase letters, numbers, hyphens only</div>
          </div>
        </div>

        {/* Sign-in credentials */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '16px 16px 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'var(--font-sans)' }}>Sign-in Credentials</div>
          <Field label="Email" value={email} onChange={setEmail} hint="Used to sign in to your account" />
          <Field label="New Password" value={password} onChange={v => { setPassword(v); setPwErr('') }} type="password" hint="Leave blank to keep current password" />
          <Field label="Confirm Password" value={confirm} onChange={v => { setConfirm(v); setPwErr('') }} type="password" />
          {pwErr && <div style={{ fontSize: 12, color: 'var(--coral)', marginTop: -10, marginBottom: 14, fontFamily: 'var(--font-sans)' }}>{pwErr}</div>}
        </div>

        {/* Save */}
        <button onClick={handleSave} className="btn-primary" style={{ width: '100%' }}>
          {saved ? <><Check size={16} /> Saved</> : 'Save Changes'}
        </button>

        {/* Danger zone */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>Sample Data</div>

          {deleted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--green)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
              <Check size={15} /> Sample data deleted successfully.
            </div>
          ) : (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                Remove the pre-loaded sample events and contacts that were added when you joined.
              </p>
              {delErr && (
                <div style={{ fontSize: 12, color: 'var(--coral)', marginBottom: 10, fontFamily: 'var(--font-sans)' }}>{delErr}</div>
              )}
              <button
                onClick={handleDeleteSampleData}
                disabled={deleting}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px 0', borderRadius: 12, cursor: deleting ? 'not-allowed' : 'pointer',
                  border: '1.5px solid rgba(232,90,79,0.4)',
                  background: deleting ? 'var(--elevated)' : 'rgba(232,90,79,0.08)',
                  color: deleting ? 'var(--text-muted)' : 'var(--coral)',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
              >
                {deleting
                  ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</>
                  : <><Trash2 size={14} /> Delete Sample Data</>}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
