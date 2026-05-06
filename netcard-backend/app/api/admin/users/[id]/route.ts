import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

type Ctx = { params: Promise<{ id: string }> }

/** PATCH /api/admin/users/[id] — change a user's role */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireRole(req, 'admin')
  if (denied) return denied
  try {
    const { id } = await params
    const { role } = await req.json()
    if (!['view', 'comment', 'admin'].includes(role)) return err('Invalid role', 400)

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .update({ role })
      .eq('id', id)
      .select('id, email, role')
      .single()

    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/admin/users/[id] — remove an admin user */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requireRole(req, 'admin')
  if (denied) return denied
  try {
    const { id } = await params
    const selfEmail = (req.headers.get('x-admin-email') ?? '').toLowerCase().trim()
    const { data: target } = await supabaseAdmin
      .from('admin_users')
      .select('email')
      .eq('id', id)
      .single()

    if (target?.email === selfEmail) return err('Cannot remove yourself', 400)

    const { error } = await supabaseAdmin
      .from('admin_users')
      .delete()
      .eq('id', id)

    if (error) throw error
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
