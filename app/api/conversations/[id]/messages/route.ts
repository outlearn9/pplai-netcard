import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

async function getConversationForUser(conversationId: string, profileId: string) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (error) throw error
  if (!data) return null

  if (data.participant_a !== profileId && data.participant_b !== profileId) {
    return null
  }

  return data
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile()
    const { id } = await params

    const conversation = await getConversationForUser(id, profile.id)
    if (!conversation) {
      return err('Conversation not found', 404)
    }

    const isParticipantA = conversation.participant_a === profile.id

    // Fetch messages with sender profile
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id, name, avatar_initials, avatar_gradient
        )
      `)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    // Reset unread count for current user
    const unreadUpdate = isParticipantA
      ? { unread_a: 0 }
      : { unread_b: 0 }

    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update(unreadUpdate)
      .eq('id', id)

    if (updateError) throw updateError

    return ok(messages)
  } catch (e) {
    return handleError(e)
  }
}

const postSchema = z.object({
  content: z.string().min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile()
    const { id } = await params
    const body = await req.json()

    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.flatten().fieldErrors, 400)
    }

    const { content } = parsed.data

    const conversation = await getConversationForUser(id, profile.id)
    if (!conversation) {
      return err('Conversation not found', 404)
    }

    const isParticipantA = conversation.participant_a === profile.id

    // Insert the message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: profile.id,
        content,
      })
      .select()
      .single()

    if (messageError) throw messageError

    // Update conversation: last_message, last_message_at, increment other participant's unread
    const unreadIncrement = isParticipantA
      ? { unread_b: conversation.unread_b + 1 }
      : { unread_a: conversation.unread_a + 1 }

    const { error: convError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        ...unreadIncrement,
      })
      .eq('id', id)

    if (convError) throw convError

    return ok(message)
  } catch (e) {
    return handleError(e)
  }
}
