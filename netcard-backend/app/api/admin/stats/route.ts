import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

/** GET /api/admin/stats — computed usage stats across all users */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      usersRes,
      dauRes,
      eventsRes,
      contactsRes,
      messagesRes,
      followupsRes,
      ticketsRes,
      crashesRes,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('updated_at', today.toISOString()),
      supabaseAdmin.from('events').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('contacts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('ai_followups').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('support_tickets').select('status').eq('status', 'open'),
      supabaseAdmin.from('crash_reports').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    ])

    return ok({
      users:            usersRes.count   ?? 0,
      dau:              dauRes.count     ?? 0,
      events:           eventsRes.count  ?? 0,
      contacts:         contactsRes.count ?? 0,
      messages:         messagesRes.count ?? 0,
      ai_followups:     followupsRes.count ?? 0,
      open_tickets:     ticketsRes.data?.length ?? 0,
      crashes_7d:       crashesRes.count ?? 0,
    })
  } catch (e) {
    return handleError(e)
  }
}
