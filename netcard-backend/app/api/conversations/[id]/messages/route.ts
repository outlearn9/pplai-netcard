import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

async function getConversationForUser(conversationId: string, profileId: string) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('id, participant_a, participant_b, unread_a, unread_b')
    .eq('id', conversationId).single()
  if (error) throw error
  if (!data || (data.participant_a !== profileId && data.participant_b !== profileId)) return null
  return data
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params

    const conversation = await getConversationForUser(id, profile.id)
    if (!conversation) return err('Conversation not found', 404)

    const isParticipantA = conversation.participant_a === profile.id

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, name, avatar_initials, avatar_gradient)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    await supabaseAdmin
      .from('conversations')
      .update(isParticipantA ? { unread_a: 0 } : { unread_b: 0 })
      .eq('id', id)

    return ok(messages)
  } catch (e) {
    return handleError(e)
  }
}

const postSchema = z.object({ content: z.string().min(1) })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id } = await params
    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const conversation = await getConversationForUser(id, profile.id)
    if (!conversation) return err('Conversation not found', 404)

    const isParticipantA = conversation.participant_a === profile.id

    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({ conversation_id: id, sender_id: profile.id, content: parsed.data.content })
      .select()
      .single()

    if (messageError) throw messageError

    const { error: convError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message: parsed.data.content,
        last_message_at: new Date().toISOString(),
        ...(isParticipantA ? { unread_b: conversation.unread_b + 1 } : { unread_a: conversation.unread_a + 1 }),
      })
      .eq('id', id)

    if (convError) throw convError
    return ok(message, 201)
  } catch (e) {
    return handleError(e)
  }
}
