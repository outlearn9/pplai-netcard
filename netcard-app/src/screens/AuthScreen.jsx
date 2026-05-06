import { useState, useRef, useEffect } from 'react'
import { ArrowRight, ChevronDown, ArrowLeft, RotateCcw } from 'lucide-react'

const API      = import.meta.env.VITE_API_URL  || ''
const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001'

const COUNTRIES = [
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada' },
]

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function LinkedInLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect width="18" height="18" rx="3" fill="#0A66C2"/>
      <path d="M4.5 7H6.5V13.5H4.5V7ZM5.5 4C4.95 4 4.5 4.45 4.5 5C4.5 5.55 4.95 6 5.5 6C6.05 6 6.5 5.55 6.5 5C6.5 4.45 6.05 4 5.5 4Z" fill="white"/>
      <path d="M8 7H9.9V7.9H9.93C10.2 7.36 10.9 6.8 11.95 6.8C14 6.8 14.4 8.1 14.4 9.85V13.5H12.4V10.25C12.4 9.55 12.38 8.65 11.4 8.65C10.4 8.65 10.25 9.41 10.25 10.2V13.5H8.25V7H8Z" fill="white"/>
    </svg>
  )
}

function OTPInput({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]
  const digits = value.split('')

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i) + value.slice(i + 1)
      onChange(next)
      if (i > 0) refs[i - 1].current?.focus()
    } else if (/^\d$/.test(e.key)) {
      const next = (value.slice(0, i) + e.key + value.slice(i + 1)).slice(0, 6)
      onChange(next)
      if (i < 5) refs[i + 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    refs[Math.min(pasted.length, 5)].current?.focus()
    e.preventDefault()
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={refs[i]}
          type="tel"
          maxLength={1}
          value={digits[i] || ''}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onChange={() => {}}
          autoFocus={i === 0}
          style={{
            width: 44, height: 52, borderRadius: 12,
            border: `2px solid ${digits[i] ? 'var(--indigo)' : 'var(--border-strong)'}`,
            background: digits[i] ? 'rgba(99,102,241,0.06)' : 'var(--card)',
            textAlign: 'center', fontSize: 22, fontWeight: 700,
            color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
            outline: 'none', transition: 'border-color 0.15s, background 0.15s',
          }}
        />
      ))}
    </div>
  )
}

export default function AuthScreen({ onAuth }) {
  // 'checking' | 'returning' | 'landing' | 'phone' | 'otp'
  const [phase, setPhase] = useState('checking')
  const [country, setCountry] = useState(COUNTRIES[0])
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const [loading, setLoading] = useState(false)

  const lastUser = (() => {
    try { return JSON.parse(localStorage.getItem('netcard_last_user') || 'null') } catch { return null }
  })()

  // On mount: check if a Clerk session cookie is already valid
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)

    fetch(`${API}/api/profile`, { credentials: 'include', signal: controller.signal })
      .then(r => {
        clearTimeout(timer)
        if (r.ok) {
          r.json().then(d => {
            if (d?.data?.name) {
              localStorage.setItem('netcard_last_user', JSON.stringify({ name: d.data.name, email: d.data.email }))
            }
            onAuth?.()
          })
        } else {
          setPhase(lastUser ? 'returning' : 'landing')
        }
      })
      .catch(() => {
        clearTimeout(timer)
        setPhase(lastUser ? 'returning' : 'landing')
      })
  }, [])

  useEffect(() => {
    if (phase !== 'otp') return
    setResendTimer(30)
    const id = setInterval(() => setResendTimer(t => t > 0 ? t - 1 : 0), 1000)
    return () => clearInterval(id)
  }, [phase])

  const sendOtp = () => {
    if (phone.length < 6) return
    // Redirect to Clerk sign-in which handles phone/SMS auth
    window.location.href = `${AUTH_URL}/sign-in`
  }

  const verifyOtp = () => {
    if (otp.length < 6) return
    window.location.href = `${AUTH_URL}/sign-in`
  }

  const goToSignIn  = () => { window.location.href = `${AUTH_URL}/sign-in`  }
  const goToSignUp  = () => { window.location.href = `${AUTH_URL}/sign-up`  }

  const initials = lastUser?.name
    ? lastUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : ''

  return (
    <div className="screen" style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

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

      {/* ── CHECKING SESSION ─── */}
      {phase === 'checking' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--indigo)', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Checking session…</p>
        </div>
      )}

      {/* ── RETURNING USER ─── */}
      {phase === 'returning' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px 36px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
            {/* Logo */}
            <div style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg, var(--indigo), #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <circle cx="10" cy="10" r="5" fill="white" opacity="0.9"/>
                <circle cx="20" cy="10" r="5" fill="white" opacity="0.6"/>
                <circle cx="15" cy="19" r="5" fill="white" opacity="0.75"/>
                <line x1="10" y1="10" x2="20" y2="10" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                <line x1="10" y1="10" x2="15" y2="19" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                <line x1="20" y1="10" x2="15" y2="19" stroke="white" strokeWidth="1.5" opacity="0.5"/>
              </svg>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--indigo)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Welcome back</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 8 }}>
                {lastUser?.name ?? 'Good to see you'}
              </div>
              {lastUser?.email && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{lastUser.email}</div>
              )}
            </div>

            {/* Avatar chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)' }}>{initials}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{lastUser?.name}</div>
                {lastUser?.email && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{lastUser.email}</div>}
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={goToSignIn}
              style={{
                width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, var(--indigo), var(--indigo-dark))',
                color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
              }}
            >
              Sign in <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setPhase('landing')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: '6px 0', fontFamily: 'var(--font-sans)' }}
            >
              Use a different account
            </button>
          </div>
        </div>
      )}

      {/* ── LANDING ─── */}
      {phase === 'landing' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px 36px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--indigo), #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="10" cy="10" r="5" fill="white" opacity="0.9"/>
                <circle cx="20" cy="10" r="5" fill="white" opacity="0.6"/>
                <circle cx="15" cy="19" r="5" fill="white" opacity="0.75"/>
                <line x1="10" y1="10" x2="20" y2="10" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                <line x1="10" y1="10" x2="15" y2="19" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                <line x1="20" y1="10" x2="15" y2="19" stroke="white" strokeWidth="1.5" opacity="0.5"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -1, lineHeight: 1.15, marginBottom: 12 }}>
              Your network,<br/>beautifully organised.
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 280 }}>
              Scan, connect & follow-up — all your contacts from every event, in one place.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Primary CTA */}
            <button
              onClick={goToSignUp}
              style={{
                width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, var(--indigo), var(--indigo-dark))',
                color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
              }}
            >
              Create free card <ArrowRight size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Google */}
            <button
              onClick={goToSignIn}
              style={{
                width: '100%', padding: '13px 20px', borderRadius: 14,
                border: '1.5px solid var(--border-strong)', background: 'var(--card)',
                color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <GoogleLogo /> Continue with Google
            </button>

            {/* LinkedIn */}
            <button
              onClick={goToSignIn}
              style={{
                width: '100%', padding: '13px 20px', borderRadius: 14,
                border: '1.5px solid var(--border-strong)', background: 'var(--card)',
                color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <LinkedInLogo /> Continue with LinkedIn
            </button>

            {/* Mobile OTP (dev convenience) */}
            <button
              onClick={() => setPhase('phone')}
              style={{
                width: '100%', padding: '13px 20px', borderRadius: 14,
                border: '1.5px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="4" y="1" width="10" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="14" r="1" fill="currentColor"/>
              </svg>
              Continue with Mobile
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
              By continuing you agree to our{' '}
              <span style={{ color: 'var(--indigo)', cursor: 'pointer' }} onClick={() => window.open(`${AUTH_URL}/legal`, '_blank')}>Terms & Privacy</span>
            </p>
          </div>
        </div>
      )}

      {/* ── PHONE ENTRY ─── */}
      {phase === 'phone' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px 36px' }}>
          <button onClick={() => setPhase('landing')} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, padding: '8px 0' }}>
            <ArrowLeft size={15} /> Back
          </button>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.6, marginBottom: 8 }}>
              Enter your number
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.5 }}>
              We'll send a one-time code to verify your identity.
            </div>

            <div style={{ background: 'var(--card)', borderRadius: 14, border: '1.5px solid var(--border-strong)', display: 'flex', alignItems: 'center', overflow: 'hidden', marginBottom: 16 }}>
              <button
                onClick={() => setShowCountryPicker(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '14px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderRight: '1px solid var(--border)', flexShrink: 0 }}
              >
                <span style={{ fontSize: 18 }}>{country.flag}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{country.dial}</span>
                <ChevronDown size={12} color="var(--text-muted)" />
              </button>
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                style={{ flex: 1, padding: '14px 14px', border: 'none', background: 'transparent', fontSize: 15, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', outline: 'none' }}
                autoFocus
              />
            </div>

            {showCountryPicker && (
              <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                {COUNTRIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setCountry(c); setShowCountryPicker(false) }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', border: 'none', background: c.code === country.code ? 'rgba(99,102,241,0.06)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 18 }}>{c.flag}</span>
                    <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{c.dial}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={sendOtp}
              disabled={phone.length < 6 || loading}
              style={{
                width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                background: phone.length >= 6 ? 'linear-gradient(135deg, var(--indigo), var(--indigo-dark))' : 'var(--border)',
                color: phone.length >= 6 ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, cursor: phone.length >= 6 ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', boxShadow: phone.length >= 6 ? '0 6px 20px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              {loading ? 'Sending…' : <>Send OTP <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* ── OTP ─── */}
      {phase === 'otp' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px 36px' }}>
          <button onClick={() => setPhase('phone')} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, padding: '8px 0' }}>
            <ArrowLeft size={15} /> Back
          </button>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.6, marginBottom: 8 }}>
              Verify your number
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 36, lineHeight: 1.5 }}>
              Enter the 6-digit code sent to<br />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{country.dial} {phone}</span>
            </div>

            <OTPInput value={otp} onChange={setOtp} />

            <button
              onClick={verifyOtp}
              disabled={otp.length < 6 || loading}
              style={{
                width: '100%', padding: '15px', borderRadius: 14, border: 'none', marginTop: 28,
                background: otp.length === 6 ? 'linear-gradient(135deg, var(--indigo), var(--indigo-dark))' : 'var(--border)',
                color: otp.length === 6 ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, cursor: otp.length === 6 ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', boxShadow: otp.length === 6 ? '0 6px 20px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              {loading ? 'Verifying…' : <>Verify & Continue <ArrowRight size={16} /></>}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
              {resendTimer > 0 ? (
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Resend in {resendTimer}s</span>
              ) : (
                <button
                  onClick={() => { setOtp(''); setPhase('otp') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--indigo)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)' }}
                >
                  <RotateCcw size={13} /> Resend code
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(245,244,241,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backdropFilter: 'blur(2px)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--indigo)', animation: 'spin 0.7s linear infinite' }} />
        </div>
      )}
    </div>
  )
}
