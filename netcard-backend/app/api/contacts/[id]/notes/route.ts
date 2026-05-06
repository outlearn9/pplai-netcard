import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

const NoteSchema = z.object({ content: z.string().min(1) })

async function verifyContactOwner(contactId: string, profileId: string) {
  const { error } = await supabaseAdmin
    .from('contacts')
    .select('id')
    .eq('id', contactId)
    .eq('owner_id', profileId)
    .single()
  return !error
}

// GET /api/contacts/:id/notes
/**
 * GET Handler for /api/contacts/[id]/notes
 * 
 * @param {NextRequest} _req - The incoming request.
 * @param {Object} context - Dynamic route params (contact UUID).
 * @returns {Promise<NextResponse>} 200 OK with all chronologically ordered notes for the contact.
 * @description Retrieves a dedicated list of notes associated with a specific networking contact.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params
    if (!await verifyContactOwner(id, profile.id)) return err('Contact not found', 404)

    const { data, error } = await supabaseAdmin
      .from('contact_notes')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

// POST /api/contacts/:id/notes
/**
 * POST Handler for /api/contacts/[id]/notes
 * 
 * @param {NextRequest} req - Incoming request with note text content.
 * @param {Object} context - Dynamic route params (contact UUID).
 * @returns {Promise<NextResponse>} 201 Created with the new note record.
 * @description Adds a new textual insight or follow-up note to a contact profile.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params
    if (!await verifyContactOwner(id, profile.id)) return err('Contact not found', 404)

    const body = await req.json()
    const parsed = NoteSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from('contact_notes')
      .insert({ contact_id: id, content: parsed.data.content })
      .select()
      .single()

    if (error) throw error
    return ok(data, 201)
  } catch (e) {
    return handleError(e)
  }
}

// DELETE /api/contacts/:id/notes/:noteId — handled inline via query param
/**
 * DELETE Handler for /api/contacts/[id]/notes
 * 
 * @param {NextRequest} req - Contains noteId in the URL search parameters.
 * @param {Object} context - Dynamic route params (contact UUID).
 * @returns {Promise<NextResponse>} 200 OK confirming deletion.
 * @description Removes a specific note record by its unique ID, verified against the contact ownership.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params
    if (!await verifyContactOwner(id, profile.id)) return err('Contact not found', 404)

    const noteId = new URL(req.url).searchParams.get('noteId')
    if (!noteId) return err('noteId required')

    const { error } = await supabaseAdmin
      .from('contact_notes')
      .delete()
      .eq('id', noteId)
      .eq('contact_id', id)

    if (error) throw error
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
