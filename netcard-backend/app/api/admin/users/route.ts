import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { sendAdminAccessEmail } from '@/lib/email'

/** GET /api/admin/users — list all admin users */
export async function GET(req: NextRequest) {
  const denied = await requireRole(req, 'admin')
  if (denied) return denied
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, role, added_by, created_at')
      .order('created_at', { ascending: true })
    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

/** POST /api/admin/users — add a new admin user */
export async function POST(req: NextRequest) {
  const denied = await requireRole(req, 'admin')
  if (denied) return denied
  try {
    const body = await req.json()
    const email = (body.email as string)?.toLowerCase().trim()
    const role  = body.role as string

    if (!email) return err('email required', 400)
    if (!['view', 'comment', 'admin'].includes(role)) return err('role must be view | comment | admin', 400)

    const addedBy = (req.headers.get('x-admin-email') ?? '').toLowerCase().trim()

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .insert({ email, role, added_by: addedBy })
      .select('id, email, role, added_by, created_at')
      .single()

    if (error) {
      if (error.code === '23505') return err('User already exists', 409)
      throw error
    }

    // Fire-and-forget email notification
    sendAdminAccessEmail(email, role, addedBy).catch(() => {/* ignore email errors */})

    return ok(data, 201)
  } catch (e) {
    return handleError(e)
  }
}
