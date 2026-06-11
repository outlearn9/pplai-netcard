import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

/**
 * POST /api/sessions/end
 * Called by the frontend on page unload / sign-out to record session end + duration.
 * Body: { session_id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json() as { session_id?: string }

    if (!body.session_id) return err('session_id required', 400)

    const now = new Date()

    // Fetch started_at to compute duration
    const { data: session, error: fetchErr } = await supabaseAdmin
      .from('user_sessions')
      .select('id, started_at, user_id')
      .eq('id', body.session_id)
      .eq('user_id', profile.clerk_user_id)  // scope to the calling user
      .single()

    if (fetchErr || !session) return err('Session not found', 404)

    const duration_s = Math.round((now.getTime() - new Date(session.started_at).getTime()) / 1000)

    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({ ended_at: now.toISOString(), duration_s })
      .eq('id', body.session_id)

    if (error) throw error
    return ok({ duration_s })
  } catch (e) {
    return handleError(e)
  }
}
