import { useState, useEffect } from 'react'
import { ArrowLeft, Send, Check, Bug, Lightbulb, HelpCircle, Loader, Clock, ChevronDown, ChevronUp, X } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const CATEGORIES = [
  { id: 'bug',     label: 'Report a Bug',   icon: Bug,        color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  { id: 'suggest', label: 'App Suggestion', icon: Lightbulb,  color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'  },
  { id: 'help',    label: 'Other Help',     icon: HelpCircle, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
]

const STATUS_META = {
  open:        { label: 'Open',        color: '#6366F1', bg: 'rgba(99,102,241,0.1)'   },
  in_progress: { label: 'In Progress', color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  resolved:    { label: 'Resolved',    color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
  closed:      { label: 'Closed',      color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}

function formatDate(str) {
  try { return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return '' }
}

export default function HelpSupportScreen({ navigate, goBack }) {
  const [category, setCategory] = useState('help')
  const [message,  setMessage]  = useState('')
  const [email,    setEmail]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('netcard_my_profile') || '{}').email || '' } catch { return '' }
  })
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [err,      setErr]      = useState('')
  const [tickets,  setTickets]  = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showCatDrop, setShowCatDrop] = useState(false)

  const cat = CATEGORIES.find(c => c.id === category)

  useEffect(() => {
    fetch(`${API}/api/support`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setTickets(d.data) })
      .catch(() => {})
  }, [])

  const handleSend = async () => {
    if (!message.trim()) { setErr('Please write a message before sending'); return }
    setSending(true); setErr('')
    try {
      const body = { category, message: message.trim() }
      if (email.trim()) body.email = email.trim()
      const r = await fetch(`${API}/api/support`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!d.success) { setErr(d.error || 'Failed to send — try again'); return }
      setTickets(prev => [d.data, ...prev])
      setSent(true)
    } catch {
      setErr('Network error — please try again')
    } finally {
      setSending(false)
    }
  }

  const handleReset = () => { setMessage(''); setSent(false); setErr('') }

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
        <span className="header-title">Help & Support</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="content" style={{ paddingTop: 12 }}>

        {sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={32} color="var(--green)" strokeWidth={2.5} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Message Sent!</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 260, margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
                The PPL-AI team will get back to you{email ? ` at ${email}` : ''} within 1–2 business days.
              </div>
            </div>
            <button onClick={handleReset} className="btn-ghost" style={{ marginTop: 8 }}>Send Another</button>
          </div>
        ) : (
          <>
            {/* Category dropdown */}
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Category</div>

              {/* Trigger */}
              <button
                onClick={() => setShowCatDrop(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 14,
                  border: `1.5px solid ${showCatDrop ? cat.color : 'var(--border)'}`,
                  background: 'var(--card)', cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <cat.icon size={16} color={cat.color} />
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: cat.color, fontFamily: 'var(--font-sans)' }}>{cat.label}</span>
                <ChevronDown size={15} color="var(--text-muted)" style={{ transform: showCatDrop ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </button>

              {/* Dropdown list */}
              {showCatDrop && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                  background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 20,
                  overflow: 'hidden',
                }}>
                  {CATEGORIES.map((c, i) => {
                    const Ic = c.icon
                    const active = category === c.id
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setCategory(c.id); setShowCatDrop(false) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', border: 'none', cursor: 'pointer',
                          background: active ? c.bg : 'transparent',
                          borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                          textAlign: 'left', transition: 'background 0.1s',
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          border: `2px solid ${active ? c.color : 'var(--border)'}`,
                          background: active ? c.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}>
                          {active && <Check size={11} color="#fff" strokeWidth={3} />}
                        </div>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Ic size={15} color={c.color} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? c.color : 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Message</div>
              <textarea
                value={message}
                onChange={e => { setMessage(e.target.value); setErr('') }}
                placeholder={
                  category === 'bug'     ? 'Describe what happened, steps to reproduce…' :
                  category === 'suggest' ? 'What feature or improvement would you like to see?' :
                  'How can we help you today?'
                }
                rows={6}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${err ? 'var(--coral)' : 'var(--border)'}`, background: 'var(--card)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'none', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = cat.color}
                onBlur={e => e.target.style.borderColor = err ? 'var(--coral)' : 'var(--border)'}
              />
              {err && <div style={{ fontSize: 12, color: 'var(--coral)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>{err}</div>}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right', fontFamily: 'var(--font-sans)' }}>{message.length} chars</div>
            </div>

            {/* Reply email */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Reply-to Email (optional)</div>
              <input
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" type="email"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = cat.color}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>We'll only use this to follow up on your message</div>
            </div>

            {/* Send button */}
            <button onClick={handleSend} disabled={sending}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', borderRadius: 14, border: 'none', background: sending ? 'var(--elevated)' : cat.color, color: sending ? 'var(--text-muted)' : '#fff', fontSize: 15, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>
              {sending ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</> : <><Send size={16} /> Send Now</>}
            </button>
          </>
        )}

        {/* Ticket history */}
        {tickets.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <button onClick={() => setShowHistory(h => !h)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Clock size={14} /> Previous Tickets ({tickets.length})</span>
              {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showHistory && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {tickets.map(t => {
                  const sm = STATUS_META[t.status] || STATUS_META.open
                  const catMeta = CATEGORIES.find(c => c.id === t.category) || CATEGORIES[2]
                  return (
                    <div key={t.id} style={{ background: 'var(--card)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: catMeta.color, fontFamily: 'var(--font-sans)' }}>{catMeta.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: sm.color, background: sm.bg, borderRadius: 20, padding: '2px 8px', fontFamily: 'var(--font-sans)' }}>{sm.label}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, marginBottom: 6 }}>{t.message}</div>
                      {t.admin_note && (
                        <div style={{ fontSize: 12, color: 'var(--indigo)', background: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: '7px 10px', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>
                          <strong>Reply:</strong> {t.admin_note}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{formatDate(t.created_at)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
