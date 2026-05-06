/**
 * AllScreensPreview — shows every screen side-by-side at phone-shell size.
 * Navigate to this via App.jsx or open directly during development.
 */
import AuthScreen        from './AuthScreen'
import HomeScreen        from './HomeScreen'
import ScanScreen        from './ScanScreen'
import MyCardScreen      from './MyCardScreen'
import EventsScreen      from './EventsScreen'
import AddEventScreen    from './AddEventScreen'
import AIFollowupsScreen from './AIFollowupsScreen'
import ChatListScreen    from './ChatListScreen'
import ChatScreen        from './ChatScreen'
import ContactScreen     from './ContactScreen'
import AllContactsScreen from './AllContactsScreen'
import SwitchEventScreen from './SwitchEventScreen'
import ShareCardScreen   from './ShareCardScreen'

const noop = () => {}

const SCREENS = [
  { label: 'Auth / Login',   el: <AuthScreen        onAuth={noop} /> },
  { label: 'My Network',     el: <HomeScreen        navigate={noop} onMenuOpen={noop} /> },
  { label: 'Scan',           el: <ScanScreen /> },
  { label: 'My Card',        el: <MyCardScreen      navigate={noop} onMenuOpen={noop} /> },
  { label: 'Events',         el: <EventsScreen      navigate={noop} onMenuOpen={noop} /> },
  { label: 'Add Event',      el: <AddEventScreen    navigate={noop} /> },
  { label: 'AI Followups',   el: <AIFollowupsScreen navigate={noop} onMenuOpen={noop} /> },
  { label: 'Messages',       el: <ChatListScreen    navigate={noop} onMenuOpen={noop} /> },
  { label: 'Chat',           el: <ChatScreen        navigate={noop} contact={{ id:1, name:'Sarah Raines', role:'PM · Stripe', initials:'SR', grad:'grad-purple' }} /> },
  { label: 'Contact',        el: <ContactScreen     navigate={noop} contact={{ id:1, name:'Sarah Raines', role:'Product Manager', company:'Stripe', initials:'SR', grad:'grad-purple', email:'sarah@stripe.com', phone:'+1 415 555 0100' }} /> },
  { label: 'All Contacts',   el: <AllContactsScreen navigate={noop} /> },
  { label: 'Switch Event',   el: <SwitchEventScreen navigate={noop} /> },
  { label: 'Share Card',     el: <ShareCardScreen   navigate={noop} goBack={noop} /> },
]

export default function AllScreensPreview() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0B0E',
      padding: '40px 32px',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: '#fff', letterSpacing: -0.8, margin: 0 }}>
          NetCard — All Screens
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          {SCREENS.length} screens · Design preview
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(402px, 1fr))',
        gap: '48px 32px',
        alignItems: 'start',
      }}>
        {SCREENS.map(({ label, el }) => (
          <div key={label}>
            {/* Screen label */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              {label}
            </div>

            {/* Phone shell */}
            <div
              className="phone-shell"
              style={{
                position: 'relative',
                width: 402,
                height: 874,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <div style={{ position: 'absolute', inset: 0 }}>
                {el}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
