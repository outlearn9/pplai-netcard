import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { logAudit } from '@/lib/audit'

const StatusSchema = z.object({
  status: z.enum(['sent', 'dismissed']),
})

// PATCH /api/ai/followups/:id — mark as sent or dismissed
/**
 * PATCH Handler for /api/ai/followups/[id]
 * 
 * @param {NextRequest} req - The incoming request.
 * @returns {Promise<NextResponse>} Ok response containing the explicitly modified followup draft.
 * @description Allows frontend to manually edit or approve the AI generated draft before it is dispatched natively.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params
    const body = await req.json()
    const parsed = StatusSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from('ai_followups')
      .update({ status: parsed.data.status })
      .eq('id', id)
      .eq('owner_id', profile.id)
      .select()
      .single()

    if (error) throw error

    // If sent, also mark the contact as followed up
    if (parsed.data.status === 'sent' && data.contact_id) {
      await supabaseAdmin
        .from('contacts')
        .update({ followed_up: true })
        .eq('id', data.contact_id)
    }

    await logAudit(profile.id, 'update', 'followup', id)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
