import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

function groupByDay(rows: { created_at: string }[], days: number) {
  const counts: Record<string, number> = {}
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    counts[d.toISOString().slice(0, 10)] = 0
  }
  for (const r of rows) {
    const day = r.created_at.slice(0, 10)
    if (day in counts) counts[day] = (counts[day] ?? 0) + 1
  }
  return Object.entries(counts).map(([date, count]) => ({ date, count }))
}

/** GET /api/admin/stats/timeseries — 14-day trend for key entities */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString()

    const [profilesRes, contactsRes, eventsRes, messagesRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('created_at').gte('created_at', since),
      supabaseAdmin.from('contacts').select('created_at').gte('created_at', since),
      supabaseAdmin.from('events').select('created_at').gte('created_at', since),
      supabaseAdmin.from('messages').select('created_at').gte('created_at', since),
    ])

    return ok({
      profiles: groupByDay(profilesRes.data ?? [], 14),
      contacts: groupByDay(contactsRes.data ?? [], 14),
      events:   groupByDay(eventsRes.data ?? [], 14),
      messages: groupByDay(messagesRes.data ?? [], 14),
    })
  } catch (e) {
    return handleError(e)
  }
}
