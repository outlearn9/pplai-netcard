import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

/**
 * GET Handler for /api/conversations/[id]
 * 
 * @param {NextRequest} _req - The incoming request.
 * @param {Object} context - Dynamic route params containing conversation UUID.
 * @returns {Promise<NextResponse>} 200 OK with full conversation and profile details.
 * @description Retrieves a single conversation thread with participant profiles. Enforces ownership check.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params

    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        profile_a:profiles!conversations_participant_a_fkey(
          id, name, role, company, avatar_initials, avatar_gradient
        ),
        profile_b:profiles!conversations_participant_b_fkey(
          id, name, role, company, avatar_initials, avatar_gradient
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    if (conversation.participant_a !== profile.id && conversation.participant_b !== profile.id) {
      return err('Conversation not found', 404)
    }

    return ok(conversation)
  } catch (e) {
    return handleError(e)
  }
}
