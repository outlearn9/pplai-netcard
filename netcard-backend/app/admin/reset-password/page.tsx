'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const C = {
  bg: '#f8fafc', surface: '#ffffff', border: '#e2e8f0',
  t1: '#0f172a', t2: '#475569', t3: '#94a3b8',
  indigo: '#6366f1', green: '#059669', red: '#ef4444',
  shadow2: '0 4px 20px rgba(0,0,0,0.11)',
}

function ResetPasswordForm() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const valid = password.length >= 6 && password === confirm

  const submit = async () => {
    if (!valid) { setError('Passwords must match and be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const d = await res.json()
      if (d.success) { setSuccess(true) }
      else { setError(d.error ?? 'Invalid or expired link') }
    } catch { setError('Server unreachable') }
    setLoading(false)
  }

  if (!token) {
    return <p style={{ fontSize: 14, color: C.red }}>Missing reset token. Request a new password reset link.</p>
  }

  if (success) {
    return (
      <>
        <div style={{ color: C.green, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>✓ Password updated!</div>
        <p style={{ fontSize: 14, color: C.t2, marginBottom: 20 }}>You can now sign in with your new password.</p>
        <a href="/admin" style={{ display: 'block', background: C.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
          Go to Admin Login
        </a>
      </>
    )
  }

  return (
    <>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.t2, textTransform: 'uppercase', letterSpacing: 0.4 }}>New Password</label>
      <input
        type="password" value={password} onChange={e => setPassword(e.target.value)}
        placeholder="At least 6 characters"
        style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, marginBottom: 14, background: C.bg, color: C.t1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 13px', fontSize: 14, outline: 'none' }}
      />
      <label style={{ fontSize: 11, fontWeight: 700, color: C.t2, textTransform: 'uppercase', letterSpacing: 0.4 }}>Confirm Password</label>
      <input
        type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Repeat password"
        style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, marginBottom: 20, background: C.bg, color: C.t1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 13px', fontSize: 14, outline: 'none' }}
      />
      {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}
      <button
        onClick={submit} disabled={loading || !valid}
        style={{ width: '100%', background: C.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: loading || !valid ? 'default' : 'pointer', opacity: loading || !valid ? 0.6 : 1 }}
      >
        {loading ? 'Saving…' : 'Set New Password'}
      </button>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '44px 48px', width: 380, boxShadow: C.shadow2 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.t1, marginBottom: 4, letterSpacing: -0.3 }}>PPL AI · Admin</div>
        <div style={{ fontSize: 13, color: C.t2, marginBottom: 30 }}>Set a new password</div>
        <Suspense fallback={<div style={{ color: C.t3, fontSize: 13 }}>Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a href="/admin" style={{ fontSize: 12, color: C.t3, textDecoration: 'none' }}>← Back to sign in</a>
        </div>
      </div>
    </div>
  )
}
