import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

const patchSchema = z.object({
  access: z.enum(['admin', 'editor', 'viewer']),
})

type Ctx = { params: Promise<{ id: string }> }

/** PATCH /api/team/[id] — change a team member's access level */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const profile = await getProfile()
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from('team_members')
      .update({ access: parsed.data.access })
      .eq('id', id)
      .eq('owner_id', profile.id)
      .select('id, name, email, access, invited_at')
      .single()

    if (error) throw error
    if (!data) return err('Member not found', 404)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/team/[id] — remove a team member */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const profile = await getProfile()

    const { error } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('id', id)
      .eq('owner_id', profile.id)

    if (error) throw error
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
