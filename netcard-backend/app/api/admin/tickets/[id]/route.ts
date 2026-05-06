import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

const patchSchema = z.object({
  status:     z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  admin_note: z.string().max(2000).optional(),
})

type Ctx = { params: Promise<{ id: string }> }

/** PATCH /api/admin/tickets/[id] — update status or admin_note */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)
    if (!parsed.data.status && parsed.data.admin_note === undefined) return err('Nothing to update')

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update(parsed.data)
      .eq('id', id)
      .select('id, owner_id, category, message, email, status, admin_note, created_at')
      .single()

    if (error) throw error
    if (!data) return err('Ticket not found', 404)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
