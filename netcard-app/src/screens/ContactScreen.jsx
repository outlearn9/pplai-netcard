import { ArrowLeft, MoreHorizontal, MessageCircle, Mail, Linkedin, Sparkles, Bookmark, Plus, Pencil, Trash2, Copy, RefreshCw, MapPin, Clock, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'

const GRADS = ['grad-purple', 'grad-green', 'grad-amber', 'grad-coral', 'grad-blue']
function toInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function toGrad(name) { return GRADS[name ? name.charCodeAt(0) % GRADS.length : 0] }

const API = import.meta.env.VITE_API_URL || ''

export default function ContactScreen({ navigate, goBack, contact, screenData }) {
  const passedContact = contact || screenData?.contact || screenData || {}
  const contactId = passedContact.id

  const [c, setC] = useState({
    ...passedContact,
    initials: passedContact.initials || toInitials(passedContact.name),
    grad: passedContact.grad || toGrad(passedContact.name),
  })
  const [notes, setNotes] = useState([])
  const [tags, setTags] = useState([])
  const [bookmarked, setBookmarked] = useState(passedContact.bookmarked || false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!contactId) return
    Promise.all([
      fetch(`${API}/api/contacts/${contactId}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/contacts/${contactId}/notes`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/contacts/${contactId}/tags`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ]).then(([contactRes, notesRes, tagsRes]) => {
      if (contactRes?.data) {
        const d = contactRes.data
        setC(prev => ({
          ...prev, ...d,
          initials: toInitials(d.name),
          grad: toGrad(d.name),
          role: [d.role, d.company].filter(Boolean).join(' · '),
        }))
        setBookmarked(d.bookmarked || false)
      }
      if (notesRes?.data) setNotes(Array.isArray(notesRes.data) ? notesRes.data : [])
      if (tagsRes?.data) setTags(Array.isArray(tagsRes.data) ? tagsRes.data.map(t => t.tag || t) : [])
    }).catch(() => {})
  }, [contactId])

  const handleAddNote = async (content) => {
    if (!contactId || !content.trim()) return
    const res = await fetch(`${API}/api/contacts/${contactId}/notes`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setNotes(n => [data, ...n])
    }
  }

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <button className="icon-btn" onClick={goBack ?? (() => navigate('home'))}>
          <ArrowLeft size={20} />
        </button>
        <span className="header-title">Contact</span>
        <button className="icon-btn">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="content" style={{ paddingTop: 8 }}>
        {/* Contact Hero */}
        <div className="card" style={{ borderRadius: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className={`avatar ${c.grad}`} style={{ width: 56, height: 56, fontSize: 16 }}>
            {c.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.3, marginBottom: 3 }}>
              {c.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>{c.role}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(99,102,241,0.1)', borderRadius: 6, padding: '3px 8px', width: 'fit-content' }}>
              <MapPin size={10} color="var(--indigo)" />
              <span style={{ fontSize: 10, color: 'var(--indigo)' }}>TechConnect Summit 2025</span>
            </div>
          </div>
          <button
            onClick={() => setBookmarked(!bookmarked)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <Bookmark size={22} fill={bookmarked ? 'var(--amber)' : 'none'} color={bookmarked ? 'var(--amber)' : 'var(--text-tertiary)'} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { icon: <MessageCircle size={20} color="var(--indigo)" />, label: 'Message', bg: 'var(--card)', onClick: () => navigate('chat', c) },
            { icon: <Mail size={20} color="var(--green)" />, label: 'Email', bg: 'var(--card)', onClick: () => window.open(`mailto:${c.email || ''}`, '_blank') },
            { icon: <Linkedin size={20} color="var(--text-secondary)" />, label: 'LinkedIn', bg: 'var(--card)', onClick: () => window.open(c.linkedinUrl || '#', '_blank') },
            { icon: <Sparkles size={20} color="var(--indigo)" />, label: 'AI Reply', bg: 'rgba(99,102,241,0.1)', labelColor: 'var(--indigo)', onClick: () => navigate('ai') },
          ].map(a => (
            <div key={a.label} onClick={a.onClick} style={{ background: a.bg, borderRadius: 14, padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
              {a.icon}
              <span style={{ fontSize: 11, fontWeight: a.labelColor ? 600 : 500, color: a.labelColor || 'var(--text-secondary)' }}>{a.label}</span>
            </div>
          ))}
        </div>

        {/* Met at */}
        {(c.met_at || c.met_location || c.met_event_name) && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.2, marginBottom: 10 }}>Met at</h3>
            <div className="card" style={{ borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.met_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                    {new Date(c.met_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })},&nbsp;
                    {new Date(c.met_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {c.met_location ? ` at ${c.met_location}` : ''}
                  </span>
                </div>
              )}
              {c.met_event_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={13} color="var(--indigo)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--indigo)', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>{c.met_event_name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.2 }}>Notes</h3>
            <button
              onClick={() => {
                const content = window.prompt('Add a note:')
                if (content) handleAddNote(content)
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--card)', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--indigo)' }}
            >
              <Plus size={12} /> Add Note
            </button>
          </div>
          {notes.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '12px 0' }}>No notes yet.</div>
          )}
          {notes.map(n => (
            <div key={n.id} className="card" style={{ borderRadius: 14, padding: 14, marginBottom: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55, marginBottom: 8 }}>{n.content}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.2 }}>Tags</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {tags.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No tags.</span>}
            {tags.map(t => (
              <span key={t} className="tag" style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* AI Follow-up */}
        <div style={{ background: 'var(--elevated)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sparkles size={15} color="var(--indigo)" />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--indigo)' }}>AI Follow-up Suggestion</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>2h ago</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55, marginBottom: 12 }}>
            "Hi Sarah, great connecting at TechConnect! I'd love to send over our API pricing deck — would a quick 20-min call this week work?"
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1, background: copied ? 'var(--green)' : 'var(--indigo)', border: 'none', borderRadius: 10, padding: '9px 0',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'background 0.2s',
              }}
            >
              <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="btn-ghost" style={{ flex: 1 }}>
              <RefreshCw size={13} /> Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
