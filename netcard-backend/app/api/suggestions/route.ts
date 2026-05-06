import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
const postSchema = z.object({
  title:    z.string().min(3).max(150),
  body:     z.string().min(5).max(2000),
  category: z.enum(['feature', 'improvement', 'bug', 'other']).default('feature'),
})

/**
 * GET /api/suggestions
 * Returns all suggestions sorted by net votes (up - down), with the caller's own vote.
 */
export async function GET(_req: NextRequest) {
  try {
    const profile = await getProfile()

    const [suggestionsRes, myVotesRes] = await Promise.all([
      supabaseAdmin
        .from('suggestions')
        .select('id, owner_id, title, body, category, up, down, status, created_at')
        .order('up', { ascending: false })
        .limit(100),

      supabaseAdmin
        .from('suggestion_votes')
        .select('suggestion_id, vote')
        .eq('voter_id', profile.id),
    ])

    if (suggestionsRes.error) throw suggestionsRes.error

    const myVoteMap: Record<string, string> = {}
    for (const v of myVotesRes.data ?? []) {
      myVoteMap[v.suggestion_id] = v.vote
    }

    type SugRow = { id: string; up: number; down: number; [key: string]: unknown }
    const data = (suggestionsRes.data ?? [] as SugRow[])
      .sort((a: SugRow, b: SugRow) => (b.up - b.down) - (a.up - a.down))
      .map((s: SugRow) => ({ ...s, my_vote: myVoteMap[s.id] ?? null }))

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

/**
 * POST /api/suggestions
 * Submit a new suggestion.
 */
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from('suggestions')
      .insert({ owner_id: profile.id, ...parsed.data })
      .select('id, owner_id, title, body, category, up, down, status, created_at')
      .single()

    if (error) throw error

    return ok({ ...data, my_vote: null }, 201)
  } catch (e) {
    return handleError(e)
  }
}
