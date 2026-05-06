import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { ContactSchema } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'

/**
 * Retrieves a list of contacts owned by the authenticated user, complete with their notes and tags.
 * Includes extensive query parameter support for filtering by event, location, company, and priority buckets.
 *
 * @param {NextRequest} req - The incoming HTTP request containing query filters natively.
 * @returns {Promise<NextResponse>} 200 OK with an array of contact objects, or a 500/401 Error.
 * 
 * Supported Query Params:
 * - `event_id` (uuid)
 * - `bookmarked` (boolean string 'true')
 * - `followed_up` (boolean string 'true')
 * - `role_bucket`, `contact_type`, `offering_bucket`, `seeking_bucket` (strings)
 * - `city`, `country`, `company`, `search` (fuzzy string matching)
 */
export async function GET(req: NextRequest) {
  try {
    const profile = await getProfile()
    const p = new URL(req.url).searchParams

    let query = supabaseAdmin
      .from('contacts')
      .select(`
        *,
        contact_notes(id, content, created_at),
        contact_tags(tag)
      `)
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })

    // Filters
    if (p.get('event_id'))       query = query.eq('event_id', p.get('event_id')!)
    if (p.get('bookmarked'))     query = query.eq('bookmarked', p.get('bookmarked') === 'true')
    if (p.get('followed_up'))    query = query.eq('followed_up', p.get('followed_up') === 'true')
    if (p.get('role_bucket'))    query = query.eq('role_bucket', p.get('role_bucket')!)
    if (p.get('contact_type'))   query = query.eq('contact_type', p.get('contact_type')!)
    if (p.get('offering_bucket'))query = query.eq('offering_bucket', p.get('offering_bucket')!)
    if (p.get('seeking_bucket')) query = query.eq('seeking_bucket', p.get('seeking_bucket')!)
    if (p.get('city'))           query = query.ilike('city', `%${p.get('city')}%`)
    if (p.get('country'))        query = query.ilike('country', `%${p.get('country')}%`)
    if (p.get('company'))        query = query.ilike('company', `%${p.get('company')}%`)
    if (p.get('search'))         query = query.or(
      `name.ilike.%${p.get('search')}%,role.ilike.%${p.get('search')}%,company.ilike.%${p.get('search')}%`
    )

    const { data, error } = await query
    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

/**
 * Creates a new contact record securely mapped to the authenticated user.
 * Automatically aligns the contact with the user's currently active event if `event_id` is omitted.
 *
 * @param {NextRequest} req - The incoming HTTP request containing the JSON payload.
 * @returns {Promise<NextResponse>} 201 Created with the inserted contact data, or 400 Bad Request if validation fails.
 *
 * Zod Payload Requirements (ContactSchema):
 * - `name` (string, required)
 * - `company`, `role`, `email`, `phone`, `city`, `country` (string, optional)
 * - `event_id` (uuid string, optional)
 * - `tags` (array of strings, optional)
 */
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json()
    const parsed = ContactSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { tags, ...contactData } = parsed.data

    // Resolve active event — pull name + location + venue_type too
    let activeEvent: { id: string; name: string; location?: string; venue_type?: string } | null = null
    if (!contactData.event_id) {
      const { data } = await supabaseAdmin
        .from('events')
        .select('id, name, location, venue_type')
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .single()
      if (data) { activeEvent = data; contactData.event_id = data.id }
    } else {
      const { data } = await supabaseAdmin
        .from('events')
        .select('id, name, location, venue_type')
        .eq('id', contactData.event_id)
        .single()
      if (data) activeEvent = data
    }

    // Auto-fill meeting metadata if not provided by client
    const now = new Date()
    if (!contactData.met_at)           contactData.met_at           = now.toISOString()
    if (!contactData.met_location    && activeEvent?.location)
                                       contactData.met_location     = activeEvent.location
    if (!contactData.met_event_name  && activeEvent?.name)
                                       contactData.met_event_name   = activeEvent.name
    if (!contactData.met_venue_type  && activeEvent?.venue_type)
                                       contactData.met_venue_type   = activeEvent.venue_type

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert({ ...contactData, owner_id: profile.id })
      .select()
      .single()

    if (error) throw error

    // Insert tags if provided
    if (tags?.length) {
      await supabaseAdmin
        .from('contact_tags')
        .insert(tags.map(tag => ({ contact_id: contact.id, tag })))
    }

    await logAudit(profile.id, 'create', 'contact', contact.id)
    return ok(contact, 201)
  } catch (e) {
    return handleError(e)
  }
}
