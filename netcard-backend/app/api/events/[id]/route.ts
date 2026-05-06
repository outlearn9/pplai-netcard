import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { EventUpdateSchema as UpdateSchema } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'

// GET /api/events/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*, contacts(id, name, role, company, avatar_initials, avatar_gradient, followed_up, bookmarked, created_at)')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single()

    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

// PUT /api/events/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(parsed.data)
      .eq('id', id)
      .eq('profile_id', profile.id)
      .select()
      .single()

    if (error) throw error
    await logAudit(profile.id, 'update', 'event', id)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

// DELETE /api/events/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id)
      .eq('profile_id', profile.id)

    if (error) throw error
    await logAudit(profile.id, 'delete', 'event', id)
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
