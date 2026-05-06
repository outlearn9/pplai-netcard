import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

const ALLOWED_TABLES = new Set([
  'profiles', 'events', 'contacts', 'contact_notes', 'contact_tags',
  'ai_followups', 'conversations', 'messages', 'team_members',
  'support_tickets', 'suggestions', 'suggestion_votes', 'crash_reports',
  'notifications', 'admin_users',
])

type Ctx = { params: Promise<{ table: string }> }

/** GET /api/admin/database/[table]?limit=50&offset=0 — fetch rows from a table */
export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const { table } = await params
    if (!ALLOWED_TABLES.has(table)) return err('Unknown table', 404)

    const sp     = req.nextUrl.searchParams
    const limit  = Math.min(parseInt(sp.get('limit')  ?? '50'), 200)
    const offset = parseInt(sp.get('offset') ?? '0')

    const { data, error, count } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact' })
      .order('created_at' as never, { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return ok({ rows: data ?? [], total: count ?? 0, limit, offset })
  } catch (e) {
    return handleError(e)
  }
}
