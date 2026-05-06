'use client'
import { useEffect } from 'react'

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'http://localhost:5173'

export default function AppRedirectPage() {
  useEffect(() => {
    window.location.replace(FRONTEND)
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif',
      background: '#F5F4F1', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #E2E0DC', borderTopColor: '#6366F1',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ fontSize: 14, color: '#6B6A6F' }}>Opening your app…</p>
    </div>
  )
}
