import { useState } from 'react'
import { Search, Gift } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

export default function OnboardingScreen({ navigate }) {
  const [saving, setSaving] = useState(false)

  const [name,     setName]     = useState('')
  const [title,    setTitle]    = useState('')
  const [company,  setCompany]  = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [seeking,  setSeeking]  = useState('')
  const [offering, setOffering] = useState('')

  const displayName = name.trim() || 'Your Name'
  const displayTitle = title.trim() || 'Your Title'
  const initials = displayName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

  const finish = async () => {
    setSaving(true)
    const payload = {
      name:         name.trim(),
      role:         title.trim(),
      company:      company.trim(),
      email:        email.trim(),
      phone:        phone.trim(),
      linkedin_url: linkedin.trim(),
      seeking:      seeking.trim(),
      offering:     offering.trim(),
    }
    try {
      await fetch(`${API}/api/profile`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {}

    localStorage.setItem('netcard_my_profile', JSON.stringify({
      name:     payload.name,
      title:    payload.role,
      company:  payload.company,
      email:    payload.email,
      phone:    payload.phone,
      linkedin: payload.linkedin_url,
      seeking:  payload.seeking,
      offering: payload.offering,
    }))

    setSaving(false)
    navigate('mycard')
  }

  return (
    <div className="screen" style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

        {/* Welcome header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            Welcome to PPL AI
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Your digital card is ready
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Fill in your details — the card updates live.
          </div>
        </div>

        {/* Hero Card — live preview */}
        <div style={{
          borderRadius: 24, overflow: 'hidden', position: 'relative', height: 196,
          background: 'linear-gradient(145deg, #2D2F6B 0%, #3D3080 45%, #252560 100%)',
          boxShadow: '0 16px 48px rgba(45,47,107,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
          marginBottom: 18, flexShrink: 0,
        }}>
          {/* Glow blobs */}
          <div style={{ position: 'absolute', top: -40, left: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.5) 0%, transparent 70%)', filter: 'blur(28px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)', filter: 'blur(24px)', pointerEvents: 'none' }} />
          {/* Grid texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

          {/* Logo mark */}
          <div style={{ position: 'absolute', top: 12, left: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg,#6366F1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle cx="4" cy="4" r="2.2" fill="white" opacity="0.9"/>
                <circle cx="8.5" cy="4" r="2.2" fill="white" opacity="0.55"/>
                <circle cx="6.5" cy="8.5" r="2.2" fill="white" opacity="0.72"/>
              </svg>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>NetCard</span>
          </div>

          {/* Avatar */}
          <div style={{ position: 'absolute', left: 16, top: 40 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(168,85,247,0.6))', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 700, color: '#fff' }}>{initials}</span>
            </div>
          </div>

          {/* Name / title — bottom left */}
          <div style={{ position: 'absolute', left: 16, bottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: name.trim() ? '#fff' : 'rgba(255,255,255,0.3)', letterSpacing: -0.5, lineHeight: 1.15 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: title.trim() ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)', marginTop: 2, fontFamily: 'var(--font-sans)' }}>
              {displayTitle}
            </div>
            {company.trim() && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 1, fontFamily: 'var(--font-sans)' }}>{company.trim()}</div>
            )}
          </div>

          {/* QR — right side */}
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 12, padding: 9, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <svg width="80" height="80" viewBox="0 0 90 90" fill="none">
                <rect x="2" y="2" width="28" height="28" rx="4" fill="#2D2F6B"/>
                <rect x="7" y="7" width="18" height="18" rx="2" fill="white"/>
                <rect x="11" y="11" width="10" height="10" rx="1" fill="#2D2F6B"/>
                <rect x="60" y="2" width="28" height="28" rx="4" fill="#2D2F6B"/>
                <rect x="65" y="7" width="18" height="18" rx="2" fill="white"/>
                <rect x="69" y="11" width="10" height="10" rx="1" fill="#2D2F6B"/>
                <rect x="2" y="60" width="28" height="28" rx="4" fill="#2D2F6B"/>
                <rect x="7" y="65" width="18" height="18" rx="2" fill="white"/>
                <rect x="11" y="69" width="10" height="10" rx="1" fill="#2D2F6B"/>
                {[36,42,48,54,60,66,72,78].flatMap((x,xi) =>
                  [36,42,48,54,60,66,72,78].map((y,yi) =>
                    (xi+yi)%2===0 && !(x<34&&y<34) && !(x>58&&y<34) && !(x<34&&y>58)
                      ? <rect key={`${x}${y}`} x={x} y={y} width="5" height="5" rx="1" fill="#2D2F6B"/> : null
                  )
                )}
              </svg>
            </div>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: 0.5, fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>Scan to connect</span>
          </div>

          {/* Shimmer line */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(165,180,252,0.6), rgba(192,132,252,0.6), transparent)' }} />
        </div>

        {/* Form */}
        <Section label="Identity">
          <Field label="Full Name *" value={name} onChange={setName} placeholder="e.g. Alex Johnson" autoFocus />
          <Field label="Title / Role" value={title} onChange={setTitle} placeholder="e.g. Product Manager" />
          <Field label="Company" value={company} onChange={setCompany} placeholder="e.g. Acme Corp" />
        </Section>

        <Section label="Contact">
          <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 555 000 0000" type="tel" />
          <Field label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/yourname" />
        </Section>

        <Section label="Networking Pitch">
          <Field label="What are you seeking?" value={seeking} onChange={setSeeking} placeholder="e.g. Investors, enterprise clients…" multiline />
          <Field label="What are you offering?" value={offering} onChange={setOffering} placeholder="e.g. SaaS expertise, design services…" multiline />
        </Section>

        <div style={{ height: 20 }} />
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '12px 20px 28px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <button
          onClick={finish}
          disabled={!name.trim() || saving}
          className="btn-primary"
          style={{ opacity: (!name.trim() || saving) ? 0.45 : 1 }}
        >
          {saving ? 'Creating your card…' : 'Create My Card →'}
        </button>
        {!name.trim() && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Enter your name to continue
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false, autoFocus = false }) {
  const shared = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--card)', color: 'var(--text-primary)',
    border: '1.5px solid var(--border)', borderRadius: 10,
    padding: '11px 13px', fontSize: 14, outline: 'none',
    fontFamily: 'var(--font-sans)',
  }
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
        {label}
      </div>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
            style={{ ...shared, resize: 'none', lineHeight: 1.5 }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            type={type} autoFocus={autoFocus} style={shared} />
      }
    </div>
  )
}
