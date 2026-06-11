import { useState, useEffect } from 'react'
import { X, Copy, Check, MessageSquare, Mail, Share2, Download, Send, Wallet, WifiOff, Eye, Phone, Video } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const BG   = 'var(--bg)'
const CARD = 'var(--card)'
const DIV  = 'var(--border)'

/* ── Brand icons ─────────────────────────────────────── */
const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)
const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)
const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#111110">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

/* ── vCard builder ────────────────────────────────────── */
function buildVCard(profile) {
  // Pull active event from cache for meeting context
  const activeEvent = (() => {
    try { return JSON.parse(localStorage.getItem('netcard_active_event') || 'null') } catch { return null }
  })()

  const now      = new Date()
  const dateStr  = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr  = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const nameParts = (profile.name || '').split(' ')
  const lastName  = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
  const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0] || ''

  let note = `We met: ${dateStr}, ${timeStr}`
  if (activeEvent?.location) note += ` at ${activeEvent.location}`
  if (activeEvent?.name)     note += `\nEvent: ${activeEvent.name}`

  // RFC 6350: lines must end with \r\n
  const CRLF = '\r\n'
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name || ''}`,
    `N:${lastName};${firstName};;;`,
    profile.title   ? `TITLE:${profile.title}`        : null,
    profile.company ? `ORG:${profile.company}`        : null,
    profile.phone    ? `TEL;TYPE=CELL:${profile.phone}`           : null,
    profile.email    ? `EMAIL;TYPE=INTERNET:${profile.email}`     : null,
    profile.linkedin ? `URL;TYPE=linkedin:${profile.linkedin}`    : null,
    profile.web      ? `URL;TYPE=work:${profile.web}`             : null,
    `URL;TYPE=profile:https://pplai.app/u/${(profile.clerk_user_id || 'me')}`,
    `NOTE:${note.replace(/\n/g, '\\n')}`,
    'END:VCARD',
  ]
  return lines.filter(Boolean).join(CRLF) + CRLF
}

/* ── Toggle ───────────────────────────────────────────── */
function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: value ? '#34C759' : 'rgba(255,255,255,0.25)',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}

/* ── Row ──────────────────────────────────────────────── */
function Row({ icon, label, onClick, disabled, last, copied }) {
  return (
    <>
      <button
        onClick={disabled ? undefined : onClick}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', border: 'none', background: 'transparent',
          cursor: disabled ? 'default' : 'pointer', textAlign: 'left',
          opacity: disabled ? 0.3 : 1,
        }}
      >
        <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-primary)' }}>
          {copied ? <Check size={20} color="var(--green)" /> : icon}
        </div>
        <span style={{ fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontWeight: 400 }}>{label}</span>
      </button>
      {!last && <div style={{ height: 1, background: DIV, margin: '0 16px' }} />}
    </>
  )
}

/* ── Section label ───────────────────────────────────── */
function Label({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, padding: '12px 20px 4px', fontFamily: 'var(--font-sans)' }}>
      {children}
    </div>
  )
}

/* ── Offline contact preview modal ───────────────────── */
function OfflinePreviewModal({ profile, onClose }) {
  const name     = profile.name    || 'Your Name'
  const title    = profile.title   || ''
  const company  = profile.company || ''
  const phone    = profile.phone   || ''
  const email    = profile.email   || ''
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const now      = new Date()
  const dateStr  = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr  = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const activeEvent = (() => {
    try { return JSON.parse(localStorage.getItem('netcard_active_event') || 'null') } catch { return null }
  })()
  let noteText = `We met: ${dateStr}, ${timeStr}`
  if (activeEvent?.location) noteText += ` at ${activeEvent.location}`
  if (activeEvent?.name)     noteText += `\nEvent: ${activeEvent.name}`
  const userId2  = profile.clerk_user_id || 'me'
  const cardUrl  = `https://pplai.app/u/${userId2}`

  const ActionBtn = ({ icon, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(120,120,128,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        {icon}
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)' }}>{label}</span>
    </div>
  )

  const InfoRow = ({ label, value, blue }) => (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 8 }}>
      <div style={{ fontSize: 13, color: '#6B6A6F', fontFamily: 'var(--font-sans)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, color: blue ? '#007AFF' : '#111110', fontFamily: 'var(--font-sans)', fontWeight: 400 }}>{value}</div>
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, overflowY: 'auto', background: '#F2F2F7' }}>
      {/* Native-style contact hero */}
      <div style={{ background: 'linear-gradient(180deg, #8E8E93 0%, #636366 100%)', padding: '48px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, left: 16, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: '#007AFF', fontFamily: 'var(--font-sans)', fontWeight: 400 }}>
          Done
        </button>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(120,120,128,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 28, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans)' }}>{initials}</span>
        </div>
        {(title || company) && (
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>
            {[title, company].filter(Boolean).join(' · ')}
          </div>
        )}
        <div style={{ fontSize: 32, fontWeight: 300, color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: -0.5 }}>{name}</div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: 'linear-gradient(180deg, #636366 0%, #48484A 100%)' }}>
        <ActionBtn icon={<MessageSquare size={22}/>} label="message" />
        <ActionBtn icon={<Phone size={22}/>}         label="call" />
        <ActionBtn icon={<Video size={22}/>}         label="video" />
        <ActionBtn icon={<Mail size={22}/>}          label="mail" />
      </div>

      {/* Contact info */}
      <div style={{ padding: '16px 16px 40px' }}>
        {/* Contact photo row */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(120,120,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#636366' }}>{initials}</span>
          </div>
          <span style={{ fontSize: 16, color: '#111110', fontFamily: 'var(--font-sans)' }}>Contact Photo &amp; Poster</span>
        </div>

        {phone              && <InfoRow label="mobile"   value={phone}               blue />}
        {email              && <InfoRow label="email"    value={email}               blue />}
        {profile.linkedin   && <InfoRow label="LinkedIn" value={profile.linkedin}    blue />}
        {profile.web        && <InfoRow label="website"  value={profile.web}         blue />}
        <InfoRow label={`${name.split(' ')[0]}'s NetCard`} value={cardUrl} blue />
        <InfoRow label="Notes" value={noteText} />
      </div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────── */
export default function ShareCardScreen({ navigate, goBack }) {
  const [offline, setOffline]         = useState(!navigator.onLine)
  const [offlineMode, setOfflineMode] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [toast, setToast]             = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('netcard_my_profile') || '{}') } catch { return {} }
  })()

  const userId     = profile.clerk_user_id || 'me'
  const profileUrl = `https://pplai.app/u/${userId}`
  const vcardUrl   = `${import.meta.env.VITE_API_URL ?? ''}/api/qr/${userId}?format=vcard`

  useEffect(() => {
    const on  = () => setOffline(false)
    const off = () => { setOffline(true); setOfflineMode(true) }
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const handleCopy     = () => { navigator.clipboard?.writeText(profileUrl).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleSMS      = () => window.open(`sms:?body=${encodeURIComponent(`Connect with me: ${profileUrl}`)}`, '_blank')
  const handleEmail    = () => window.open(`mailto:?subject=${encodeURIComponent('My Contact Card')}&body=${encodeURIComponent(`Hi,\n\nConnect with me:\n${profileUrl}`)}`, '_blank')
  const handleWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Connect with me on NetCard: ${profileUrl}`)}`, '_blank')
  const handleNative   = () => navigator.share?.({ title: 'My NetCard', url: profileUrl })
  const handleLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`, '_blank')
  const handleFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`, '_blank')
  const handleX        = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Connect with me: ${profileUrl}`)}`, '_blank')
  const handleSaveQR   = () => navigator.share?.({ title: 'My QR Code', url: profileUrl })
  const handleSendQR   = () => navigator.share?.({ title: 'My QR Code', text: 'Scan to connect', url: profileUrl })
  const handleWallet   = () => showToast('Add to Wallet — coming soon')

  const net = !offlineMode

  return (
    <div className="screen" style={{ background: BG, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {showPreview && <OfflinePreviewModal profile={profile} onClose={() => setShowPreview(false)} />}

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
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none"/>
            <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px 8px', position: 'relative' }}>
        <button
          onClick={goBack ?? (() => navigate('mycard'))}
          style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
        >
          <X size={15} />
        </button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
          Send Your Card
        </span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '8px 0 32px' }}>

        {/* QR hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 24px 20px' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', transition: 'box-shadow 0.2s' }}>
            <QRCodeSVG
              value={offlineMode ? buildVCard(profile) : vcardUrl}
              size={196}
              bgColor="#ffffff"
              fgColor="#000000"
              level={offlineMode ? 'M' : 'L'}
            />
          </div>
          <p style={{ textAlign: 'center', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginTop: 18, lineHeight: 1.5, fontFamily: 'var(--font-sans)', maxWidth: 260 }}>
            {offlineMode
              ? 'Scan to save contact directly to phone'
              : 'Point your camera at the QR code to receive the card'}
          </p>
          {offlineMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, background: 'rgba(50,213,131,0.12)', borderRadius: 20, padding: '4px 10px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green-dark)', fontFamily: 'var(--font-sans)' }}>vCard • Opens in Contacts app</span>
            </div>
          )}
        </div>

        {/* ── Offline toggle — standalone card ── */}
        <div style={{ background: CARD, borderRadius: 14, margin: '0 16px 6px', padding: '13px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WifiOff size={20} color={offlineMode ? 'var(--green-dark)' : 'var(--text-muted)'} />
            </div>
            <span style={{ flex: 1, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>Share card offline</span>
            <Toggle value={offlineMode} onChange={setOfflineMode} />
          </div>
          {offlineMode && (
            <div style={{ paddingLeft: 42, marginTop: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, margin: '0 0 10px' }}>
                Share without internet. Only basic contact info will be shared.
              </p>
              <button
                onClick={() => setShowPreview(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--border)', border: 'none', borderRadius: 20, padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}
              >
                <Eye size={14} /> Preview what's shared
              </button>
            </div>
          )}
        </div>

        {/* ── Block 1: Direct (3) — most used ── */}
        <Label>Direct</Label>
        <div style={{ background: CARD, borderRadius: 14, margin: '0 16px 6px' }}>
          <Row icon={<Copy size={20}/>}          label="Copy link"         onClick={handleCopy}     disabled={false} copied={copied} />
          <Row icon={<MessageSquare size={20}/>} label="Text your card"    onClick={handleSMS}      disabled={false} />
          <Row icon={<WhatsAppIcon/>}            label="Send via WhatsApp" onClick={handleWhatsApp} disabled={!net}  last />
        </div>

        {/* ── Block 2: Email & more (2) ── */}
        <Label>More ways</Label>
        <div style={{ background: CARD, borderRadius: 14, margin: '0 16px 6px' }}>
          <Row icon={<Mail size={20}/>}   label="Email your card"  onClick={handleEmail}  disabled={false} />
          <Row icon={<Share2 size={20}/>} label="Send another way" onClick={handleNative} disabled={false} last />
        </div>

        {/* ── Block 3: Social (3) ── */}
        <Label>Post to social</Label>
        <div style={{ background: CARD, borderRadius: 14, margin: '0 16px 6px' }}>
          <Row icon={<LinkedInIcon/>}  label="Post to LinkedIn" onClick={handleLinkedIn} disabled={!net} />
          <Row icon={<FacebookIcon/>}  label="Post on Facebook" onClick={handleFacebook} disabled={!net} />
          <Row icon={<XIcon/>}         label="Post to X"        onClick={handleX}        disabled={!net} last />
        </div>

        {/* ── Block 4: QR (3) ── */}
        <Label>QR code</Label>
        <div style={{ background: CARD, borderRadius: 14, margin: '0 16px 16px' }}>
          <Row icon={<Download size={20}/>} label="Save QR to Photos" onClick={handleSaveQR}  disabled={false} />
          <Row icon={<Send size={20}/>}     label="Send QR code"      onClick={handleSendQR}  disabled={false} />
          <Row icon={<Wallet size={20}/>}   label="Add QR to Wallet"  onClick={handleWallet}  disabled={false} last />
        </div>

        {offline && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 16px 8px' }}>
            <WifiOff size={12} color="rgba(255,181,71,0.8)" />
            <span style={{ fontSize: 11, color: 'rgba(255,181,71,0.8)', fontFamily: 'var(--font-sans)' }}>No connection — social & WhatsApp unavailable</span>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'absolute', bottom: 90, left: 20, right: 20, background: 'rgba(255,181,71,0.15)', border: '1px solid var(--amber)', borderRadius: 12, padding: '10px 14px', zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>{toast}</span>
        </div>
      )}
    </div>
  )
}
