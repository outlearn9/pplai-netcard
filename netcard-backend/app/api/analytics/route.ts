import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

/**
 * GET /api/analytics
 * Returns computed usage stats for the authenticated user.
 */
export async function GET(_req: NextRequest) {
  try {
    const profile = await getProfile()
    const uid = profile.id

    // Run all queries in parallel
    const [
      eventsRes,
      contactsRes,
      bookmarkedRes,
      followedUpRes,
      withNotesRes,
      followupsRes,
      contactsByEventRes,
      senioritiesRes,
    ] = await Promise.all([
      // Events: total, active, past, upcoming
      supabaseAdmin
        .from('events')
        .select('id, status, is_active')
        .eq('profile_id', uid),

      // Contacts: total
      supabaseAdmin
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', uid),

      // Contacts: bookmarked
      supabaseAdmin
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', uid)
        .eq('bookmarked', true),

      // Contacts: followed up
      supabaseAdmin
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', uid)
        .eq('followed_up', true),

      // Contacts: have at least one note (distinct contact_ids in contact_notes)
      supabaseAdmin
        .from('contact_notes')
        .select('contact_id', { count: 'exact', head: true })
        .in(
          'contact_id',
          // sub-select contacts owned by user
          (await supabaseAdmin.from('contacts').select('id').eq('owner_id', uid)).data?.map((c: { id: string }) => c.id) ?? []
        ),

      // AI followups: sent count
      supabaseAdmin
        .from('ai_followups')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', uid)
        .eq('status', 'sent'),

      // Contacts grouped by met_event_name (top events by contacts)
      supabaseAdmin
        .from('contacts')
        .select('met_event_name')
        .eq('owner_id', uid)
        .not('met_event_name', 'is', null),

      // Contacts by role_bucket (seniority breakdown)
      supabaseAdmin
        .from('contacts')
        .select('role_bucket')
        .eq('owner_id', uid)
        .not('role_bucket', 'is', null),
    ])

    // Events breakdown
    type EventRow = { id: string; status: string; is_active: boolean }
    const events: EventRow[] = eventsRes.data ?? []
    const eventsStats = {
      total:    events.length,
      active:   events.filter((e: EventRow) => e.is_active).length,
      past:     events.filter((e: EventRow) => e.status === 'past').length,
      upcoming: events.filter((e: EventRow) => e.status === 'upcoming').length,
    }

    // Contacts breakdown
    const contactsStats = {
      total:        contactsRes.count  ?? 0,
      bookmarked:   bookmarkedRes.count ?? 0,
      followed_up:  followedUpRes.count ?? 0,
      with_notes:   withNotesRes.count  ?? 0,
    }

    // Outreach
    const outreachStats = {
      followups_sent: followupsRes.count ?? 0,
    }

    // Top events by contact count
    const eventCounts: Record<string, number> = {}
    for (const c of contactsByEventRes.data ?? []) {
      if (c.met_event_name) {
        eventCounts[c.met_event_name] = (eventCounts[c.met_event_name] ?? 0) + 1
      }
    }
    const topEvents = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Seniority breakdown
    const seniorityCounts: Record<string, number> = {}
    for (const c of senioritiesRes.data ?? []) {
      if (c.role_bucket) {
        seniorityCounts[c.role_bucket] = (seniorityCounts[c.role_bucket] ?? 0) + 1
      }
    }
    const seniority = Object.entries(seniorityCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }))

    return ok({
      events:   eventsStats,
      contacts: contactsStats,
      outreach: outreachStats,
      top_events: topEvents,
      seniority,
    })
  } catch (e) {
    return handleError(e)
  }
}
