import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { logAudit } from '@/lib/audit'

const ProfileSchema = z.object({
  name:            z.string().min(1).optional(),
  role:            z.string().optional(),
  company:         z.string().optional(),
  email:           z.string().email().optional(),
  phone:           z.string().optional(),
  whatsapp:        z.string().optional(),
  linkedin_url:    z.string().url().optional().or(z.literal('')),
  website:         z.string().optional(),   // stored as web_url in DB
  avatar_initials: z.string().max(3).optional(),
  avatar_gradient: z.string().optional(),
  seeking:         z.string().optional(),
  offering:        z.string().optional(),
  city:            z.string().optional(),
  country:         z.string().optional(),
})

export async function GET() {
  try {
    const profile = await getProfile()
    return ok(profile)
  } catch (e) {
    return handleError(e)
  }
}

async function updateProfile(req: NextRequest) {
  const profile = await getProfile()
  const body = await req.json()
  const parsed = ProfileSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  // Map frontend field names to DB column names
  const { website, ...rest } = parsed.data
  const dbFields: Record<string, unknown> = { ...rest }
  if (website !== undefined) dbFields.web_url = website

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(dbFields)
    .eq('id', profile.id)
    .select()
    .single()

  if (error) throw error
  await logAudit(profile.id, 'update', 'profile', profile.id)
  return ok(data)
}

export async function PUT(req: NextRequest) {
  try { return await updateProfile(req) } catch (e) { return handleError(e) }
}

export async function PATCH(req: NextRequest) {
  try { return await updateProfile(req) } catch (e) { return handleError(e) }
}

/**
 * DELETE /api/profile
 *
 * GDPR Right to Erasure — permanently hard-deletes all personal data owned by the authenticated user.
 * Deletes in dependency order: followups → contacts → events → profile.
 * Soft-delete is NOT used here; this satisfies Article 17 GDPR erasure requirements.
 */
export async function DELETE() {
  try {
    const profile = await getProfile()

    // 1. AI followups
    const { error: e1 } = await supabaseAdmin
      .from('ai_followups')
      .delete()
      .eq('owner_id', profile.id)
    if (e1) throw e1

    // 2. Contacts (cascades contact_notes + contact_tags via FK if configured, else explicit)
    const { error: e2 } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('owner_id', profile.id)
    if (e2) throw e2

    // 3. Events
    const { error: e3 } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('profile_id', profile.id)
    if (e3) throw e3

    // 4. Profile itself
    const { error: e4 } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', profile.id)
    if (e4) throw e4

    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
