import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

type Ctx = { params: Promise<{ id: string }> }

/** PATCH /api/notifications/[id] — mark a single notification as read */
export async function PATCH(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const profile = await getProfile()

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('owner_id', profile.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return err('Notification not found', 404)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/notifications/[id] — remove a notification */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const profile = await getProfile()

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('owner_id', profile.id)

    if (error) throw error
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
