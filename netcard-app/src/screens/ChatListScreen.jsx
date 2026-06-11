import { Search, Edit, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || ''

const GRADS = ['grad-purple', 'grad-green', 'grad-amber', 'grad-coral', 'grad-blue']

function toInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 120) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function mapConversation(c, idx) {
  const other = c.other_participant || {}
  const name = other.name || 'Unknown'
  return {
    id: c.id,
    initials: toInitials(name),
    grad: GRADS[idx % GRADS.length],
    name,
    role: [other.role, other.company].filter(Boolean).join(' · '),
    lastMessage: c.last_message || '',
    time: formatTime(c.last_message_at),
    unread: c.unread_count || 0,
    isOnline: false,
    _raw: c,
  }
}

export default function ChatListScreen({ navigate, goBack }) {
  const [search, setSearch] = useState('')
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/conversations`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : []
        setConversations(list.map(mapConversation))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn" onClick={goBack}>
            <ArrowLeft size={18} />
          </button>
          <span className="header-title">Messages</span>
        </div>
        <button className="icon-btn">
          <Edit size={18} />
        </button>
      </div>

      <div className="content" style={{ paddingTop: 0 }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages..."
            style={{
              width: '100%', background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '10px 12px 10px 34px',
              fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Conversation list */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)', fontSize: 13 }}>
            {search ? 'No conversations match your search.' : 'No messages yet. Start a conversation from a contact.'}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => navigate('chat', c._raw || c)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'none', border: 'none', borderRadius: 16,
                padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--card)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {/* Avatar with online dot */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div className={`avatar ${c.grad}`} style={{ width: 46, height: 46, fontSize: 14, color: c.textDark ? '#0B0B0E' : '#fff' }}>
                  {c.initials}
                </div>
                {c.isOnline && (
                  <span style={{
                    position: 'absolute', bottom: 1, right: 1,
                    width: 10, height: 10, borderRadius: '50%', background: 'var(--green)',
                    border: '2px solid var(--bg)',
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: c.unread ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: 11, color: c.unread ? 'var(--indigo)' : 'var(--text-tertiary)', flexShrink: 0, marginLeft: 8, fontWeight: c.unread ? 600 : 400 }}>
                    {c.time}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 12, color: c.unread ? 'var(--text-primary)' : 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontWeight: c.unread ? 500 : 400, flex: 1,
                  }}>
                    {c.lastMessage}
                  </span>
                  {c.unread > 0 && (
                    <span style={{
                      flexShrink: 0, marginLeft: 8, minWidth: 18, height: 18, borderRadius: 9,
                      background: 'var(--indigo)', color: '#fff', fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                    }}>
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
