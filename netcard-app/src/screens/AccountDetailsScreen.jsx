import { apiFetch } from '../lib/apiFetch'
import { useState, useEffect } from 'react'
import { ArrowLeft, Check, Copy, ExternalLink, Pencil, Trash2, Loader, Phone, Mail, User, Shield, Users, Globe } from 'lucide-react'

const PROFILE_KEY = 'netcard_my_profile'
const INITIAL = {
  name: '', title: '', company: '', email: '', phone: '',
  whatsapp: '', linkedin: '', web: '', seeking: '', offering: '',
}
function loadProfile() {
  try { return { ...INITIAL, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') } } catch { return INITIAL }
}

const ROLE_COLORS = {
  owner:  { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', label: 'Owner'  },
  admin:  { bg: 'rgba(99,102,241,0.12)', color: 'var(--indigo)', label: 'Admin'  },
  editor: { bg: 'rgba(245,158,11,0.12)', color: 'var(--amber)',  label: 'Editor' },
  viewer: { bg: 'rgba(50,213,131,0.12)', color: 'var(--green)',  label: 'Viewer' },
}
function RoleBadge({ role }) {
  const r = ROLE_COLORS[role] ?? ROLE_COLORS.viewer
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: r.color, background: r.bg, borderRadius: 6, padding: '3px 8px' }}>
      {r.label}
    </span>
  )
}

function Row({ icon, label, value, dim, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: '1px solid var(--border)' }}>
      <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 14, color: dim ? 'var(--text-muted)' : 'var(--text-primary)', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
      {action}
    </div>
  )
}

export default function AccountDetailsScreen({ navigate, goBack }) {
  const [profile, setProfile] = useState(loadProfile)
  const [username, setUsername] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [ownedTeam, setOwnedTeam] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameDraft, setUsernameDraft] = useState('')
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [delErr, setDelErr] = useState('')

  useEffect(() => {
    // Read login email from last-user record
    try {
      const lu = JSON.parse(localStorage.getItem('netcard_last_user') || 'null')
      setLoginEmail(lu?.email || '')
    } catch {}

    // Hydrate profile from API
    apiFetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.data) return
        const p = d.data
        const cached = loadProfile()
        const merged = {
          ...cached,
          name:     p.name         || cached.name,
          title:    p.role         || cached.title,
          company:  p.company      || cached.company,
          email:    p.email        || cached.email,
          phone:    p.phone        || cached.phone,
          linkedin: p.linkedin_url || cached.linkedin,
          web:      p.web_url      || cached.web,
        }
        setProfile(merged)
        try { localStorage.setItem(PROFILE_KEY, JSON.stringify(merged)) } catch {}
        if (p.username) setUsername(p.username)
        if (!loginEmail && p.email) setLoginEmail(p.email)
      })
      .catch(() => {})

    apiFetch('/api/team')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.data) setOwnedTeam(d.data) })
      .catch(() => {})
      .finally(() => setTeamsLoading(false))
  }, [])

  const cardUrl = username ? `pplai.app/u/${username}` : ''

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://${cardUrl}`).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const startEdit = () => { setUsernameDraft(username); setUsernameStatus(null); setEditingUsername(true) }

  const handleDraftChange = (val) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setUsernameDraft(slug)
    if (!slug || slug.length < 3) { setUsernameStatus(slug.length ? 'invalid' : null); return }
    setUsernameStatus('checking')
    clearTimeout(window.__unameTimer)
    window.__unameTimer = setTimeout(async () => {
      try {
        const r = await apiFetch(`/api/profile/username?check=${encodeURIComponent(slug)}`)
        const d = await r.json()
        setUsernameStatus(d?.data?.yours || d?.data?.available ? 'available' : (d?.data?.reason ? 'invalid' : 'taken'))
      } catch { setUsernameStatus(null) }
    }, 400)
  }

  const saveUsername = async () => {
    if (usernameStatus !== 'available') return
    const r = await apiFetch('/api/profile/username', { method: 'PATCH', body: JSON.stringify({ username: usernameDraft }) })
    if (r.ok) { setUsername(usernameDraft); setEditingUsername(false); setUsernameStatus(null) }
    else {
      const d = await r.json()
      setUsernameStatus(d?.error === 'Username already taken' ? 'taken' : 'invalid')
    }
  }

  const handleDeleteSampleData = async () => {
    setDeleting(true); setDelErr('')
    try {
      const r = await apiFetch('/api/onboarding/seed', { method: 'DELETE' })
      const d = await r.json()
      if (!d.success) throw new Error(d.error || 'Failed')
      localStorage.removeItem('netcard_seed_attempted')
      setDeleted(true)
    } catch (e) {
      setDelErr(e instanceof Error ? e.message : 'Something went wrong')
    }
    setDeleting(false)
  }

  const initials = profile.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const statusColor = usernameStatus === 'available' ? 'var(--green)'
    : (usernameStatus === 'taken' || usernameStatus === 'invalid') ? 'var(--coral)'
    : 'var(--text-muted)'

  return (
    <div className="screen">
      <div className="status-bar">
        <span className="status-time">9:41</span>
        <div className="status-icons">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/><rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/><rect x="9" y="0" width="3" height="12" rx="1" opacity="0.8"/><rect x="13.5" y="0" width="3" height="12" rx="1"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none"/><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/></svg>
        </div>
      </div>

      <div className="screen-header">
        <button className="icon-btn" onClick={goBack ?? (() => navigate('home'))}><ArrowLeft size={20} /></button>
        <span className="header-title">Account Details</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="content" style={{ paddingTop: 12, gap: 12 }}>

        {/* ── Profile card ─────────────────────────────────────── */}
        <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Avatar + name hero */}
          <div style={{ padding: '16px 16px 14px', display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)' }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.name || 'Your Name'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {[profile.title, profile.company].filter(Boolean).join(' · ') || 'Add your details'}
              </div>
            </div>
            <button
              onClick={() => navigate('mycard')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}
            >
              <Pencil size={11} /> Edit
            </button>
          </div>

          <Row
            icon={<User size={14} />}
            label="Full Name"
            value={profile.name || '—'}
            dim={!profile.name}
            action={!profile.name && (
              <button onClick={() => navigate('mycard')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add</button>
            )}
          />
          <Row
            icon={<Phone size={14} color={profile.phone ? 'var(--green)' : undefined} />}
            label="Mobile"
            value={profile.phone || 'Not added'}
            dim={!profile.phone}
            action={!profile.phone && (
              <button onClick={() => navigate('mycard')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add</button>
            )}
          />
        </div>

        {/* ── Sign-in ───────────────────────────────────────────── */}
        <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 0', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sign-in</div>
          <Row
            icon={<Mail size={14} color="var(--indigo)" />}
            label="Login ID"
            value={loginEmail || profile.email || '—'}
          />
          <Row
            icon={<Shield size={14} />}
            label="Password"
            value="Passwordless — sign in with email OTP"
            dim
            action={<span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', background: 'rgba(50,213,131,0.12)', borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>OTP</span>}
          />
        </div>

        {/* ── PPL AI Card URL ───────────────────────────────────── */}
        <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 0', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>PPL AI Card URL</div>

          {!editingUsername ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 16px', borderTop: '1px solid var(--border)', marginTop: 14 }}>
              <Globe size={14} color="var(--indigo)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 }}>Your URL</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: cardUrl ? 'var(--indigo)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                  {cardUrl || 'pplai.app/u/your-username'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {cardUrl && (
                  <>
                    <button onClick={handleCopy} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: copied ? 'rgba(50,213,131,0.12)' : 'var(--elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {copied ? <Check size={13} color="var(--green)" /> : <Copy size={13} color="var(--text-secondary)" />}
                    </button>
                    <button onClick={() => window.open(`https://${cardUrl}`, '_blank')} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ExternalLink size={13} color="var(--text-secondary)" />
                    </button>
                  </>
                )}
                <button onClick={startEdit} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pencil size={13} color="var(--text-secondary)" />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '13px 16px', borderTop: '1px solid var(--border)', marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${usernameStatus === 'available' ? 'var(--green)' : (usernameStatus === 'taken' || usernameStatus === 'invalid') ? 'var(--coral)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden', background: 'var(--elevated)' }}>
                <span style={{ padding: '10px 6px 10px 12px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>pplai.app/u/</span>
                <input
                  autoFocus
                  value={usernameDraft}
                  onChange={e => handleDraftChange(e.target.value)}
                  placeholder="your-username"
                  style={{ flex: 1, padding: '10px 8px', border: 'none', background: 'transparent', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', outline: 'none', minWidth: 0 }}
                />
              </div>
              <div style={{ fontSize: 11, color: statusColor, marginTop: 5, marginBottom: 10, minHeight: 16 }}>
                {usernameStatus === 'available' && '✓ Available'}
                {usernameStatus === 'taken'     && '✗ Already taken'}
                {usernameStatus === 'invalid'   && '✗ Min 3 chars: a–z, 0–9, - or _'}
                {usernameStatus === 'checking'  && 'Checking…'}
                {!usernameStatus && 'Letters, numbers, - and _ only'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditingUsername(false)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: 'var(--elevated)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
                <button onClick={saveUsername} disabled={usernameStatus !== 'available'} style={{ flex: 2, padding: '9px', borderRadius: 10, border: 'none', background: usernameStatus === 'available' ? 'var(--indigo)' : 'var(--border)', color: usernameStatus === 'available' ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: usernameStatus === 'available' ? 'pointer' : 'default', fontFamily: 'var(--font-sans)' }}>Save</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Enterprises & Groups ──────────────────────────────── */}
        <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Enterprises & Groups</div>
            <button onClick={() => navigate('team')} style={{ fontSize: 11, fontWeight: 600, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer' }}>Manage →</button>
          </div>

          {teamsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0' }}>
              <Loader size={15} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
            </div>
          ) : (
            <>
              {/* Your workspace */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: '1px solid var(--border)', marginTop: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={15} color="var(--indigo)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.company || 'My Workspace'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                    {ownedTeam.length > 0 ? `${ownedTeam.length} member${ownedTeam.length !== 1 ? 's' : ''}` : 'Personal workspace'}
                  </div>
                </div>
                <RoleBadge role="owner" />
              </div>

              {ownedTeam.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 10px 62px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {member.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
                  </div>
                  <RoleBadge role={member.access} />
                </div>
              ))}

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  Cross-org groups coming soon — share contacts & assign leads across teams.
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Sample Data ───────────────────────────────────────── */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Sample Data</div>
          {deleted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
              <Check size={14} /> Deleted successfully
            </div>
          ) : (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>Remove the pre-loaded sample events and contacts.</p>
              {delErr && <div style={{ fontSize: 12, color: 'var(--coral)', marginBottom: 8 }}>{delErr}</div>}
              <button
                onClick={handleDeleteSampleData}
                disabled={deleting}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', borderRadius: 11, border: '1.5px solid rgba(232,90,79,0.4)', background: deleting ? 'var(--elevated)' : 'rgba(232,90,79,0.08)', color: deleting ? 'var(--text-muted)' : 'var(--coral)', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                {deleting ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</> : <><Trash2 size={13} /> Delete Sample Data</>}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
