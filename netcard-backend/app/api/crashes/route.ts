import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { publicRatelimit } from '@/lib/ratelimit'

const postSchema = z.object({
  error: z.string().min(1).max(2000),
  stack: z.string().max(10000).optional(),
  url:   z.string().max(500).optional(),
  ua:    z.string().max(500).optional(),
})

/**
 * POST /api/crashes
 * Public endpoint — ingests a client-side crash report.
 * owner_id is populated from Clerk session cookie if present, otherwise null.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
    const { success } = await publicRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    // Try to read Clerk user id — optional, don't fail if unauthenticated
    let ownerId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const { userId } = await auth()
      ownerId = userId
    } catch {}

    const { error } = await supabaseAdmin
      .from('crash_reports')
      .insert({ ...parsed.data, owner_id: ownerId })

    if (error) throw error
    return ok({ received: true })
  } catch (e) {
    return handleError(e)
  }
}
