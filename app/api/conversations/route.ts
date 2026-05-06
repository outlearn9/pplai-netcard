import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

export async function GET(_req: NextRequest) {
  try {
    const profile = await getProfile()

    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        profile_a:profiles!conversations_participant_a_fkey(
          id, name, role, company, avatar_initials, avatar_gradient
        ),
        profile_b:profiles!conversations_participant_b_fkey(
          id, name, role, company, avatar_initials, avatar_gradient
        )
      `)
      .or(`participant_a.eq.${profile.id},participant_b.eq.${profile.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    const result = conversations.map((conv) => {
      const isParticipantA = conv.participant_a === profile.id
      const otherProfile = isParticipantA ? conv.profile_b : conv.profile_a
      const unreadCount = isParticipantA ? conv.unread_a : conv.unread_b

      const { profile_a, profile_b, unread_a, unread_b, ...rest } = conv

      return {
        ...rest,
        other_participant: otherProfile,
        unread_count: unreadCount,
      }
    })

    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}

const postSchema = z.object({
  contact_profile_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json()
    const parsed = postSchema.safeParse(body)

    if (!parsed.success) {
      return err(parsed.error.flatten().fieldErrors, 400)
    }

    const { contact_profile_id } = parsed.data

    if (contact_profile_id === profile.id) {
      return err('Cannot create a conversation with yourself', 400)
    }

    // Canonical ordering: smaller UUID is participant_a
    const [participant_a, participant_b] = [profile.id, contact_profile_id].sort()

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .upsert(
        { participant_a, participant_b },
        { onConflict: 'participant_a,participant_b' }
      )
      .select()
      .single()

    if (error) throw error

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
