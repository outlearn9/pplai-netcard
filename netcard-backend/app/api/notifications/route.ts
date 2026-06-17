import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { NotificationSchema } from '@/lib/schemas'

// GET /api/notifications — list all notifications for the authed user
export async function GET(_req: NextRequest) {
  try {
    const profile = await getProfile()

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, owner_id, type, title, body, action_nav, action_label, action_data, icon, icon_bg, read, created_at')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

// POST /api/notifications — create a notification (internal use / server-side triggers)
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const parsed = NotificationSchema.safeParse(await req.json())
    if (!parsed.success) return err(parsed.error.message, 422)

    const body = parsed.data
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        owner_id:     profile.id,
        type:         body.type,
        title:        body.title,
        body:         body.body         ?? null,
        action_nav:   body.action_nav   ?? null,
        action_label: body.action_label ?? null,
        action_data:  body.action_data  ?? null,
        icon:         body.icon         ?? null,
        icon_bg:      body.icon_bg      ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return ok(data, 201)
  } catch (e) {
    return handleError(e)
  }
}

// PATCH /api/notifications — mark ALL as read
export async function PATCH(_req: NextRequest) {
  try {
    const profile = await getProfile()

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('owner_id', profile.id)
      .eq('read', false)

    if (error) throw error
    return ok({ marked: true })
  } catch (e) {
    return handleError(e)
  }
}
