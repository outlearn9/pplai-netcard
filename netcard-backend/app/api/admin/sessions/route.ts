import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

type SessionRow = {
  id: string; user_id: string; session_type: string; browser: string
  device_type: string; os: string | null; country: string | null; city: string | null
  started_at: string; ended_at: string | null; duration_s: number | null
}

/** GET /api/admin/sessions — recent sessions with aggregated stats */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  try {
    const url   = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 500)

    // Recent sessions
    const { data: sessions, error } = await supabaseAdmin
      .from('user_sessions')
      .select('id, user_id, session_type, browser, device_type, os, country, city, started_at, ended_at, duration_s')
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Aggregate stats
    const all: SessionRow[] = (sessions ?? []) as SessionRow[]

    const bySessionType = countBy(all, 'session_type')
    const byBrowser     = countBy(all, 'browser')
    const byDeviceType  = countBy(all, 'device_type')
    const byCountry     = countBy(all, 'country')

    const withDuration  = all.filter((s: SessionRow) => s.duration_s != null)
    const avgDuration   = withDuration.length
      ? Math.round(withDuration.reduce((acc: number, r: SessionRow) => acc + (r.duration_s ?? 0), 0) / withDuration.length)
      : 0

    return ok({
      sessions: all,
      stats: {
        total:          all.length,
        avg_duration_s: avgDuration,
        by_session_type: bySessionType,
        by_browser:      byBrowser,
        by_device_type:  byDeviceType,
        by_country:      byCountry,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}

function countBy(arr: Record<string, unknown>[], key: string): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, item) => {
    const v = String(item[key] ?? 'unknown')
    acc[v] = (acc[v] ?? 0) + 1
    return acc
  }, {})
}
