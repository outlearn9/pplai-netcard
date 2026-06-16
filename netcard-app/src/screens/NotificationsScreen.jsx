import { apiFetch } from '../lib/apiFetch'
import { ArrowLeft, Bell, MessageSquare, Sparkles, Calendar, UserCheck, Zap, Loader } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || ''

// ─── helpers ────────────────────────────────────────────────────────────────

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function dayLabel(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// ─── static feature notifications (always appended as background) ────────────

function featureNotifs() {
  const now = Date.now()
  const day = 86400000
  return [
    {
      id: 'feat-chats', type: 'feature',
      title: 'Chats are Live!', body: 'You can now chat with your event contacts.',
      ts: now - 2 * day, unread: false,
      action: { label: 'Start Conversations', nav: 'chatList' },
      iconBg: '#7C3AED', icon: 'chat',
    },
    {
      id: 'feat-events', type: 'feature',
      title: 'Event Qualification is here!', body: 'Set Domain, Seniority & Company criteria per event to auto-qualify leads.',
      ts: now - 3 * day, unread: false,
      action: { label: 'Open Events', nav: 'events' },
      iconBg: '#D97706', icon: 'events',
    },
    {
      id: 'feat-analytics', type: 'feature',
      title: 'Analytics are ready.', body: 'See your networking stats, pipeline health & seniority mix.',
      ts: now - 4 * day, unread: false,
      action: { label: 'View Analytics', nav: 'analytics' },
      iconBg: '#0891B2', icon: 'analytics',
    },
  ]
}

// ─── map API notification → UI shape ─────────────────────────────────────────

function mapApiNotif(n) {
  return {
    id:      n.id,
    type:    n.type,
    title:   n.title,
    body:    n.body     || '',
    ts:      new Date(n.created_at).getTime(),
    unread:  !n.read,
    icon:    n.icon     || null,
    iconBg:  n.icon_bg  || '#6B7280',
    initials: null,
    action:  n.action_nav ? { label: n.action_label || 'View', nav: n.action_nav, data: n.action_data || undefined } : null,
  }
}

// ─── icon renderer ──────────────────────────────────────────────────────────

function NotifIcon({ n }) {
  const size = 42
  const style = {
    width: size, height: size, borderRadius: '50%',
    background: n.iconBg || '#6B7280',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }

  if (n.initials) {
    return (
      <div style={style}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)' }}>{n.initials}</span>
      </div>
    )
  }

  const iconMap = {
    followup:  <Bell size={18} color="#fff" />,
    chat:      <MessageSquare size={18} color="#fff" />,
    ai:        <Sparkles size={18} color="#fff" />,
    events:    <Calendar size={18} color="#fff" />,
    analytics: <Zap size={18} color="#fff" />,
    connection:<UserCheck size={18} color="#fff" />,
  }

  return <div style={style}>{iconMap[n.icon] ?? <Bell size={18} color="#fff" />}</div>
}

// ─── main screen ────────────────────────────────────────────────────────────

export default function NotificationsScreen({ goBack, navigate }) {
  const [apiNotifs, setApiNotifs] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    apiFetch(`/api/notifications`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setApiNotifs((d.data || []).map(mapApiNotif)) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Merge API notifications with static feature ones (deduplicate by id)
  const notifs = useMemo(() => {
    const features = featureNotifs()
    const apiIds = new Set(apiNotifs.map(n => n.id))
    const merged = [...apiNotifs, ...features.filter(f => !apiIds.has(f.id))]
    merged.sort((a, b) => b.ts - a.ts)
    return merged
  }, [apiNotifs])

  const markRead = (id) => {
    // Optimistic update
    setApiNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
    // Persist to API (best-effort; feature notifs have string ids → ignored gracefully)
    apiFetch(`/api/notifications/${id}`, {
      method: 'PATCH', credentials: 'include',
    }).catch(() => {})
  }

  const markAllRead = () => {
    setApiNotifs(prev => prev.map(n => ({ ...n, unread: false })))
    apiFetch(`/api/notifications`, {
      method: 'PATCH', credentials: 'include',
    }).catch(() => {})
  }

  // group by day label
  const groups = useMemo(() => {
    const map = {}
    notifs.forEach(n => {
      const label = dayLabel(n.ts)
      if (!map[label]) map[label] = []
      map[label].push(n)
    })
    return Object.entries(map)
  }, [notifs])

  const unreadCount = notifs.filter(n => n.unread).length

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

      <div className="content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={goBack} className="icon-btn"><ArrowLeft size={18} /></button>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 500, letterSpacing: -0.8, color: 'var(--text-primary)' }}>Notifications</h1>
            {unreadCount > 0 && (
              <span style={{
                background: 'var(--indigo)', color: '#fff',
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)',
                borderRadius: 100, padding: '2px 7px', letterSpacing: 0.2,
              }}>{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{ fontSize: 12, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
            >Mark all read</button>
          )}
        </div>

        {/* Groups */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            <Bell size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
            <div>No notifications yet.</div>
          </div>
        )}

        {!loading && groups.map(([label, items]) => (
          <div key={label}>
            {/* Day label */}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2 }}>
              {label}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 18 }}>
              {items.map(n => {
                const isUnread = n.unread
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      background: isUnread ? 'rgba(99,102,241,0.06)' : 'var(--card)',
                      borderRadius: 16,
                      padding: '13px 14px',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      cursor: 'default',
                      border: isUnread ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <NotifIcon n={n} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                          <strong style={{ fontWeight: 700 }}>{n.title}</strong>
                          {' '}
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{n.body}</span>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(n.ts)}</span>
                          {isUnread && (
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--indigo)', display: 'inline-block' }} />
                          )}
                        </div>
                      </div>

                      {n.action && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(n.id); navigate(n.action.nav, n.action.data) }}
                          style={{
                            marginTop: 9,
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1.5px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: 'var(--font-sans)',
                            cursor: 'pointer',
                          }}
                        >
                          {n.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
