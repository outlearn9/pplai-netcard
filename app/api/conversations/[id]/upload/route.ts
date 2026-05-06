import { NextRequest } from 'next/server'
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile()
    const { id: conversationId } = await params

    const conversation = await getConversationForUser(conversationId, profile.id)
    if (!conversation) {
      return err('Conversation not found', 404)
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return err('No file provided', 400)
    }

    const isParticipantA = conversation.participant_a === profile.id

    const timestamp = Date.now()
    const storagePath = `${profile.id}/${conversationId}/${timestamp}_${file.name}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('chat-files')
      .upload(storagePath, buffer, { contentType: file.type })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('chat-files')
      .getPublicUrl(storagePath)

    const fileUrl = publicUrlData.publicUrl

    // Insert message row with file metadata (no text content)
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single()

    if (messageError) throw messageError

    // Update conversation last_message and increment other participant's unread
    const lastMessagePreview = `Sent a file: ${file.name}`
    const unreadIncrement = isParticipantA
      ? { unread_b: conversation.unread_b + 1 }
      : { unread_a: conversation.unread_a + 1 }

    const { error: convError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message: lastMessagePreview,
        last_message_at: new Date().toISOString(),
        ...unreadIncrement,
      })
      .eq('id', conversationId)

    if (convError) throw convError

    return ok(message)
  } catch (e) {
    return handleError(e)
  }
}
