import { Zap, ChevronDown, QrCode, Image, Sparkles, ScanLine, UserPlus, ArrowLeft } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { PLACE_TYPES } from './EventsScreen.jsx'

const API = import.meta.env.VITE_API_URL || ''

function VenueIcon({ venueType, size = 16 }) {
  const t = PLACE_TYPES.find(p => p.id === venueType)
  if (!t) return <span style={{ width: size, height: size }} />
  return <t.Icon size={size} color={t.color} />
}

const barcodeSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

function parseQRData(raw) {
  if (!raw) return {}
  if (raw.startsWith('BEGIN:VCARD')) {
    const get = (field) => { const m = raw.match(new RegExp(`${field}[^:]*:([^\\r\\n]+)`)); return m?.[1]?.trim() || '' }
    return { name: get('FN') || get('N')?.replace(';',' ').trim() || 'Scanned Contact', email: get('EMAIL'), phone: get('TEL'), url: get('URL'), linkedin: get('X-SOCIALPROFILE;type=linkedin') || '' }
  }
  try {
    const u = new URL(raw)
    const name = u.pathname.split('/').filter(Boolean).pop() || 'Scanned Contact'
    return { name, url: raw }
  } catch {}
  return { name: 'Scanned Contact', notes: raw }
}

function getActiveEvent() {
  try { return JSON.parse(localStorage.getItem('netcard_active_event') || 'null') } catch { return null }
}

export default function ScanScreen({ navigate, screenData }) {
  const [scanMode, setScanMode]       = useState('qr')      // 'qr' | 'image' | 'smart'
  const [torchOn, setTorchOn]         = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [scanError, setScanError]     = useState(null)
  const [imageSrc, setImageSrc]       = useState(null)
  const [detected, setDetected]       = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const rafRef    = useRef(null)
  const fileRef   = useRef(null)
  const activeEvent = getActiveEvent()

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraReady(false)
    setTorchOn(false)
  }, [])

  const startDetectLoop = useCallback(() => {
    if (!barcodeSupported) return
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    const loop = async () => {
      if (!videoRef.current || !streamRef.current) return
      try {
        const codes = await detector.detect(videoRef.current)
        if (codes.length > 0) { handleResult(codes[0].rawValue); return }
      } catch {}
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const startCamera = useCallback(async () => {
    setScanError(null); setImageSrc(null); setDetected(false); setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      const track = stream.getVideoTracks()[0]
      const caps = track.getCapabilities?.()
      setTorchSupported(!!(caps?.torch))
      setCameraReady(true)
    } catch (e) {
      setScanError(e.name === 'NotAllowedError' ? 'Camera access denied' : 'Could not start camera')
    }
  }, [])

  useEffect(() => {
    if (scanMode === 'image') { stopCamera(); return }
    startCamera()
    return stopCamera
  }, [scanMode])

  // Start detect loop once camera is ready in QR mode
  useEffect(() => {
    if (cameraReady && scanMode === 'qr') startDetectLoop()
  }, [cameraReady, scanMode])

  const handleResult = useCallback(async (raw) => {
    setDetected(true)
    stopCamera()
    navigator.vibrate?.(150)

    const parsed = parseQRData(raw)

    // Auto-save to backend — fire and forget; navigate with whatever we have
    const isVCard  = raw.startsWith('BEGIN:VCARD')
    const payload  = isVCard
      ? { raw_vcard: raw }
      : { ...parsed, qr_data: raw }

    let savedContact = null
    try {
      const r = await fetch(`${API}/api/contacts/scan`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await r.json()
      if (d.success) savedContact = d.data
    } catch {}

    setTimeout(() => navigate('contact', savedContact ?? parsed), 400)
  }, [navigate, stopCamera])

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn(v => !v)
    } catch {}
  }

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    e.target.value = ''
    const url = URL.createObjectURL(file)
    setImageSrc(url); setScanError(null); setDetected(false)
    if (!barcodeSupported) { setScanError('QR detection not supported on this browser'); return }
    try {
      const img = new window.Image(); img.src = url; await img.decode()
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      const codes = await detector.detect(img)
      URL.revokeObjectURL(url)
      if (codes.length) handleResult(codes[0].rawValue)
      else setScanError('No QR code found — add contact manually')
    } catch { setScanError('Could not read image') }
  }

  const captureFrame = async () => {
    const v = videoRef.current; if (!v || !cameraReady) return
    setAiProcessing(true)
    const canvas = Object.assign(document.createElement('canvas'), { width: v.videoWidth, height: v.videoHeight })
    canvas.getContext('2d').drawImage(v, 0, 0)
    if (barcodeSupported) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        const codes = await detector.detect(canvas)
        setAiProcessing(false)
        if (codes.length) { handleResult(codes[0].rawValue); return }
      } catch {}
    }
    setAiProcessing(false)
    setImageSrc(canvas.toDataURL())
    setScanError('No QR detected')
  }

  const cornerStyle = (pos) => ({
    position:'absolute', width:36, height:36,
    borderColor: detected ? 'var(--green)' : 'var(--green)',
    ...(pos.top    !== undefined && { top:    pos.top    }),
    ...(pos.bottom !== undefined && { bottom: pos.bottom }),
    ...(pos.left   !== undefined && { left:   pos.left   }),
    ...(pos.right  !== undefined && { right:  pos.right  }),
    borderStyle:'solid', borderWidth:0,
    ...(pos.top    !== undefined && pos.left  !== undefined && { borderTopWidth:3,    borderLeftWidth:3,  borderRadius:'8px 0 0 0' }),
    ...(pos.top    !== undefined && pos.right !== undefined && { borderTopWidth:3,    borderRightWidth:3, borderRadius:'0 8px 0 0' }),
    ...(pos.bottom !== undefined && pos.left  !== undefined && { borderBottomWidth:3, borderLeftWidth:3,  borderRadius:'0 0 0 8px' }),
    ...(pos.bottom !== undefined && pos.right !== undefined && { borderBottomWidth:3, borderRightWidth:3, borderRadius:'0 0 8px 0' }),
    transition: 'border-color 0.2s',
  })

  const MODES = [
    { id:'qr',    icon:<QrCode size={14}/>,   label:'QR Code'  },
    { id:'image', icon:<Image size={14}/>,    label:'Image'    },
    { id:'smart', icon:<Sparkles size={14}/>, label:'Smart AI' },
  ]

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
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none"/>
            <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px 6px' }}>
        {screenData?.returnTo && (
          <button
            onClick={() => navigate(screenData.returnTo, screenData.returnData)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px 4px 0', display:'flex', alignItems:'center', color:'var(--text-primary)', flexShrink:0 }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <span style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:600, letterSpacing:-0.5, color:'var(--text-primary)' }}>Scan to Connect</span>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageFile}/>

      {/* Active Place Banner */}
      <div style={{ margin:'4px 20px 10px', background:'var(--card)', borderRadius:12, padding:'9px 14px', display:'flex', alignItems:'center', gap:8 }}>
        {activeEvent
          ? <VenueIcon venueType={activeEvent.venue_type} size={16} />
          : <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--text-muted)', flexShrink:0 }}/>
        }
        <span style={{ flex:1, fontSize:13, fontWeight:500, color:'var(--text-primary)', fontFamily:'var(--font-sans)' }}>
          {activeEvent ? activeEvent.name : 'No active place'}
        </span>
        {activeEvent && <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', flexShrink:0, boxShadow:'0 0 6px var(--green)' }}/>}
        <ChevronDown size={16} color="var(--text-secondary)"/>
      </div>

      {/* Camera / Image Viewport */}
      <div style={{ flex:1, margin:'0 20px', borderRadius:24, overflow:'hidden', position:'relative', background:'#0d0d12', display:'flex', alignItems:'center', justifyContent:'center' }}>

        {/* Video element (hidden when showing image) */}
        {scanMode !== 'image' && !imageSrc && (
          <video ref={videoRef} playsInline muted style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
        )}

        {/* Image preview (image mode or smart-capture fallback) */}
        {imageSrc && (
          <img src={imageSrc} alt="scan preview" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
        )}

        {/* Dark overlay when no camera and no image */}
        {scanMode === 'image' && !imageSrc && (
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0d0d15,#111118)' }}>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04 }}>
              <defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)"/>
            </svg>
          </div>
        )}

        {/* Error / unsupported banner */}
        {(scanError || (!barcodeSupported && scanMode !== 'image')) && (
          <div style={{ position:'absolute', top:16, left:16, right:16, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:12, padding:'10px 14px', textAlign:'center', zIndex:10 }}>
            <div style={{ fontSize:12, color:'#EF4444', fontFamily:'var(--font-sans)', fontWeight:500 }}>
              {scanError || 'QR scanning requires Chrome 83+ or Safari 17+'}
            </div>
            {(scanError?.includes('No QR') || scanError?.includes('No QR detected')) && (
              <button onClick={() => { setScanError(null); setImageSrc(null); navigate('contact', {}) }} style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:5, background:'var(--indigo)', border:'none', borderRadius:8, padding:'6px 14px', color:'#fff', fontSize:12, fontWeight:600, fontFamily:'var(--font-sans)', cursor:'pointer' }}>
                <UserPlus size={12}/> Add Contact Manually
              </button>
            )}
          </div>
        )}

        {/* QR / Smart mode overlay */}
        {(scanMode === 'qr' || (scanMode === 'smart' && !imageSrc)) && (
          <div style={{ position:'relative', width:240, height:240 }}>
            <div style={cornerStyle({ top:0,    left:0  })}/>
            <div style={cornerStyle({ top:0,    right:0 })}/>
            <div style={cornerStyle({ bottom:0, left:0  })}/>
            <div style={cornerStyle({ bottom:0, right:0 })}/>
            <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.02)', borderRadius:16 }}/>
            {!detected && cameraReady && (
              <div className="scan-line" style={{ position:'absolute', left:10, right:10, height:2, background:'linear-gradient(90deg,transparent,var(--green),transparent)', borderRadius:1, boxShadow:'0 0 8px var(--green)' }}/>
            )}
            {detected && (
              <div style={{ position:'absolute', inset:0, background:'rgba(50,213,131,0.15)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:40 }}>✓</span>
              </div>
            )}
          </div>
        )}

        {/* Image mode — pick photo CTA */}
        {scanMode === 'image' && !imageSrc && !scanError && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:24 }}>
            <div style={{ width:72, height:72, borderRadius:20, background:'rgba(99,102,241,0.12)', border:'2px dashed rgba(99,102,241,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Image size={28} color="var(--indigo)"/>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-serif)', marginBottom:4 }}>Select a Photo</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-sans)' }}>Choose an image from your library to scan</div>
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ background:'var(--indigo)', border:'none', borderRadius:12, padding:'10px 24px', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'var(--font-sans)', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <Image size={14}/> Choose Photo
            </button>
          </div>
        )}

        {/* Smart AI — "AI Scanning" label */}
        {scanMode === 'smart' && cameraReady && !imageSrc && (
          <div style={{ position:'absolute', top:16, left:0, right:0, display:'flex', justifyContent:'center' }}>
            <div style={{ background:'rgba(139,92,246,0.2)', border:'1px solid rgba(139,92,246,0.4)', borderRadius:20, padding:'4px 12px', display:'flex', alignItems:'center', gap:6 }}>
              <span className="pulse" style={{ width:6, height:6, borderRadius:'50%', background:'#8B5CF6', display:'inline-block' }}/>
              <span style={{ fontSize:11, fontWeight:600, color:'#c4b5fd', fontFamily:'var(--font-sans)', letterSpacing:0.3 }}>AI Scanning…</span>
            </div>
          </div>
        )}
        {aiProcessing && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid #8B5CF6', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
            <span style={{ fontSize:13, color:'#fff', fontFamily:'var(--font-sans)', fontWeight:500 }}>Analysing…</span>
          </div>
        )}

        {/* Hint text */}
        {scanMode === 'qr' && !scanError && (
          <p style={{ position:'absolute', bottom:18, left:0, right:0, textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.35)', fontFamily:'var(--font-sans)' }}>
            Point camera at a QR code
          </p>
        )}

        {/* Camera error state */}
        {scanMode !== 'image' && !cameraReady && !scanError && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, opacity:0.4 }}>
            <ScanLine size={32} color="var(--text-muted)"/>
            <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-sans)' }}>Starting camera…</span>
          </div>
        )}

        {/* ── BOTTOM CONTROLS OVERLAY (always visible inside camera) ── */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent, rgba(0,0,0,0.85) 30%)', paddingTop:40, paddingBottom:88 }}>
          {/* Mode selector */}
          <div style={{ display:'flex', gap:6, padding:'0 14px 10px' }}>
            {MODES.map(m => (
              <button key={m.id}
                onClick={() => { setScanMode(m.id); setScanError(null); setImageSrc(null); setDetected(false) }}
                style={{ flex:1, padding:'8px 4px', border:`1.5px solid ${scanMode===m.id?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.15)'}`, borderRadius:10, cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:11, fontWeight:scanMode===m.id?700:500, background:scanMode===m.id?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.05)', color:scanMode===m.id?'#fff':'rgba(255,255,255,0.5)', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all 0.15s' }}>
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
          {/* Action row: Torch | [Capture for smart] | Image picker */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px' }}>
            {/* Torch */}
            <button onClick={toggleTorch}
              style={{ width:44, height:44, borderRadius:'50%', border:'none', background:torchOn?'rgba(255,214,10,0.2)':'rgba(255,255,255,0.1)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: (scanMode==='image'||!torchSupported)&&!torchOn ? 0.35 : 1 }}
              title={torchSupported ? 'Toggle torch' : 'Torch not available'}>
              <Zap size={20} color={torchOn?'#FFD60A':'#fff'} fill={torchOn?'#FFD60A':'none'}/>
            </button>
            {/* Center: capture button for smart mode */}
            {scanMode === 'smart' && cameraReady && !aiProcessing && !imageSrc && (
              <button onClick={captureFrame}
                style={{ width:60, height:60, borderRadius:'50%', border:'3px solid #fff', background:'rgba(139,92,246,0.3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Sparkles size={24} color="#fff"/>
              </button>
            )}
            {scanMode !== 'smart' && <div style={{ width:60 }}/>}
            {aiProcessing && <div style={{ width:60, height:60, borderRadius:'50%', border:'3px solid #8B5CF6', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>}
            {/* Image picker */}
            <button onClick={() => fileRef.current?.click()}
              style={{ width:44, height:44, borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.1)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Image size={20} color="#fff"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
