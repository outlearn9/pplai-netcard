import { NextRequest } from 'next/server'

export type ParsedUA = {
  browser:      string
  device_type:  'desktop' | 'tablet' | 'mobile'
  session_type: 'web' | 'mobile_web' | 'mobile_app' | 'tablet'
  os:           string
}

/** Parse UA string into browser, device type, session type, and OS. */
export function parseUA(ua: string): ParsedUA {
  const s = ua.toLowerCase()

  // OS
  let os = 'other'
  if (s.includes('iphone') || s.includes('ipad') || s.includes('ipod')) os = 'ios'
  else if (s.includes('android')) os = 'android'
  else if (s.includes('windows')) os = 'windows'
  else if (s.includes('mac os') || s.includes('macintosh')) os = 'macos'
  else if (s.includes('linux')) os = 'linux'

  // Device type
  let device_type: ParsedUA['device_type'] = 'desktop'
  if (s.includes('ipad') || (s.includes('android') && !s.includes('mobile'))) {
    device_type = 'tablet'
  } else if (
    s.includes('iphone') || s.includes('ipod') ||
    (s.includes('android') && s.includes('mobile')) ||
    s.includes('blackberry') || s.includes('windows phone')
  ) {
    device_type = 'mobile'
  }

  // Browser — order matters (edge/samsung before chrome, ios safari before safari)
  let browser = 'other'
  if (s.includes('edg/') || s.includes('edge/'))                    browser = 'edge'
  else if (s.includes('samsungbrowser'))                            browser = 'android'
  else if (s.includes('crios') || s.includes('chrome'))             browser = 'chrome'
  else if (os === 'ios' && s.includes('safari'))                    browser = 'ios'
  else if (os === 'android' && !s.includes('chrome'))               browser = 'android'
  else if (s.includes('safari'))                                    browser = 'safari'
  else if (s.includes('firefox') || s.includes('fxios'))            browser = 'firefox'
  else if (s.includes('opr/') || s.includes('opera'))               browser = 'other'

  // Session type
  let session_type: ParsedUA['session_type'] = 'web'
  if (device_type === 'tablet')      session_type = 'tablet'
  else if (device_type === 'mobile') session_type = 'mobile_web'

  return { browser, device_type, os, session_type }
}

/** Extract Cloudflare geo headers from a request. */
export function getGeo(req: NextRequest) {
  return {
    country: req.headers.get('cf-ipcountry') ?? req.headers.get('x-vercel-ip-country') ?? null,
    region:  req.headers.get('cf-ipregion')  ?? req.headers.get('x-vercel-ip-country-region') ?? null,
    city:    req.headers.get('cf-ipcity')    ?? req.headers.get('x-vercel-ip-city') ?? null,
  }
}

/** Hash an IP address for storage (SHA-256 hex, first 16 chars). */
export async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
