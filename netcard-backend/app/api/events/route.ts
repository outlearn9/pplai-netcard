import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { EventSchema } from '@/lib/schemas'
import { deactivateAllEvents } from '@/lib/events'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  try {
    const profile = await getProfile()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('events')
      .select('*, contacts(count)')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json()
    const parsed = EventSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const eventData: Record<string, unknown> = { ...parsed.data, profile_id: profile.id }

    if (parsed.data.is_active) {
      await deactivateAllEvents(profile.id)
      eventData.status = 'active'
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert(eventData)
      .select()
      .single()

    if (error) throw error
    await logAudit(profile.id, 'create', 'event', data.id)
    return ok(data, 201)
  } catch (e) {
    return handleError(e)
  }
}
