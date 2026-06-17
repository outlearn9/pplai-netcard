import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

const schema = z.object({
  username: z.string().regex(/^[a-z0-9_-]{3,30}$/, 'Username must be 3–30 chars: a–z, 0–9, - or _'),
})

// GET /api/profile/username?check=slug — check if a username is available
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('check')
    if (!slug) return err('Missing check param')

    const parsed = schema.safeParse({ username: slug })
    if (!parsed.success) return ok({ available: false, reason: parsed.error.issues[0]?.message })

    const profile = await getProfile()
    if (profile.username === slug) return ok({ available: true, yours: true })

    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', slug)
      .maybeSingle()

    return ok({ available: !data })
  } catch (e) {
    return handleError(e)
  }
}

// PATCH /api/profile/username — set username
export async function PATCH(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid username')

    const { username } = parsed.data

    // Check not taken by someone else
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existing && existing.id !== profile.id) return err('Username already taken', 409)

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ username })
      .eq('id', profile.id)
      .select('username')
      .single()

    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
