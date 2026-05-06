import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

async function getConversationForUser(conversationId: string, profileId: string) {
  const { data, error } = await supabaseAdmin
    .from('conversations').select('*').eq('id', conversationId).single()
  if (error) throw error
  if (!data || (data.participant_a !== profileId && data.participant_b !== profileId)) return null
  return data
}

/**
 * POST Handler for /api/conversations/[id]/upload
 * 
 * @param {NextRequest} req - Multipart form data containing the file asset.
 * @param {Object} context - Dynamic route params (conversation UUID).
 * @returns {Promise<NextResponse>} 201 Created with the file message metadata.
 * @description Securely uploads a file attachment to Supabase Storage and records a file-type message in the thread.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getProfile()
    const { id: conversationId } = await params

    const conversation = await getConversationForUser(conversationId, profile.id)
    if (!conversation) return err('Conversation not found', 404)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return err('No file provided')

    const isParticipantA = conversation.participant_a === profile.id
    const storagePath = `${profile.id}/${conversationId}/${Date.now()}_${file.name}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabaseAdmin.storage
      .from('chat-files')
      .upload(storagePath, buffer, { contentType: file.type })
    if (uploadError) throw uploadError

    const { data: urlData } = supabaseAdmin.storage.from('chat-files').getPublicUrl(storagePath)

    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single()

    if (messageError) throw messageError

    const { error: convError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message: `Sent a file: ${file.name}`,
        last_message_at: new Date().toISOString(),
        ...(isParticipantA ? { unread_b: conversation.unread_b + 1 } : { unread_a: conversation.unread_a + 1 }),
      })
      .eq('id', conversationId)

    if (convError) throw convError
    return ok(message, 201)
  } catch (e) {
    return handleError(e)
  }
}
