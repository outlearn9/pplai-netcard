import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

const voteSchema = z.object({
  vote: z.enum(['up', 'down']).nullable(),
})

type Ctx = { params: Promise<{ id: string }> }

/** POST /api/suggestions/[id]/vote — toggle a vote on a suggestion */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: sugId } = await params
    const profile = await getProfile()
    const body = await req.json()
    const parsed = voteSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { vote } = parsed.data

    const { data: suggestion, error: sugErr } = await supabaseAdmin
      .from('suggestions')
      .select('id, up, down')
      .eq('id', sugId)
      .single()

    if (sugErr || !suggestion) return err('Suggestion not found', 404)

    const { data: existing } = await supabaseAdmin
      .from('suggestion_votes')
      .select('vote')
      .eq('suggestion_id', sugId)
      .eq('voter_id', profile.id)
      .single()

    const prevVote = existing?.vote ?? null

    if (vote === null) {
      await supabaseAdmin
        .from('suggestion_votes')
        .delete()
        .eq('suggestion_id', sugId)
        .eq('voter_id', profile.id)
    } else {
      await supabaseAdmin
        .from('suggestion_votes')
        .upsert(
          { suggestion_id: sugId, voter_id: profile.id, vote },
          { onConflict: 'suggestion_id,voter_id' }
        )
    }

    const { data: votes } = await supabaseAdmin
      .from('suggestion_votes')
      .select('vote')
      .eq('suggestion_id', sugId)

    const up   = (votes ?? []).filter((v: { vote: string }) => v.vote === 'up').length
    const down = (votes ?? []).filter((v: { vote: string }) => v.vote === 'down').length

    await supabaseAdmin.from('suggestions').update({ up, down }).eq('id', sugId)

    return ok({ suggestion_id: sugId, my_vote: vote, up, down, prev_vote: prevVote })
  } catch (e) {
    return handleError(e)
  }
}
