import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateAI } from '@/lib/ai'
import { ok, err, handleError } from '@/lib/response'
import { logAudit } from '@/lib/audit'
import { aiRatelimit, aiDailyRatelimit } from '@/lib/ratelimit'

// GET /api/ai/followups?event_id=...
/**
 * GET Handler for /api/ai/followups
 * 
 * @param {NextRequest} req - The incoming request containing optional query parameters for event/status filtering.
 * @returns {Promise<NextResponse>} Ok response featuring all followups tied to the user.
 * @description Retrieves pending and sent AI drafts from the auth-scoped database.
 */
export async function GET(req: NextRequest) {
  try {
    const profile = await getProfile()
    const eventId = new URL(req.url).searchParams.get('event_id')

    let query = supabaseAdmin
      .from('ai_followups')
      .select('*, contacts(name, role, company, email, phone), events(name)')
      .eq('owner_id', profile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (eventId) query = query.eq('event_id', eventId)

    const { data, error } = await query
    if (error) throw error
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

// POST /api/ai/followups/generate — generates AI suggestions for pending contacts
/**
 * POST Handler for /api/ai/followups
 * 
 * @param {NextRequest} req - The incoming request providing the contact context notes for Anthropic.
 * @returns {Promise<NextResponse>} Successfully generated draft message string directly from the LLM.
 * @description Triggers the Anthropic Claude API to generate a personalized networking follow-up draft based on user context.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
    const [hourly, daily] = await Promise.all([aiRatelimit.limit(ip), aiDailyRatelimit.limit(ip)])
    if (!hourly.success || !daily.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const profile = await getProfile()
    const { event_id } = await req.json()

    // Fetch contacts that haven't been followed up yet
    let query = supabaseAdmin
      .from('contacts')
      .select('*, contact_notes(content), contact_tags(tag)')
      .eq('owner_id', profile.id)
      .eq('followed_up', false)

    if (event_id) query = query.eq('event_id', event_id)

    const { data: contacts, error: cErr } = await query
    if (cErr) throw cErr
    if (!contacts?.length) return err('No contacts to generate follow-ups for', 404)

    const results = await Promise.all(
      contacts.slice(0, 10).map(async (contact: Record<string, unknown> & { id: string; name: string; role?: string; company?: string; email?: string; created_at?: string; contact_notes?: { content: string }[]; contact_tags?: { tag: string }[] }) => {
        const notes = contact.contact_notes?.map((n: { content: string }) => n.content).join('. ') || ''
        const tags = contact.contact_tags?.map((t: { tag: string }) => t.tag).join(', ') || ''

        const daysSinceEvent = contact.created_at
          ? Math.floor((Date.now() - new Date(contact.created_at).getTime()) / 86_400_000)
          : 0

        const prompt = `You are helping a networker write a personalized follow-up message.

Contact: ${contact.name}, ${contact.role || ''} at ${contact.company || ''}
Tags: ${tags}
Notes from meeting: ${notes}
Days since meeting: ${daysSinceEvent}
My profile: ${profile.name}, ${profile.role || ''} at ${profile.company || ''}
My offering: ${profile.offering || ''}
My seeking: ${profile.seeking || ''}

Write a short, warm, personalized follow-up message (2-3 sentences max). Make it specific to the context above.

Also assign a priority using ONLY these rules:
- HIGH: notes mention a timeline/deadline, OR contact is a decision-maker (Founder/CEO/CTO/VP/Director), OR tags include #hot-lead/#demo-requested/#urgent/#intro-requested
- MEDIUM: warm lead with shared overlap but no timeline, OR contact attended a panel/talk, OR role is relevant but no explicit ask
- LOW: general networking, thin notes, no tags, OR meeting was more than 7 days ago with no strong signal
If any HIGH signal exists, always pick High regardless of other signals.

Respond in JSON only: { "message": "...", "reason": "Based on: ...", "action": "Send via Email|Send via WhatsApp|Send via LinkedIn", "priority": "High|Medium|Low" }`

        let parsed: { message: string; reason: string; action: string; priority: string } | null = null
        try {
          const text = await generateAI([{ role: 'user', content: prompt }])
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
        } catch {
          return null
        }

        if (!parsed) return null

        const { data: followup, error: fErr } = await supabaseAdmin
          .from('ai_followups')
          .insert({
            owner_id:   profile.id,
            contact_id: contact.id,
            event_id:   contact.event_id,
            message:    parsed.message,
            reason:     parsed.reason,
            action:     parsed.action || 'Send via Email',
            priority:   parsed.priority || 'Medium',
          })
          .select()
          .single()

        return fErr ? null : followup
      })
    )

    const created = results.filter(Boolean)
    await Promise.all(
      created.map((f) => f && logAudit(profile.id, 'generate', 'followup', f.id))
    )
    return ok(created, 201)
  } catch (e) {
    return handleError(e)
  }
}
