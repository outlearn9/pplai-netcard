import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

const patchSchema = z.object({
  status: z.enum(['open', 'planned', 'done', 'rejected']),
})

type Ctx = { params: Promise<{ id: string }> }

/** PATCH /api/admin/suggestions/[id] — update suggestion status */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from('suggestions')
      .update({ status: parsed.data.status })
      .eq('id', id)
      .select('id, title, status, up, down')
      .single()

    if (error) throw error
    if (!data) return err('Suggestion not found', 404)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
