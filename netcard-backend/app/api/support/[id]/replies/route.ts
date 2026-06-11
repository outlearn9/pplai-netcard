import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

type Ctx = { params: Promise<{ id: string }> }

const postSchema = z.object({
  body: z.string().min(1).max(4000),
})

/** GET /api/support/[id]/replies — list replies for the user's own ticket */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const profile = await getProfile()
    const { id } = await params

    // Verify ticket belongs to this user
    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('id')
      .eq('id', id)
      .eq('owner_id', profile.id)
      .single()
    if (!ticket) return err('Ticket not found', 404)

    const { data, error } = await supabaseAdmin
      .from('ticket_replies')
      .select('id, author_type, author_email, body, created_at')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })
    if (error) throw error
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

/** POST /api/support/[id]/replies — user replies to their own ticket */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const profile = await getProfile()
    const { id } = await params
    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    // Verify ticket belongs to this user and is not closed
    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('id, status, email')
      .eq('id', id)
      .eq('owner_id', profile.id)
      .single()
    if (!ticket) return err('Ticket not found', 404)
    if (ticket.status === 'closed') return err('This ticket is closed', 400)

    const { data, error } = await supabaseAdmin
      .from('ticket_replies')
      .insert({
        ticket_id:    id,
        author_type:  'user',
        author_email: ticket.email ?? profile.email ?? null,
        body:         parsed.data.body,
      })
      .select('id, author_type, author_email, body, created_at')
      .single()

    if (error) throw error
    return ok(data, 201)
  } catch (e) {
    return handleError(e)
  }
}
