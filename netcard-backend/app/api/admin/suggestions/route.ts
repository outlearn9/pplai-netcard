import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

/** GET /api/admin/suggestions — list all suggestions (highest net votes first) */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const { data, error } = await supabaseAdmin
      .from('suggestions')
      .select('id, owner_id, title, body, category, up, down, status, created_at')
      .order('up', { ascending: false })
      .limit(200)
    if (error) throw error
    type Row = { up: number; down: number }
    return ok((data ?? []).sort((a: Row, b: Row) => (b.up - b.down) - (a.up - a.down)))
  } catch (e) {
    return handleError(e)
  }
}
