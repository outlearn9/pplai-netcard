import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

type Ctx = { params: Promise<{ id: string }> }

const postSchema = z.object({
  body: z.string().min(1).max(4000),
})

/** GET /api/admin/tickets/[id]/replies — list all replies for a ticket */
export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = await requireRole(req, 'comment')
  if (denied) return denied
  try {
    const { id } = await params
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

/** POST /api/admin/tickets/[id]/replies — post a reply as admin */
export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requireRole(req, 'comment')
  if (denied) return denied
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const authorEmail = (req.headers.get('x-admin-email') ?? '').toLowerCase().trim() || null

    // Verify ticket exists
    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('id, status')
      .eq('id', id)
      .single()
    if (!ticket) return err('Ticket not found', 404)

    const { data, error } = await supabaseAdmin
      .from('ticket_replies')
      .insert({ ticket_id: id, author_type: 'admin', author_email: authorEmail, body: parsed.data.body })
      .select('id, author_type, author_email, body, created_at')
      .single()

    if (error) throw error

    // Auto-move ticket to in_progress if still open
    if (ticket.status === 'open') {
      await supabaseAdmin
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', id)
    }

    return ok(data, 201)
  } catch (e) {
    return handleError(e)
  }
}
