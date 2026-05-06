import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

/**
 * GET /api/profile/export
 *
 * GDPR Data Subject Access Request (DSAR) endpoint.
 * Returns a complete machine-readable export of all personal data owned by the authenticated user.
 *
 * @returns {Promise<NextResponse>} 200 OK with full user data export including profile, contacts, events, and AI followups.
 */
export async function GET() {
  try {
    const profile = await getProfile()

    const [contactsResult, eventsResult, followupsResult] = await Promise.all([
      supabaseAdmin
        .from('contacts')
        .select('id, name, role, company, email, phone, linkedin_url, city, country, created_at, contact_notes(content, created_at), contact_tags(tag)')
        .eq('owner_id', profile.id),
      supabaseAdmin
        .from('events')
        .select('id, name, location, start_date, end_date, status, created_at')
        .eq('profile_id', profile.id),
      supabaseAdmin
        .from('ai_followups')
        .select('id, message, reason, action, priority, status, created_at')
        .eq('owner_id', profile.id),
    ])

    return ok({
      exported_at: new Date().toISOString(),
      profile: {
        id:           profile.id,
        name:         profile.name,
        email:        profile.email,
        role:         profile.role,
        company:      profile.company,
        phone:        profile.phone,
        linkedin_url: profile.linkedin_url,
        city:         profile.city,
        country:      profile.country,
      },
      contacts:    contactsResult.data  ?? [],
      events:      eventsResult.data    ?? [],
      ai_followups: followupsResult.data ?? [],
    })
  } catch (e) {
    return handleError(e)
  }
}