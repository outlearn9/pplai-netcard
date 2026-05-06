import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

/** GET /api/admin/tickets — list all support tickets (latest first) */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('id, owner_id, category, message, email, status, admin_note, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}
