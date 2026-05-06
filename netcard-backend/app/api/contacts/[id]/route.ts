import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { ContactUpdateSchema as UpdateSchema } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'

// GET /api/contacts/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('*, contact_notes(id, content, created_at), contact_tags(id, tag), events(name)')
      .eq('id', id)
      .eq('owner_id', profile.id)
      .single()

    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

// PUT /api/contacts/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .update(parsed.data)
      .eq('id', id)
      .eq('owner_id', profile.id)
      .select()
      .single()

    if (error) throw error
    await logAudit(profile.id, 'update', 'contact', id)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

// DELETE /api/contacts/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('owner_id', profile.id)

    if (error) throw error
    await logAudit(profile.id, 'delete', 'contact', id)
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
