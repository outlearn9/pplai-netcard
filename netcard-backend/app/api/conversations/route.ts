import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

/**
 * GET Handler for /api/conversations
 * 
 * @param {NextRequest} _req - The incoming request.
 * @returns {Promise<NextResponse>} 200 OK with formatted list of all conversations for the user.
 * @description Retrieves all conversation threads the user is a participant in, including other participant profile data and unread counts.
 */
export async function GET(_req: NextRequest) {
  try {
    const profile = await getProfile()

    const SELECT = `
      *,
      profile_a:profiles!conversations_participant_a_fkey(
        id, name, role, company, avatar_initials, avatar_gradient
      ),
      profile_b:profiles!conversations_participant_b_fkey(
        id, name, role, company, avatar_initials, avatar_gradient
      )
    `

    const [{ data: asA, error: errA }, { data: asB, error: errB }] = await Promise.all([
      supabaseAdmin.from('conversations').select(SELECT).eq('participant_a', profile.id),
      supabaseAdmin.from('conversations').select(SELECT).eq('participant_b', profile.id),
    ])

    if (errA) throw errA
    if (errB) throw errB

    const seen = new Set<string>()
    const conversations = [...(asA ?? []), ...(asB ?? [])]
      .filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
      .sort((a, b) => {
        const ta = new Date(a.last_message_at ?? a.created_at).getTime()
        const tb = new Date(b.last_message_at ?? b.created_at).getTime()
        return tb - ta
      })

    const result = conversations.map((conv) => {
      const isParticipantA = conv.participant_a === profile.id
      const otherProfile = isParticipantA ? conv.profile_b : conv.profile_a
      const unreadCount = isParticipantA ? conv.unread_a : conv.unread_b
      const { profile_a, profile_b, unread_a, unread_b, ...rest } = conv
      return { ...rest, other_participant: otherProfile, unread_count: unreadCount }
    })

    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}

const postSchema = z.object({ contact_profile_id: z.string().uuid() })

/**
 * POST Handler for /api/conversations
 * 
 * @param {NextRequest} req - Incoming request with target participant UUID.
 * @returns {Promise<NextResponse>} 200 OK with the new or existing conversation object.
 * @description Starts or returns an existing conversation between the authenticated user and another profile.
 */
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile()
    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { contact_profile_id } = parsed.data
    if (contact_profile_id === profile.id) return err('Cannot start a conversation with yourself')

    const [participant_a, participant_b] = [profile.id, contact_profile_id].sort()

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .upsert({ participant_a, participant_b }, { onConflict: 'participant_a,participant_b' })
      .select()
      .single()

    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
