import { useState, useRef } from 'react'
import { ArrowRight, ArrowLeft, User, Mail, Linkedin, Phone, Sparkles, Target } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const STEPS = [
  { id: 1, label: 'Identity',  emoji: '👤' },
  { id: 2, label: 'Contact',   emoji: '📇' },
  { id: 3, label: 'Goals',     emoji: '🎯' },
]

export default function OnboardingScreen({ navigate }) {
  const [step, setStep]       = useState(1)
  const [dir,  setDir]        = useState(1)   // 1 = forward, -1 = back
  const [anim, setAnim]       = useState(false)
  const [saving, setSaving]   = useState(false)

  // Pre-populate from signup data if available
  const saved = (() => { try { return JSON.parse(localStorage.getItem('netcard_my_profile') || '{}') } catch { return {} } })()

  const [name,     setName]     = useState(saved.name     || '')
  const [title,    setTitle]    = useState(saved.title    || '')
  const [company,  setCompany]  = useState(saved.company  || '')
  const [email,    setEmail]    = useState(saved.email    || '')
  const [phone,    setPhone]    = useState(saved.phone    || '')
  const [linkedin, setLinkedin] = useState(saved.linkedin || '')
  const [seeking,  setSeeking]  = useState(saved.seeking  || '')
  const [offering, setOffering] = useState(saved.offering || '')

  const initials = name.trim().split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'

  const goTo = (next) => {
    setDir(next > step ? 1 : -1)
    setAnim(true)
    setTimeout(() => { setStep(next); setAnim(false) }, 200)
  }

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
      name: payload.name, title: payload.role, company: payload.company,
      email: payload.email, phone: payload.phone, linkedin: payload.linkedin_url,
      seeking: payload.seeking, offering: payload.offering,
    }))
    localStorage.setItem('netcard_onboarding_complete', '1')
    setSaving(false)
    navigate('home')
  }

  return (
    <div className="screen" style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {STEPS.map(s => (
            <div key={s.id} style={{
              height: 4, borderRadius: 99,
              flex: s.id <= step ? 1 : 0.4,
              background: s.id <= step ? 'var(--indigo)' : 'var(--border)',
              transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          ))}
        </div>

        {/* Step label */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
          Step {step} of {STEPS.length}
        </div>
      </div>

      {/* Animated content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '0 20px',
        opacity: anim ? 0 : 1,
        transform: anim ? `translateX(${dir * 24}px)` : 'translateX(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}>
        {step === 1 && <Step1
          name={name} setName={setName}
          title={title} setTitle={setTitle}
          company={company} setCompany={setCompany}
          initials={initials}
        />}
        {step === 2 && <Step2
          email={email} setEmail={setEmail}
          phone={phone} setPhone={setPhone}
          linkedin={linkedin} setLinkedin={setLinkedin}
        />}
        {step === 3 && <Step3
          name={name} title={title} company={company}
          seeking={seeking} setSeeking={setSeeking}
          offering={offering} setOffering={setOffering}
          initials={initials}
        />}
        <div style={{ height: 24 }} />
      </div>

      {/* Footer nav */}
      <div style={{ padding: '12px 20px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 1 && (
            <button onClick={() => goTo(step - 1)} className="btn-ghost"
              style={{ flex: '0 0 48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={18} />
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => goTo(step + 1)}
              disabled={step === 1 && !name.trim()}
              className="btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: (step === 1 && !name.trim()) ? 0.4 : 1 }}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={finish} disabled={saving} className="btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? 'Setting up…' : <><Sparkles size={16} /> Launch My Card</>}
            </button>
          )}
        </div>
        {step === 1 && !name.trim() && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Enter your name to continue</p>
        )}
        {step < 3 && (
          <button onClick={() => goTo(step + 1)} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', marginTop: 8, padding: 4 }}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Step 1: Identity ── */
function Step1({ name, setName, title, setTitle, company, setCompany, initials }) {
  return (
    <div>
      {/* Avatar preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, marginTop: 4 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--indigo), #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-sans)',
          boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.15 }}>
            {name.trim() || 'Your Name'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {title.trim() || 'Your role'}{company.trim() ? ` · ${company.trim()}` : ''}
          </div>
        </div>
      </div>

      <Heading title="Who are you?" subtitle="This is how you'll appear on your digital card." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field icon={<User size={15} />} label="Full Name *" value={name} onChange={setName} placeholder="e.g. Alex Johnson" autoFocus />
        <Field label="Title / Role" value={title} onChange={setTitle} placeholder="e.g. Founder & CEO" />
        <Field label="Company" value={company} onChange={setCompany} placeholder="e.g. Acme Corp" />
      </div>
    </div>
  )
}

/* ── Step 2: Contact ── */
function Step2({ email, setEmail, phone, setPhone, linkedin, setLinkedin }) {
  return (
    <div>
      <div style={{
        width: 64, height: 64, borderRadius: 20, marginBottom: 20, marginTop: 4,
        background: 'linear-gradient(135deg, #10b981, #059669)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
      }}>
        <Mail size={28} color="#fff" />
      </div>

      <Heading title="How to reach you?" subtitle="Let new contacts find you easily. All fields are optional." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field icon={<Mail size={15} />} label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
        <Field icon={<Phone size={15} />} label="Phone" value={phone} onChange={setPhone} placeholder="+1 555 000 0000" type="tel" />
        <Field icon={<Linkedin size={15} />} label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/yourname" />
      </div>
    </div>
  )
}

/* ── Step 3: Goals ── */
function Step3({ name, title, company, seeking, setSeeking, offering, setOffering, initials }) {
  return (
    <div>
      <div style={{
        width: 64, height: 64, borderRadius: 20, marginBottom: 20, marginTop: 4,
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
      }}>
        <Target size={28} color="#fff" />
      </div>

      <Heading title="What's your goal?" subtitle="PPL AI uses this to generate smarter follow-ups for you." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="What are you seeking?" value={seeking} onChange={setSeeking}
          placeholder="e.g. Angel investors, enterprise clients, co-founders…" multiline />
        <Field label="What are you offering?" value={offering} onChange={setOffering}
          placeholder="e.g. SaaS expertise, design services, intros to VCs…" multiline />
      </div>

      {/* Card preview */}
      <div style={{
        marginTop: 24, borderRadius: 16, overflow: 'hidden',
        background: 'linear-gradient(135deg, #2D2F6B 0%, #3D3080 100%)',
        padding: '16px', boxShadow: '0 12px 32px rgba(45,47,107,0.3)',
      }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Your card preview</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(99,102,241,0.5)', border: '1.5px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
          }}>{initials}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: '#fff' }}>{name || 'Your Name'}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{title || 'Your role'}{company ? ` · ${company}` : ''}</div>
          </div>
        </div>
        {(seeking || offering) && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.07)', borderRadius: 8 }}>
            {seeking && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>🔍 {seeking.slice(0, 60)}{seeking.length > 60 ? '…' : ''}</div>}
            {offering && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>✨ {offering.slice(0, 60)}{offering.length > 60 ? '…' : ''}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function Heading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{subtitle}</div>
    </div>
  )
}

function Field({ icon, label, value, onChange, placeholder, type = 'text', multiline = false, autoFocus = false }) {
  const base = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--card)', color: 'var(--text-primary)',
    border: '1.5px solid var(--border)', borderRadius: 12,
    padding: icon ? '11px 13px 11px 36px' : '11px 13px',
    fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)',
  }
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
            {icon}
          </div>
        )}
        {multiline
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
              style={{ ...base, resize: 'none', lineHeight: 1.5 }} />
          : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
              type={type} autoFocus={autoFocus} style={base} />
        }
      </div>
    </div>
  )
}
