import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'
import { deactivateAllEvents } from '@/lib/events'

// POST /api/events/:id/activate — switches the active event
/**
 * POST Handler for /api/events/[id]/activate
 * 
 * @param {NextRequest} _req - The incoming request.
 * @param {Object} context - Contains dynamic route params (uuid).
 * @returns {Promise<NextResponse>} 200 OK with the newly activated event data.
 * @description Business logic endpoint to switch active networking context. Deactivates all other user events before activating target.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params

    await deactivateAllEvents(profile.id)

    // Activate the target event
    const { data, error } = await supabaseAdmin
      .from('events')
      .update({ is_active: true, status: 'active' })
      .eq('id', id)
      .eq('profile_id', profile.id)
      .select()
      .single()

    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
