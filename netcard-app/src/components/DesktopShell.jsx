import { useState } from 'react'
import {
  Calendar, Users, QrCode, CreditCard, Sparkles,
  MessageSquare, BarChart2, UsersRound, Bell,
  LogOut, MoreHorizontal, ChevronRight,
  Shield, ArrowUpRight, ExternalLink, X,
  UserCircle, HelpCircle, Lightbulb, TrendingUp,
} from 'lucide-react'

const MAIN_TABS = [
  { id: 'events',      icon: Calendar,   label: 'Places'      },
  { id: 'allContacts', icon: Users,       label: 'Contacts'    },
  { id: 'scan',        icon: QrCode,      label: 'Scan QR',    accent: true },
  { id: 'mycard',      icon: CreditCard,  label: 'My Card'     },
  { id: 'ai',          icon: Sparkles,    label: 'AI Followups' },
]

const TOOL_TABS = [
  { id: 'chatList',  icon: MessageSquare, label: 'Messages'  },
  { id: 'crm',       icon: BarChart2,     label: 'Leads CRM' },
  { id: 'team',      icon: UsersRound,    label: 'My Team'   },
  { id: 'analytics', icon: TrendingUp,    label: 'Analytics' },
]

const PROFILE_TABS = [
  { id: 'account',   icon: UserCircle,  label: 'Account'     },
  { id: 'help',      icon: HelpCircle,  label: 'Help & Support' },
  { id: 'suggest',   icon: Lightbulb,   label: 'Suggestions' },
  { id: 'notifications', icon: Bell,    label: 'Notifications' },
]

const SCREEN_TITLES = {
  events:        'Places',
  allContacts:   'All Contacts',
  scan:          'Scan QR',
  mycard:        'My Card',
  ai:            'AI Followups',
  chatList:      'Messages',
  chat:          'Chat',
  crm:           'Leads CRM',
  team:          'My Team',
  analytics:     'Analytics',
  account:       'Account',
  help:          'Help & Support',
  suggest:       'Suggestions',
  notifications: 'Notifications',
  contact:       'Contact',
  addEvent:      'Add Place',
  switchEvent:   'Switch Event',
  shareCard:     'Share Card',
  eventContacts: 'Event Contacts',
  onboarding:    'Welcome',
  home:          'Home',
}

export default function DesktopShell({
  children,
  activeScreen,
  activeTab,
  navigate,
  onSignOut,
  unreadCount,
  isTablet,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('netcard_my_profile') || '{}') } catch { return {} }
  })()

  const name     = profile.name    || 'Your Name'
  const title    = profile.title   || ''
  const company  = profile.company || ''
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const activeEvent = (() => {
    try { return JSON.parse(localStorage.getItem('netcard_active_event') || 'null') } catch { return null }
  })()

  const allNavItems = [...MAIN_TABS, ...TOOL_TABS, ...PROFILE_TABS]
  const currentLabel = SCREEN_TITLES[activeScreen] || 'PPL AI'

  const handleNav = (id) => {
    navigate(id)
    setShowUserMenu(false)
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: 'var(--bg)',
      position: 'fixed',
      inset: 0,
    }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: isTablet ? 64 : 228,
        flexShrink: 0,
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'width 0.2s',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          height: 58,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: isTablet ? '0' : '0 16px',
          justifyContent: isTablet ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #6366F1, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700, color: '#fff',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}>P</div>
          {!isTablet && (
            <span style={{
              fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700,
              color: 'var(--text-primary)', letterSpacing: -0.3,
            }}>PPL AI</span>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {!isTablet && (
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', padding: '10px 10px 4px' }}>
              Main
            </div>
          )}
          {MAIN_TABS.map(({ id, icon: Icon, label, accent }) => {
            const isActive = activeTab === id || activeScreen === id
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                title={isTablet ? label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: isTablet ? 0 : 10,
                  padding: isTablet ? 11 : '9px 10px',
                  justifyContent: isTablet ? 'center' : 'flex-start',
                  borderRadius: 9,
                  cursor: 'pointer', textAlign: 'left',
                  border: accent ? '1px solid rgba(99,102,241,0.18)' : 'none',
                  width: '100%',
                  fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                  fontFamily: 'var(--font-sans)',
                  background: isActive
                    ? 'rgba(99,102,241,0.08)'
                    : accent
                    ? 'rgba(99,102,241,0.06)'
                    : 'transparent',
                  color: isActive ? 'var(--indigo)' : accent ? 'var(--indigo)' : 'var(--text-secondary)',
                  transition: 'background 0.1s, color 0.1s',
                  position: 'relative',
                  margin: accent ? '4px 0' : 0,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--elevated)'; if (!isActive) e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(99,102,241,0.08)' : accent ? 'rgba(99,102,241,0.06)' : 'transparent'; e.currentTarget.style.color = isActive ? 'var(--indigo)' : accent ? 'var(--indigo)' : 'var(--text-secondary)' }}
              >
                <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                {!isTablet && <span style={{ flex: 1 }}>{label}</span>}
              </button>
            )
          })}

          {!isTablet && (
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', padding: '10px 10px 4px', marginTop: 6 }}>
              Tools
            </div>
          )}
          {isTablet && <div style={{ height: 1, background: 'var(--border)', margin: '6px 8px' }} />}
          {TOOL_TABS.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id || activeScreen === id
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                title={isTablet ? label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: isTablet ? 0 : 10,
                  padding: isTablet ? 11 : '9px 10px',
                  justifyContent: isTablet ? 'center' : 'flex-start',
                  borderRadius: 9, border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  width: '100%',
                  fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                  fontFamily: 'var(--font-sans)',
                  background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                  color: isActive ? 'var(--indigo)' : 'var(--text-secondary)',
                  transition: 'background 0.1s, color 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--elevated)'; e.currentTarget.style.color = 'var(--text-primary)' }}}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(99,102,241,0.08)' : 'transparent'; e.currentTarget.style.color = isActive ? 'var(--indigo)' : 'var(--text-secondary)' }}
              >
                <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                {!isTablet && <span style={{ flex: 1 }}>{label}</span>}
              </button>
            )
          })}

          {/* Tablet: show profile-section items (Account, Help, Suggest, Notifications) as icons */}
          {isTablet && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '6px 8px' }} />
              {PROFILE_TABS.map(({ id, icon: Icon, label }) => {
                const isActive = activeScreen === id
                const showBadge = id === 'notifications'
                return (
                  <button
                    key={id}
                    onClick={() => handleNav(id)}
                    title={label}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center',
                      padding: 11,
                      borderRadius: 9, border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                      color: isActive ? 'var(--indigo)' : 'var(--text-secondary)',
                      transition: 'background 0.1s, color 0.1s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--elevated)'; e.currentTarget.style.color = 'var(--text-primary)' }}}
                    onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(99,102,241,0.08)' : 'transparent'; e.currentTarget.style.color = isActive ? 'var(--indigo)' : 'var(--text-secondary)' }}
                  >
                    <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                      <Icon size={16} />
                      {showBadge && unreadCount > 0 && (
                        <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', border: '1.5px solid var(--card)' }} />
                      )}
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </nav>

        {/* Sidebar footer — profile + sign out */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 8px 12px', position: 'relative' }}>
          {showUserMenu && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 8, right: 8,
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: '6px 0', zIndex: 200,
            }}>
              {PROFILE_TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => { handleNav(id); setShowUserMenu(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', border: 'none', background: 'transparent',
                    cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon size={15} color="var(--text-secondary)" />
                  {label}
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <button
                onClick={onSignOut}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  color: 'var(--coral)', fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,90,79,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}

          {activeEvent && !isTablet && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: 'var(--text-muted)',
              padding: '4px 10px 8px',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--green)',
                boxShadow: '0 0 0 2px rgba(50,213,131,0.25)',
                flexShrink: 0,
                animation: 'pulse 2s infinite',
              }} />
              {activeEvent.name}
            </div>
          )}

          <button
            onClick={() => setShowUserMenu(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: isTablet ? 10 : '8px 10px',
              justifyContent: isTablet ? 'center' : 'flex-start',
              borderRadius: 9, border: 'none', background: 'transparent',
              cursor: 'pointer', width: '100%', textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>{initials}</div>
            {!isTablet && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {title}{company ? ` · ${company}` : ''}
                  </div>
                </div>
                <MoreHorizontal size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          height: 58,
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20, fontWeight: 600,
            letterSpacing: -0.4, color: 'var(--text-primary)',
            flex: 1,
          }}>{currentLabel}</div>

          <div style={{
            height: 34, background: 'var(--elevated)',
            border: '1px solid var(--border)', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '0 12px', width: isTablet ? 160 : 210,
            cursor: 'text',
          }}>
            <svg width="14" height="14" style={{ color: 'var(--text-muted)', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Search…</span>
            {!isTablet && <kbd style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-sans)' }}>⌘K</kbd>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => navigate('notifications')}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'var(--elevated)', border: '1px solid var(--border)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--elevated)'}
            >
              <Bell size={15} color="var(--text-secondary)" />
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: -3, right: -3,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--coral)', color: '#fff',
                  fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--card)',
                  fontFamily: 'var(--font-sans)',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>

            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: '#fff',
              cursor: 'pointer', flexShrink: 0,
            }}
            onClick={() => setShowUserMenu(v => !v)}
            >{initials}</div>
          </div>
        </div>

        {/* Screen content — fills the rest */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
