import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
const postSchema = z.object({
  name:   z.string().min(1).max(100),
  email:  z.string().email(),
  access: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
})

/**
 * GET /api/team
 * Returns the list of team members for the authenticated user's workspace.
 */
export async function GET(_req: NextRequest) {
  try {
    const profile = await getProfile()

    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select('id, name, email, access, invited_at')
      .eq('owner_id', profile.id)
      .order('invited_at', { ascending: true })

    if (error) throw error
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

/**
 * POST /api/team
 * Invite a new team member.
 */
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from('team_members')
      .insert({ ...parsed.data, owner_id: profile.id })
      .select('id, name, email, access, invited_at')
      .single()

    if (error) {
      if (error.code === '23505') return err('That email is already on your team')
      throw error
    }

    return ok(data, 201)
  } catch (e) {
    return handleError(e)
  }
}
