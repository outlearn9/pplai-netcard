import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
const postSchema = z.object({
  category: z.enum(['bug', 'suggest', 'help', 'other']).default('help'),
  message:  z.string().min(5).max(2000),
  email:    z.string().email().optional(),
})

/**
 * GET /api/support
 * Returns the authenticated user's own support tickets.
 */
export async function GET(_req: NextRequest) {
  try {
    const profile = await getProfile()

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('id, category, message, email, status, admin_note, created_at')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

/**
 * POST /api/support
 * Submit a new support ticket.
 */
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        owner_id: profile.id,
        ...parsed.data,
      })
      .select('id, category, message, email, status, admin_note, created_at')
      .single()

    if (error) throw error

    return ok(data, 201)
  } catch (e) {
    return handleError(e)
  }
}
