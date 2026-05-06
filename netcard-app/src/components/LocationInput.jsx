import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader } from 'lucide-react'

// ── Google Maps (optional — only if VITE_GOOGLE_PLACES_API_KEY is set) ────────
const GMAPS_SCRIPT_ID = 'google-maps-places'

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) { resolve(); return }
    if (document.getElementById(GMAPS_SCRIPT_ID)) {
      const iv = setInterval(() => { if (window.google?.maps?.places) { clearInterval(iv); resolve() } }, 80)
      return
    }
    const s = document.createElement('script')
    s.id = GMAPS_SCRIPT_ID
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    s.async = true; s.defer = true
    s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

// ── OpenStreetMap Nominatim (free, no key needed) ─────────────────────────────
async function nominatimSearch(input) {
  const url = `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({ q: input, format: 'json', addressdetails: '1', limit: '6', dedupe: '1', 'accept-language': 'en' })
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  if (!res.ok) return []
  const data = await res.json()
  return data.map(r => {
    const parts = r.display_name.split(', ')
    return {
      place_id:  r.place_id,
      main:      r.name || parts[0] || r.display_name,
      secondary: parts.slice(1).join(', '),
      full:      r.display_name,
    }
  })
}

export default function LocationInput({ value, onChange, placeholder, accentColor, style }) {
  const googleKey    = import.meta.env.VITE_GOOGLE_PLACES_API_KEY
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]               = useState(false)
  const [busy, setBusy]               = useState(false)
  const [cursor, setCursor]           = useState(0)
  const [provider, setProvider]       = useState('nominatim') // 'google' | 'nominatim'
  const debounceRef  = useRef(null)
  const googleSvcRef = useRef(null)
  const inputRef     = useRef(null)
  const listRef      = useRef(null)

  // Load Google Maps if API key is available
  useEffect(() => {
    if (!googleKey) return
    loadGoogleMaps(googleKey)
      .then(() => {
        googleSvcRef.current = new window.google.maps.places.AutocompleteService()
        setProvider('google')
      })
      .catch(() => {}) // fall back to Nominatim silently
  }, [googleKey])

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (!inputRef.current?.closest('[data-loc-input]')?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const queryGoogle = useCallback((input) => {
    if (!googleSvcRef.current || !input || input.length < 2) { setSuggestions([]); setOpen(false); return }
    setBusy(true)
    googleSvcRef.current.getPlacePredictions(
      { input, types: ['establishment', 'geocode'] },
      (preds, status) => {
        setBusy(false)
        if (status === window.google.maps.places.PlacesServiceStatus.OK && preds?.length) {
          setSuggestions(preds.map(p => ({
            place_id:  p.place_id,
            main:      p.structured_formatting?.main_text ?? p.description,
            secondary: p.structured_formatting?.secondary_text ?? '',
            full:      p.description,
          })))
          setOpen(true); setCursor(0)
        } else { setSuggestions([]); setOpen(false) }
      }
    )
  }, [])

  const queryNominatim = useCallback(async (input) => {
    if (!input || input.length < 2) { setSuggestions([]); setOpen(false); return }
    setBusy(true)
    try {
      const results = await nominatimSearch(input)
      setBusy(false)
      if (results.length) { setSuggestions(results); setOpen(true); setCursor(0) }
      else { setSuggestions([]); setOpen(false) }
    } catch { setBusy(false); setSuggestions([]); setOpen(false) }
  }, [])

  const query = provider === 'google' ? queryGoogle : queryNominatim

  const handleChange = e => {
    onChange(e.target.value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => query(e.target.value), 350)
  }

  const pick = s => {
    onChange(s.full)
    setSuggestions([]); setOpen(false)
    inputRef.current?.blur()
  }

  const handleKey = e => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && suggestions[cursor]) { e.preventDefault(); pick(suggestions[cursor]) }
    if (e.key === 'Escape') setOpen(false)
  }

  const color = accentColor ?? 'var(--text-secondary)'

  return (
    <div data-loc-input style={{ position: 'relative', ...style }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <MapPin size={14} style={{ position: 'absolute', left: 14, color, opacity: 0.75, pointerEvents: 'none', zIndex: 1 }} />
        <input
          ref={inputRef}
          className="input-field"
          style={{ paddingLeft: 36, paddingRight: busy ? 38 : 14 }}
          placeholder={placeholder ?? 'Search city, venue or landmark…'}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKey}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
          spellCheck={false}
        />
        {busy && (
          <Loader size={13} style={{ position: 'absolute', right: 13, color: 'var(--text-muted)', animation: 'spin 0.8s linear infinite', pointerEvents: 'none' }} />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
            background: 'var(--elevated)', border: '1px solid var(--border)',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.22)',
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s.place_id}
              onMouseDown={() => pick(s)}
              onMouseEnter={() => setCursor(i)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px',
                cursor: 'pointer',
                background: cursor === i ? 'var(--card)' : 'transparent',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
            >
              <MapPin size={13} style={{ flexShrink: 0, marginTop: 2, color, opacity: 0.6 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.main}
                </div>
                {s.secondary && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.secondary}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Attribution */}
          <div style={{ padding: '5px 12px 6px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
            {provider === 'google'
              ? <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-non-white3.png" alt="Powered by Google" style={{ height: 13, opacity: 0.5 }} />
              : <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>© OpenStreetMap contributors</span>
            }
          </div>
        </div>
      )}
    </div>
  )
}
