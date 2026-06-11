import { useState, useEffect, useCallback, Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) {
    fetch('/api/crashes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message, stack: info.componentStack?.slice(0, 800), url: window.location.href }),
    }).catch(() => {})
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, padding:24, textAlign:'center', fontFamily:'var(--font-sans)' }}>
        <div style={{ fontSize:32 }}>⚠️</div>
        <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Something went wrong</div>
        <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>We&apos;ve logged this automatically.<br />Try refreshing the app.</div>
        <button
          onClick={() => this.setState({ error: null })}
          style={{ marginTop:8, padding:'10px 20px', borderRadius:10, border:'none', background:'var(--indigo)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)' }}
        >
          Try again
        </button>
      </div>
    )
  }
}
import { createPortal } from 'react-dom'
import { Users, QrCode, CreditCard, Calendar, Sparkles, MessageSquare, X, ChevronRight, UserCircle, UsersRound, BarChart2, HelpCircle, Lightbulb, LogOut, Shield, ExternalLink, ArrowUpRight, TrendingUp, Bell } from 'lucide-react'
import AllScreensPreview from './screens/AllScreensPreview'
import AuthScreen        from './screens/AuthScreen'
import { useNavigation } from './hooks/useNavigation'
import { useBreakpoint }  from './hooks/useBreakpoint'
import DesktopShell       from './components/DesktopShell'
import HomeScreen        from './screens/HomeScreen'
import ScanScreen        from './screens/ScanScreen'
import MyCardScreen      from './screens/MyCardScreen'
import EventsScreen      from './screens/EventsScreen'
import AddEventScreen    from './screens/AddEventScreen'
import ContactScreen     from './screens/ContactScreen'
import AIFollowupsScreen from './screens/AIFollowupsScreen'
import SwitchEventScreen from './screens/SwitchEventScreen'
import AllContactsScreen from './screens/AllContactsScreen'
import ChatListScreen    from './screens/ChatListScreen'
import ChatScreen        from './screens/ChatScreen'
import ShareCardScreen        from './screens/ShareCardScreen'
import AccountDetailsScreen  from './screens/AccountDetailsScreen'
import MyTeamScreen          from './screens/MyTeamScreen'
import LeadsCRMScreen        from './screens/LeadsCRMScreen'
import HelpSupportScreen     from './screens/HelpSupportScreen'
import SuggestionsScreen     from './screens/SuggestionsScreen'
import EventContactsScreen   from './screens/EventContactsScreen'
import AnalyticsScreen       from './screens/AnalyticsScreen'
import NotificationsScreen   from './screens/NotificationsScreen'
import OnboardingScreen      from './screens/OnboardingScreen'

const TABS = [
  { id: 'events',      icon: Calendar,  label: 'Events'   },
  { id: 'allContacts', icon: Users,     label: 'Contacts' },
  { id: 'scan',        icon: QrCode,    label: 'Scan',   center: true },
  { id: 'mycard',      icon: CreditCard,label: 'My Card' },
  { id: 'ai',          icon: Sparkles,  label: 'AI'       },
]

// Add new screens here only — no other file needs to change.
const makeScreenMap = (onMenuOpen) => ({
  home:        (nav) => <HomeScreen        navigate={nav.navigate} onMenuOpen={onMenuOpen} />,
  scan:        (nav) => <ScanScreen        navigate={nav.navigate} screenData={nav.screenData} />,
  mycard:      (nav) => <MyCardScreen      navigate={nav.navigate} onMenuOpen={onMenuOpen} />,
  events:      (nav) => <EventsScreen      navigate={nav.navigate} onMenuOpen={onMenuOpen} />,
  addEvent:    (nav) => <AddEventScreen    navigate={nav.navigate} event={nav.screenData} />,
  contact:     (nav) => <ContactScreen     navigate={nav.navigate} contact={nav.screenData} />,
  ai:          (nav) => <AIFollowupsScreen navigate={nav.navigate} />,
  switchEvent: (nav) => <SwitchEventScreen navigate={nav.navigate} />,
  allContacts: (nav) => <AllContactsScreen navigate={nav.navigate} />,
  chatList:    (nav) => <ChatListScreen    navigate={nav.navigate} goBack={nav.goBack} />,
  chat:        (nav) => <ChatScreen        navigate={nav.navigate} contact={nav.screenData} />,
  shareCard:      (nav) => <ShareCardScreen        navigate={nav.navigate} goBack={nav.goBack} />,
  account:        (nav) => <AccountDetailsScreen   navigate={nav.navigate} goBack={nav.goBack} />,
  team:           (nav) => <MyTeamScreen           navigate={nav.navigate} goBack={nav.goBack} />,
  crm:            (nav) => <LeadsCRMScreen         navigate={nav.navigate} goBack={nav.goBack} />,
  help:           (nav) => <HelpSupportScreen      navigate={nav.navigate} goBack={nav.goBack} />,
  suggest:        (nav) => <SuggestionsScreen      navigate={nav.navigate} goBack={nav.goBack} />,
  eventContacts:  (nav) => <EventContactsScreen    navigate={nav.navigate} goBack={nav.goBack} screenData={nav.screenData} />,
  analytics:      (nav) => <AnalyticsScreen         navigate={nav.navigate} goBack={nav.goBack} />,
  notifications:  (nav) => <NotificationsScreen    navigate={nav.navigate} goBack={nav.goBack} />,
  onboarding:     (nav) => <OnboardingScreen       navigate={nav.navigate} goBack={nav.goBack} />,
})


const CHANNEL_COLORS = { WhatsApp: '#25D366', SMS: 'var(--coral)', Email: 'var(--indigo)', Call: '#6B7280' }

// Tiny decorative QR — purely visual placeholder
function MiniQR() {
  return (
    <svg width="72" height="72" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* top-left finder */}
      <rect x="2" y="2" width="18" height="18" rx="2" fill="var(--border-strong)"/>
      <rect x="5" y="5" width="12" height="12" rx="1" fill="var(--bg)"/>
      <rect x="8" y="8" width="6" height="6" rx="0.5" fill="var(--indigo)"/>
      {/* top-right finder */}
      <rect x="32" y="2" width="18" height="18" rx="2" fill="var(--border-strong)"/>
      <rect x="35" y="5" width="12" height="12" rx="1" fill="var(--bg)"/>
      <rect x="38" y="8" width="6" height="6" rx="0.5" fill="var(--indigo)"/>
      {/* bottom-left finder */}
      <rect x="2" y="32" width="18" height="18" rx="2" fill="var(--border-strong)"/>
      <rect x="5" y="35" width="12" height="12" rx="1" fill="var(--bg)"/>
      <rect x="8" y="38" width="6" height="6" rx="0.5" fill="var(--indigo)"/>
      {/* data dots */}
      {[24,28,32,36,40].flatMap((x,xi) =>
        [24,28,32,36,40,44].map((y,yi) =>
          (xi+yi)%2===0 ? <rect key={`${x}${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="var(--border-strong)"/> : null
        )
      )}
      {[22,26,34,38].flatMap((x,xi) =>
        [22,30,42].map((y,yi) =>
          (xi*yi)%3!==1 ? <rect key={`d${x}${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="var(--text-muted)" opacity="0.5"/> : null
        )
      )}
    </svg>
  )
}

const MENU_ITEMS = [
  { id: 'account',  label: 'Account Details',  sub: 'pplai.app/u/paras', icon: UserCircle,   color: '#6366F1' },
  { id: 'chatList',  label: 'Messages',           sub: null,                     icon: MessageSquare, color: '#6366F1' },
  { id: 'analytics', label: 'Analytics',         sub: 'Your networking stats',   icon: TrendingUp,    color: '#059669' },
  { id: 'team',     label: 'My Team',           sub: null,                icon: UsersRound,    color: '#059669' },
  { id: 'crm',      label: 'Leads CRM',         sub: null,                icon: BarChart2,     color: '#D97706' },
  { id: 'help',     label: 'Help & Support',    sub: null,                icon: HelpCircle,    color: '#6B7280' },
  { id: 'suggest',  label: 'Suggestions',       sub: null,                icon: Lightbulb,     color: '#8B5CF6' },
]

function ProfileDrawer({ open, onClose, navigate, onSignOut }) {
  const [activityOpen, setActivityOpen] = useState(false)

  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('netcard_my_profile') || '{}') } catch { return {} }
  })()
  const activityLog = (() => {
    try { return JSON.parse(localStorage.getItem('netcard_sent_log') || '[]') } catch { return [] }
  })()

  const name     = profile.name    || 'Your Name'
  const title    = profile.title   || 'Your Title'
  const company  = profile.company || ''
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const grouped = activityLog.reduce((acc, e) => {
    const day = new Date(e.sentAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!acc[day]) acc[day] = []
    acc[day].push(e)
    return acc
  }, {})

  const handleNav = (id) => {
    onClose()
    navigate(id)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)', zIndex: 70,
          pointerEvents: open ? 'auto' : 'none',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.25s',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '84%',
        background: 'var(--bg)', zIndex: 71,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '4px 0 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>

        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px 0' }}>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Profile hero */}
        <div style={{ padding: '10px 14px 16px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)' }}>{initials}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.4 }}>{name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{title}{company ? ` · ${company}` : ''}</div>
            {/* Profile URL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7, background: 'rgba(99,102,241,0.08)', borderRadius: 6, padding: '4px 8px', width: 'fit-content' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--indigo)', fontFamily: 'var(--font-sans)' }}>pplai.app/u/paras</span>
              <ExternalLink size={9} color="var(--indigo)" />
            </div>
          </div>
          {/* QR tile */}
          <div style={{ background: 'var(--card)', borderRadius: 10, padding: 6, border: '1px solid var(--border)', flexShrink: 0, marginTop: 0 }}>
            <MiniQR />
            <div style={{ textAlign: 'center', fontSize: 8, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-sans)', letterSpacing: 0.2 }}>MY QR</div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 18px 6px' }} />

        {/* Menu list */}
        <div style={{ padding: '2px 10px', flex: 1 }}>
          {MENU_ITEMS.map(({ id, label, sub, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                padding: '11px 8px', borderRadius: 10, border: 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{label}</div>
                {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </button>
          ))}

          {/* Notifications */}
          <button
            onClick={() => handleNav('notifications')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 11,
              padding: '11px 8px', borderRadius: 10, border: 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
              <Bell size={16} color="#6366F1" />
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>Notifications</span>
            <ChevronRight size={14} color="var(--text-muted)" />
          </button>

          {/* Divider before destructive */}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 8px' }} />

          {/* Sign out */}
          <button
            onClick={onSignOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 11,
              padding: '11px 8px', borderRadius: 10, border: 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,90,79,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(232,90,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogOut size={16} color="var(--coral)" />
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--coral)', fontFamily: 'var(--font-sans)' }}>Sign Out</span>
          </button>
        </div>

        {/* Activity log (collapsible) */}
        {activityLog.length > 0 && (
          <>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 18px' }} />
            <div style={{ padding: '0 10px 4px' }}>
              <button
                onClick={() => setActivityOpen(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.6, textTransform: 'uppercase' }}>Activity Log</span>
                <ChevronRight size={13} color="var(--text-muted)" style={{ transform: activityOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {activityOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 10 }}>
                  {Object.entries(grouped).map(([day, entries]) => (
                    <div key={day}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.4, marginBottom: 6, padding: '0 8px' }}>{day}</div>
                      {entries.map(entry => (
                        <div key={entry.logId} style={{ background: 'var(--card)', borderRadius: 10, padding: '9px 10px', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div className={`avatar ${entry.grad}`} style={{ width: 26, height: 26, fontSize: 9, color: entry.textDark ? '#0B0B0E' : '#fff', flexShrink: 0 }}>{entry.initials}</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{entry.name}</div>
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: CHANNEL_COLORS[entry.channel] || 'var(--indigo)', borderRadius: 100, padding: '2px 7px' }}>{entry.channel}</span>
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{entry.message}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <button
          onClick={() => window.open('https://pplai.app/legal', '_blank')}
          style={{ padding: '8px 18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}
        >
          <Shield size={10} color="var(--text-muted)" />
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Terms & Privacy · v1.0.0</span>
          <ArrowUpRight size={10} color="var(--text-muted)" />
        </button>
      </div>
    </>
  )
}

const API = import.meta.env.VITE_API_URL || ''

const SAMPLE_CRM_LEADS = [
  { id: 's1', name: 'Sarah Raines',  company: 'Stripe',          role: 'Product Manager',    seniority: 'Decision Maker', stage: 'qualified', event: 'TechConnect Summit 2025', tags: ['#fintech','#hot-lead'], notes: 'Evaluating AI-first CRM tools. Send pricing deck.', bookmarked: true,  grad: 'grad-purple', initials: 'SR', textDark: false },
  { id: 's2', name: 'Marcus Kim',    company: 'Linear',           role: 'Head of Engineering', seniority: 'Key Influencer', stage: 'contacted', event: 'TechConnect Summit 2025', tags: ['#devtools','#api'],     notes: 'Interested in integration possibilities.',         bookmarked: false, grad: 'grad-green',  initials: 'MK', textDark: true  },
  { id: 's3', name: 'Anika Torres',  company: 'Bloom AI',         role: 'Founder & CEO',       seniority: 'CXO',            stage: 'new',       event: 'AI Founders Mixer — NYC', tags: ['#seed','#ai'],         notes: 'Pre-seed. Needs investor intro to Raj.',           bookmarked: true,  grad: 'grad-amber',  initials: 'AT', textDark: true  },
  { id: 's4', name: 'Raj Joshi',     company: 'Sequoia Capital',  role: 'Principal',            seniority: 'Decision Maker', stage: 'proposal',  event: 'AI Founders Mixer — NYC', tags: ['#vc','#seed'],         notes: 'Shared deck. Waiting for Q2 calendar slot.',      bookmarked: true,  grad: 'grad-purple', initials: 'RJ', textDark: false },
  { id: 's5', name: 'Lena Park',     company: 'Figma',            role: 'Head of Design',       seniority: 'Key Influencer', stage: 'won',       event: 'SaaS Growth Summit',      tags: ['#design','#ux'],       notes: 'Agreed to design partner pilot. Start Aug.',      bookmarked: true,  grad: 'grad-green',  initials: 'LP', textDark: true  },
  { id: 's6', name: 'Devon Shaw',    company: 'Salesforce',       role: 'VP of Sales',          seniority: 'Decision Maker', stage: 'contacted', event: 'SaaS Growth Summit',      tags: ['#crm','#partnership'], notes: 'Partnership angle for AI automation layer.',      bookmarked: false, grad: 'grad-amber',  initials: 'DS', textDark: true  },
]

export default function App() {
  const nav = useNavigation()
  const bp = useBreakpoint()
  const isWide = bp === 'desktop' || bp === 'tablet'
  const isTablet = bp === 'tablet'
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('netcard_authed'))
  const [showProfile, setShowProfile] = useState(false)
  const [shellEl, setShellEl] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [incompleteFields, setIncompleteFields] = useState([])
  const SCREEN_MAP = makeScreenMap(() => setShowProfile(true))
  // Pass incompleteFields to mycard so it can show fill-in prompt
  const screenMapWithCard = {
    ...SCREEN_MAP,
    mycard: (nav) => <MyCardScreen navigate={nav.navigate} onMenuOpen={() => setShowProfile(true)} incompleteFields={incompleteFields} onFieldsFilled={() => setIncompleteFields([])} />,
  }
  const renderScreen = screenMapWithCard[nav.screen] ?? screenMapWithCard.home

  // Poll unread notifications count every 60s
  const fetchUnread = useCallback(() => {
    fetch(`${API}/api/notifications`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) setUnreadCount((d.data || []).filter(n => !n.read_at).length)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchUnread()
    const id = setInterval(fetchUnread, 60000)
    return () => clearInterval(id)
  }, [authed, fetchUnread])

  /**
   * After auth: decide whether to show onboarding (new user) or go straight to
   * the card (returning/existing user).
   *
   * Strategy:
   *  1. If onboarding was already completed on this device → do nothing extra.
   *  2. Otherwise fetch /api/profile:
   *     - Profile has a name  → existing user. Mark complete, stay on home/mycard.
   *       Also detect which optional fields are still empty and store them so
   *       MyCardScreen can show a completion prompt.
   *     - Profile has no name → brand-new user. Navigate to onboarding.
   *     - Network error       → fall back to onboarding so new users aren't stuck.
   */
  useEffect(() => {
    if (!authed) return
    if (localStorage.getItem('netcard_onboarding_complete')) return

    fetch(`${API}/api/profile`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        const profile = d?.data || {}
        if (profile.name) {
          // ── Returning / existing user ──────────────────────────────────────
          // Persist profile to localStorage so UI can render without extra API calls
          const cached = (() => { try { return JSON.parse(localStorage.getItem('netcard_my_profile') || '{}') } catch { return {} } })()
          localStorage.setItem('netcard_my_profile', JSON.stringify({
            name:     profile.name     || cached.name     || '',
            title:    profile.role     || cached.title    || '',
            company:  profile.company  || cached.company  || '',
            email:    profile.email    || cached.email    || '',
            phone:    profile.phone    || cached.phone    || '',
            linkedin: profile.linkedin_url || cached.linkedin || '',
            web:      profile.website  || cached.web      || '',
            seeking:  profile.seeking  || cached.seeking  || '',
            offering: profile.offering || cached.offering || '',
          }))

          // Figure out which profile fields are still missing
          const missing = []
          if (!profile.role)         missing.push('title')
          if (!profile.company)      missing.push('company')
          if (!profile.phone)        missing.push('phone')
          if (!profile.linkedin_url) missing.push('linkedin')
          if (!profile.seeking)      missing.push('seeking')
          if (!profile.offering)     missing.push('offering')
          setIncompleteFields(missing)

          // Mark onboarding done so we never re-check on this device
          localStorage.setItem('netcard_onboarding_complete', '1')
          // Navigate to their card rather than onboarding
          nav.navigate('mycard')
        } else {
          // ── Brand-new user ─────────────────────────────────────────────────
          nav.navigate('onboarding')
        }
      })
      .catch(() => {
        // Network error: if we have no cached profile at all, send to onboarding
        // so a new user isn't stuck; if there's a cached profile they're returning.
        const cached = (() => { try { return JSON.parse(localStorage.getItem('netcard_my_profile') || '{}') } catch { return {} } })()
        if (cached.name) {
          localStorage.setItem('netcard_onboarding_complete', '1')
          nav.navigate('mycard')
        } else {
          nav.navigate('onboarding')
        }
      })
  }, [authed])

  // Seed sample data once per device after first auth
  useEffect(() => {
    if (!authed) return
    if (localStorage.getItem('netcard_seed_attempted')) return
    localStorage.setItem('netcard_seed_attempted', '1')
    fetch(`${API}/api/onboarding/seed`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(d => {
        // If freshly seeded, also populate localStorage-based CRM with sample leads
        if (d?.data?.seeded) {
          try {
            const existing = JSON.parse(localStorage.getItem('netcard_crm_leads') || '[]')
            if (existing.length === 0) {
              localStorage.setItem('netcard_crm_leads', JSON.stringify(SAMPLE_CRM_LEADS))
            }
          } catch {}
        }
      })
      .catch(() => {})
  }, [authed])

  // Global crash handler — reports unhandled JS errors to /api/crashes
  useEffect(() => {
    const handler = (event) => {
      const payload = {
        error: event.message || String(event.error) || 'Unknown error',
        stack: event.error?.stack,
        url:   window.location.href,
        ua:    navigator.userAgent,
      }
      fetch(`${API}/api/crashes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    }
    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])

  // Preview mode: http://localhost:5173/?preview
  if (new URLSearchParams(window.location.search).has('preview')) {
    return <AllScreensPreview />
  }

  if (!authed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
        <div className="phone-shell">
          <ErrorBoundary>
            <AuthScreen onAuth={() => { localStorage.setItem('netcard_authed', '1'); setAuthed(true) }} />
          </ErrorBoundary>
        </div>
      </div>
    )
  }

  // ── Desktop / Tablet layout ──────────────────────────────────────────────
  if (isWide) {
    return (
      <DesktopShell
        activeScreen={nav.screen}
        activeTab={nav.activeTab}
        navigate={nav.navigate}
        onSignOut={() => { localStorage.removeItem('netcard_authed'); setAuthed(false) }}
        unreadCount={unreadCount}
        isTablet={isTablet}
      >
        <div key={nav.screen} className="screen-enter" style={{ position: 'absolute', inset: 0 }}>
          <ErrorBoundary>
            {renderScreen(nav)}
          </ErrorBoundary>
        </div>
      </DesktopShell>
    )
  }

  // ── Mobile layout (phone shell) ───────────────────────────────────────────
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 600px 400px at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }} />

      <div className="phone-shell" ref={setShellEl}>
        <div key={nav.screen} className="screen-enter" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <ErrorBoundary>
            {renderScreen(nav)}
          </ErrorBoundary>
        </div>

        {/* Persistent bell — visible on all tab screens */}
        {nav.showTabBar && (
          <button
            onClick={() => nav.navigate('notifications')}
            style={{
              position: 'absolute', top: 10, right: 14, zIndex: 15,
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--card)', border: '1px solid var(--border)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Bell size={16} color="var(--text-secondary)" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 16, height: 16, borderRadius: 8,
                background: 'var(--coral)', color: '#fff',
                fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-sans)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', border: '1.5px solid var(--bg)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {nav.showTabBar && (
          <div className="tab-bar" style={{ zIndex: 50 }}>
            <div className="tab-pill">
              {TABS.map(t => {
                const Icon = t.icon
                const isActive = nav.activeTab === t.id

                if (t.center) {
                  return (
                    <button
                      key={t.id}
                      onClick={() => nav.navigate(t.id)}
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'flex-end',
                        border: 'none', background: 'transparent',
                        cursor: 'pointer', paddingBottom: 6, position: 'relative',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: -28,
                        width: 58, height: 58, borderRadius: '50%',
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(124,58,237,0.25))'
                          : 'rgba(99,102,241,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `2.5px solid ${isActive ? 'var(--indigo)' : 'rgba(99,102,241,0.35)'}`,
                        boxShadow: isActive ? '0 0 0 4px rgba(99,102,241,0.1)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: isActive ? 'var(--indigo)' : 'var(--bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}>
                          <Icon size={20} color={isActive ? '#fff' : 'var(--indigo)'} />
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: isActive ? 'var(--indigo)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-sans)',
                        marginTop: 34,
                      }}>Scan</span>
                    </button>
                  )
                }

                return (
                  <button
                    key={t.id}
                    onClick={() => nav.navigate(t.id)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 4, border: 'none', background: 'transparent',
                      cursor: 'pointer', paddingBottom: 2,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      transition: 'color 0.15s',
                    }}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                    <span style={{
                      fontSize: 10,
                      fontWeight: isActive ? 700 : 500,
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: 0.1,
                    }}>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {shellEl && createPortal(
          <ProfileDrawer
            open={showProfile}
            onClose={() => setShowProfile(false)}
            navigate={nav.navigate}
            onSignOut={() => { localStorage.removeItem('netcard_authed'); setAuthed(false); setShowProfile(false) }}
          />,
          shellEl
        )}
      </div>
    </div>
  )
}
