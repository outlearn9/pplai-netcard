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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params
    if (!await verifyContactOwner(id, profile.id)) return err('Contact not found', 404)

    const { data, error } = await supabaseAdmin
      .from('contact_notes')
      .select('id, contact_id, content, created_at, updated_at')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

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
