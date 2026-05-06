import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { publicRatelimit } from '@/lib/ratelimit'

function buildVCard(p: {
  name?: string; role?: string; company?: string
  email?: string; phone?: string; linkedin_url?: string
  web_url?: string; city?: string; country?: string
}, userId: string): string {
  const CRLF = '\r\n'
  const nameParts = (p.name ?? '').split(' ')
  const last  = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
  const first = nameParts.slice(0, -1).join(' ') || (nameParts[0] ?? '')

  const now      = new Date()
  const dateStr  = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr  = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const location = [p.city, p.country].filter(Boolean).join(', ')
  let note = `We met: ${dateStr}, ${timeStr}`
  if (location) note += ` at ${location}`

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${p.name ?? ''}`,
    `N:${last};${first};;;`,
    p.role    ? `TITLE:${p.role}`            : '',
    p.company ? `ORG:${p.company}`           : '',
    p.phone   ? `TEL;TYPE=CELL:${p.phone}`   : '',
    p.email   ? `EMAIL;TYPE=INTERNET:${p.email}` : '',
    p.linkedin_url ? `URL;TYPE=linkedin:${p.linkedin_url}` : '',
    p.web_url      ? `URL;TYPE=work:${p.web_url}`          : '',
    `URL;TYPE=profile:https://pplai.app/u/${userId}`,
    `NOTE:${note}`,
    'END:VCARD',
  ]

  return lines.filter(Boolean).join(CRLF) + CRLF
}

// Mock profile for local dev when Supabase is not wired up
const MOCK_PROFILE = {
  id: 'mock',
  name: 'Paras Gupta',
  role: 'Founder',
  company: 'PPL AI',
  email: 'paras@pplai.app',
  phone: '',
  linkedin_url: 'https://linkedin.com/in/parasgupta',
  web_url: 'https://pplai.app',
  avatar_initials: 'PG',
  avatar_gradient: 'grad-indigo',
  seeking: '',
  offering: '',
  city: '',
  country: '',
}

// GET /api/qr/:userId — public endpoint
// ?format=vcard  → returns a .vcf file (triggers "Add to Contacts" on iOS/Android)
// (default)      → returns JSON profile card data
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
    const { success } = await publicRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const { userId } = await params
    const format = req.nextUrl.searchParams.get('format')
    const isMock = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true'

    let profileData: typeof MOCK_PROFILE | null = null

    if (isMock) {
      profileData = MOCK_PROFILE
    } else {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, name, role, company, email, phone, linkedin_url, web_url, avatar_initials, avatar_gradient, seeking, offering, city, country')
        .eq('clerk_user_id', userId)
        .single()

      if (error || !data) return err('Profile not found', 404)
      profileData = data
    }

    if (!profileData) return err('Profile not found', 404)
    const data = profileData

    if (format === 'vcard') {
      const vcf = buildVCard(data, userId)
      const slug = (data.name ?? userId).toLowerCase().replace(/\s+/g, '-')
      return new NextResponse(vcf, {
        status: 200,
        headers: {
          'Content-Type': 'text/vcard; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}.vcf"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
