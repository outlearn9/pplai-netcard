import { NextRequest, NextResponse } from 'next/server'
import { ok, err, handleError } from '@/lib/response'
import { publicRatelimit } from '@/lib/ratelimit'

/**
 * GET /api/events/import?url=<luma_event_url>
 *
 * Public endpoint (no auth required) — proxies a Luma event page and
 * extracts name, date, and location from its JSON-LD + OG meta tags.
 * This avoids browser CORS restrictions on direct luma.com fetches.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
    const { success } = await publicRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const { searchParams } = new URL(req.url)
    const rawUrl = searchParams.get('url')?.trim()

    if (!rawUrl) return err('url query param is required')

    // Accept luma.com and lu.ma domains only
    if (!rawUrl.includes('luma.com') && !rawUrl.includes('lu.ma')) {
      return err('URL must be from luma.com or lu.ma')
    }

    // Normalise: strip tracking params, ensure https
    let cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
    cleanUrl = cleanUrl.split('?')[0]

    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NetCard/1.0; +https://netcard.app)',
        'Accept': 'text/html',
      },
      cache: 'no-store',
    })

    if (!res.ok) return err(`Luma returned ${res.status}`, 502)

    const html = await res.text()

    // ── 1. Try JSON-LD (most reliable) ──────────────────────────────────
    const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1])
        const event = Array.isArray(ld) ? ld.find((e: { '@type'?: string }) => e['@type'] === 'Event') : ld['@type'] === 'Event' ? ld : null
        if (event) {
          return ok({
            name:      event.name        ?? '',
            startDate: event.startDate   ? isoToDateInput(event.startDate) : '',
            endDate:   event.endDate     ? isoToDateInput(event.endDate)   : '',
            location:  extractLocation(event.location) ?? '',
          })
        }
      } catch { /* fall through to meta tags */ }
    }

    // ── 2. Fall back to OG / meta tags ──────────────────────────────────
    const ogTitle    = metaContent(html, 'og:title')    ?? metaContent(html, 'twitter:title')
    const ogDesc     = metaContent(html, 'og:description')
    const startDate  = metaContent(html, 'event:start_time') ?? ''
    const endDate    = metaContent(html, 'event:end_time')   ?? ''
    const location   = metaContent(html, 'event:location')   ?? ''

    if (!ogTitle) return err('Could not extract event details from this URL')

    return ok({
      name:      ogTitle,
      startDate: startDate ? isoToDateInput(startDate) : '',
      endDate:   endDate   ? isoToDateInput(endDate)   : '',
      location:  location || extractLocationFromDesc(ogDesc ?? ''),
    })

  } catch (e) {
    return handleError(e)
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function metaContent(html: string, property: string): string | null {
  const m = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
  ) ?? html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i')
  )
  return m ? m[1] : null
}

function isoToDateInput(iso: string): string {
  // Returns YYYY-MM-DD for <input type="date">
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function extractLocation(loc: unknown): string | null {
  if (!loc) return null
  if (typeof loc === 'string') return loc
  if (typeof loc === 'object' && loc !== null) {
    const l = loc as Record<string, unknown>
    if (l.name) return String(l.name)
    if (l.address) {
      const a = l.address as Record<string, unknown>
      return [a.streetAddress, a.addressLocality, a.addressRegion].filter(Boolean).join(', ')
    }
  }
  return null
}

function extractLocationFromDesc(desc: string): string {
  // Luma often puts the venue in the description as "at Venue Name"
  const m = desc.match(/\bat\s+([A-Z][^.!?]{3,50})/i)
  return m ? m[1].trim() : ''
}
