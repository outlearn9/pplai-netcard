import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

const TABLES = [
  'profiles',
  'events',
  'contacts',
  'contact_notes',
  'contact_tags',
  'ai_followups',
  'conversations',
  'messages',
  'team_members',
  'support_tickets',
  'suggestions',
  'suggestion_votes',
  'crash_reports',
  'notifications',
  'audit_logs',
  'admin_users',
  'user_sessions',
] as const

/** GET /api/admin/database — row counts for every table */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const results = await Promise.all(
      TABLES.map(async (table) => {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true })
        return { table, count: error ? null : (count ?? 0), error: error?.message ?? null }
      })
    )
    return ok(results)
  } catch (e) {
    return handleError(e)
  }
}
