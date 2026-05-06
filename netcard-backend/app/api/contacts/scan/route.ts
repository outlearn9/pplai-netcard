import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { logAudit } from '@/lib/audit'

/**
 * POST /api/contacts/scan
 *
 * Receives a QR scan result and persists it as a contact.
 * Accepts either:
 *   - Pre-parsed contact fields (name, email, phone, etc.)
 *   - Raw vCard string in `raw_vcard` field
 *   - A plain URL/text in `qr_data` field (saved as linkedin_url if URL)
 *
 * Automatically links to the user's active event and fires a "connection" notification.
 */
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json() as Record<string, string | undefined>

    // ── Parse raw vCard if provided ──────────────────────────────────────────
    let contactData: Record<string, string | undefined> = {}

    if (body.raw_vcard) {
      contactData = parseVCard(body.raw_vcard)
    } else {
      // Use pre-parsed fields from frontend
      const { raw_vcard: _v, qr_data, ...fields } = body
      contactData = fields
      if (qr_data && !fields.linkedin_url && isUrl(qr_data)) {
        contactData.linkedin_url = qr_data
      }
    }

    const name = (contactData.name || '').trim()
    if (!name) return err('Contact name is required', 400)

    // ── Resolve active event ──────────────────────────────────────────────────
    const { data: activeEvent } = await supabaseAdmin
      .from('events')
      .select('id, name, location, venue_type')
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .maybeSingle()

    // ── Derive avatar initials ────────────────────────────────────────────────
    const GRADS = ['grad-purple', 'grad-green', 'grad-amber']
    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    const gradient = GRADS[name.charCodeAt(0) % GRADS.length]

    // ── Insert contact ────────────────────────────────────────────────────────
    const { data: contact, error: contactErr } = await supabaseAdmin
      .from('contacts')
      .insert({
        owner_id:        profile.id,
        name,
        role:            contactData.role            ?? null,
        company:         contactData.company         ?? null,
        email:           contactData.email           ?? null,
        phone:           contactData.phone           ?? null,
        linkedin_url:    contactData.linkedin_url    ?? null,
        avatar_initials: initials,
        avatar_gradient: gradient,
        event_id:        activeEvent?.id             ?? null,
        met_at:          new Date().toISOString(),
        met_event_name:  activeEvent?.name           ?? null,
        met_location:    activeEvent?.location       ?? null,
        met_venue_type:  activeEvent?.venue_type     ?? null,
        source:          'qr_scan',
      })
      .select()
      .single()

    if (contactErr) throw contactErr

    await logAudit(profile.id, 'create', 'contact', contact.id)

    // ── Fire a connection notification ────────────────────────────────────────
    await supabaseAdmin.from('notifications').insert({
      owner_id:     profile.id,
      type:         'connection',
      title:        `Connected with ${name} 🎉`,
      body:         activeEvent ? `Met at ${activeEvent.name}` : 'New connection via QR scan.',
      action_nav:   'contact',
      action_label: 'View Profile',
      action_data:  { id: contact.id, name, role: contact.role, company: contact.company },
      icon:         'connection',
      icon_bg:      '#6366F1',
    }).then(({ error }: { error: { message: string } | null }) => {
      if (error) console.error('[scan] notification insert failed:', error.message)
    })

    return ok(contact, 201)
  } catch (e) {
    return handleError(e)
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function isUrl(s: string) {
  try { new URL(s); return true } catch { return false }
}

/** Minimal vCard 2.1 / 3.0 parser */
function parseVCard(raw: string): Record<string, string | undefined> {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const get = (prefix: string) =>
    lines.find(l => l.toUpperCase().startsWith(prefix.toUpperCase()))
      ?.split(':').slice(1).join(':').trim()

  const fn = get('FN:')
  const tel = get('TEL')?.replace(/[^\d+]/g, '')
  const emailLine = get('EMAIL')
  const orgLine = get('ORG:')
  const titleLine = get('TITLE:')
  const urlLine = lines.find(l => /^URL[;:]/i.test(l))?.split(':').slice(1).join(':').trim()
  const linkedinLine = lines.find(l => l.toLowerCase().includes('linkedin.com'))

  return {
    name:         fn                           || undefined,
    phone:        tel                          || undefined,
    email:        emailLine                    || undefined,
    company:      orgLine?.split(';')[0]       || undefined,
    role:         titleLine                    || undefined,
    linkedin_url: linkedinLine?.split(':').slice(1).join(':').trim() || urlLine || undefined,
  }
}
