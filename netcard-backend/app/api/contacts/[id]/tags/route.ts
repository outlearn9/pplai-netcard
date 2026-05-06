import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

const TagSchema = z.object({ tag: z.string().min(1).startsWith('#') })

async function verifyContactOwner(contactId: string, profileId: string) {
  const { error } = await supabaseAdmin
    .from('contacts')
    .select('id')
    .eq('id', contactId)
    .eq('owner_id', profileId)
    .single()
  return !error
}

// POST /api/contacts/:id/tags
/**
 * POST Handler for /api/contacts/[id]/tags
 * 
 * @param {NextRequest} req - Incoming request with a tag string (must start with #).
 * @param {Object} context - Dynamic route params (contact UUID).
 * @returns {Promise<NextResponse>} 201 Created with the new tag association.
 * @description Appends a descriptive hashtag to a contact for categorization and fuzzy-filtering.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params
    if (!await verifyContactOwner(id, profile.id)) return err('Contact not found', 404)

    const body = await req.json()
    const parsed = TagSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from('contact_tags')
      .insert({ contact_id: id, tag: parsed.data.tag })
      .select()
      .single()

    if (error) throw error
    return ok(data, 201)
  } catch (e) {
    return handleError(e)
  }
}

// DELETE /api/contacts/:id/tags?tag=%23fintech
/**
 * DELETE Handler for /api/contacts/[id]/tags
 * 
 * @param {NextRequest} req - Contains specific tag text in the URL search parameters.
 * @param {Object} context - Dynamic route params (contact UUID).
 * @returns {Promise<NextResponse>} 200 OK confirming the tag removal.
 * @description Disassociates a specific hashtag from a contact profile.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params
    if (!await verifyContactOwner(id, profile.id)) return err('Contact not found', 404)

    const tag = new URL(req.url).searchParams.get('tag')
    if (!tag) return err('tag required')

    const { error } = await supabaseAdmin
      .from('contact_tags')
      .delete()
      .eq('contact_id', id)
      .eq('tag', tag)

    if (error) throw error
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
