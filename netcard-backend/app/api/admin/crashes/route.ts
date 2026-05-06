import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

/** GET /api/admin/crashes — list recent crash reports */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const { data, error } = await supabaseAdmin
      .from('crash_reports')
      .select('id, owner_id, error, stack, url, ua, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}
