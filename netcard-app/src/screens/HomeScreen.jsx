import { Users, Bell, MapPin, Calendar, Bookmark, FileText, Phone, MessageCircle, Menu } from 'lucide-react'

const contacts = [
  {
    id: 1, initials: 'SR', grad: 'grad-purple',
    name: 'Sarah Raines', role: 'Product Manager · Stripe',
    mode: 'Seeking', modeBg: 'rgba(99,102,241,0.12)', modeColor: '#6366F1',
    tags: ['#fintech', '#product'], bookmarked: true,
  },
  {
    id: 2, initials: 'MK', grad: 'grad-green', textDark: true,
    name: 'Marcus Kim', role: 'Head of Eng · Linear',
    mode: 'Offering', modeBg: 'rgba(50,213,131,0.12)', modeColor: '#32D583',
    tags: ['#devtools', '#saas'], bookmarked: false,
  },
  {
    id: 3, initials: 'AT', grad: 'grad-amber',
    name: 'Anika Torres', role: 'Founder · Bloom AI',
    mode: 'Seeking', modeBg: 'rgba(99,102,241,0.12)', modeColor: '#6366F1',
    tags: ['#ai', '#seed'], bookmarked: false,
  },
]

/**
 * @component HomeScreen
 * @description Primary dashboard view for the networker application.
 * Manages the top-level dispatch routing context passed via the `navigate` prop.
 */
export default function HomeScreen({ navigate, onMenuOpen }) {
  return (
    <div className="screen">
      {/* Status bar */}
      <div className="status-bar">
        <span className="status-time">9:41</span>
        <div className="status-icons">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
            <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/>
            <rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/>
            <rect x="9" y="0" width="3" height="12" rx="1" opacity="0.8"/>
            <rect x="13.5" y="0" width="3" height="12" rx="1"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
            <path d="M8 2.4C9.9 2.4 11.6 3.1 12.9 4.3L14.4 2.8C12.7 1.2 10.5 0.2 8 0.2C5.5 0.2 3.3 1.2 1.6 2.8L3.1 4.3C4.4 3.1 6.1 2.4 8 2.4Z" opacity="0.5"/>
            <path d="M8 5.2C9.3 5.2 10.5 5.7 11.4 6.5L12.9 5C11.6 3.9 9.9 3.2 8 3.2C6.1 3.2 4.4 3.9 3.1 5L4.6 6.5C5.5 5.7 6.7 5.2 8 5.2Z" opacity="0.75"/>
            <path d="M8 8C8.8 8 9.5 8.3 10.1 8.8L8 11L5.9 8.8C6.5 8.3 7.2 8 8 8Z"/>
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none"/>
            <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/>
            <path d="M23 4v4a2 2 0 000-4z" fill="currentColor" opacity="0.4"/>
          </svg>
        </div>
      </div>

      <div className="content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onMenuOpen} className="icon-btn"><Menu size={18} /></button>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 500, letterSpacing: -0.8, color: 'var(--text-primary)' }}>My Network</h1>
          </div>
          <button className="icon-btn" onClick={() => navigate('notifications')}><Bell size={20} /></button>
        </div>

        {/* Active Event Card */}
        <div className="card" style={{ background: 'var(--card)', borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(50,213,131,0.12)', borderRadius: 100, padding: '4px 10px' }}>
              <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: 0.6 }}>ACTIVE EVENT</span>
            </div>
            <button onClick={() => navigate('switchEvent')} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--elevated)', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              Switch
            </button>
          </div>

          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.3, marginBottom: 8 }}>
            TechConnect Summit 2025
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 12 }}>
              <MapPin size={12} /> Moscone Center, SF
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 12 }}>
              <Calendar size={12} /> Mar 31 – Apr 1
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: '24', label: 'Contacts', color: 'var(--green)' },
              { val: '8', label: 'Follow-ups', color: 'var(--indigo)' },
              { val: '3', label: 'Bookmarked', color: 'var(--coral)' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'var(--elevated)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: -0.5 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Added */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.2 }}>
              Recently Added
            </h2>
            <span onClick={() => navigate('allContacts')} style={{ fontSize: 13, fontWeight: 500, color: 'var(--indigo)', cursor: 'pointer' }}>See All</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {contacts.map(c => (
              <div
                key={c.id}
                className="card"
                onClick={() => navigate('contact', c)}
                style={{ borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'opacity 0.15s' }}
              >
                <div className={`avatar ${c.grad}`} style={{ width: 44, height: 44, fontSize: 14, color: c.textDark ? '#0B0B0E' : '#fff' }}>
                  {c.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={e => e.stopPropagation()} style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(99,102,241,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="#6366F1"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                      </button>
                      <button onClick={e => e.stopPropagation()} style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(50,213,131,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Phone size={11} color="var(--green)" />
                      </button>
                      <button onClick={e => e.stopPropagation()} style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(232,90,79,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={11} color="var(--coral)" />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>{c.role}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {c.tags.map(t => <span key={t} className="tag" style={{ fontSize: 10, padding: '2px 8px' }}>{t}</span>)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <Bookmark size={17} fill={c.bookmarked ? 'var(--amber)' : 'none'} color={c.bookmarked ? 'var(--amber)' : 'var(--text-tertiary)'} />
                  <FileText size={17} color="var(--text-tertiary)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar injected by parent */}
    </div>
  )
}
