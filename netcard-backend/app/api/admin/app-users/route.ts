import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

/** GET /api/admin/app-users — list all app user profiles */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  try {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, clerk_user_id, name, email, role, company, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}
