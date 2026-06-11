import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { parseUA, getGeo, hashIp } from '@/lib/session'

/**
 * POST /api/sessions
 * Called by the frontend on app load to record a new session.
 * Body: { device_id?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json().catch(() => ({})) as { device_id?: string }

    const ua  = req.headers.get('user-agent') ?? ''
    const ip  = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
              ?? req.headers.get('x-real-ip')
              ?? 'unknown'

    const parsed = parseUA(ua)
    const geo    = getGeo(req)
    const ipHash = ip !== 'unknown' ? await hashIp(ip) : null

    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id:      profile.clerk_user_id,
        profile_id:   profile.id,
        session_type: parsed.session_type,
        browser:      parsed.browser,
        device_type:  parsed.device_type,
        device_id:    body.device_id ?? null,
        os:           parsed.os,
        country:      geo.country,
        region:       geo.region,
        city:         geo.city,
        ip:           ipHash,
        user_agent:   ua.slice(0, 500),
        started_at:   new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) throw error
    return ok({ session_id: data.id }, 201)
  } catch (e) {
    return handleError(e)
  }
}
