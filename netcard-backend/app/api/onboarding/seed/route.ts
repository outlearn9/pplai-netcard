import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, handleError } from '@/lib/response'

// ─── Sample events (3) ────────────────────────────────────────────────────────

const SAMPLE_EVENTS = [
  {
    name:       'TechConnect Summit 2025',
    start_date: '2025-03-12',
    end_date:   '2025-03-14',
    location:   'Moscone Center, San Francisco',
    seeking:    'Product partners & early customers',
    offering:   'B2B SaaS integrations',
    status:     'past',
    is_active:  false,
    is_sample:  true,
  },
  {
    name:       'AI Founders Mixer — NYC',
    start_date: '2025-05-20',
    end_date:   '2025-05-20',
    location:   'The Brooklyn Lab, New York',
    seeking:    'Angel investors & co-founders',
    offering:   'AI platform demos',
    status:     'past',
    is_active:  false,
    is_sample:  true,
  },
  {
    name:       'SaaS Growth Summit',
    start_date: '2025-08-07',
    end_date:   '2025-08-08',
    location:   'WeWork, Austin TX',
    seeking:    'Distribution partners & resellers',
    offering:   'Revenue automation tooling',
    status:     'upcoming',
    is_active:  true,
    is_sample:  true,
  },
] as const

// ─── Sample contacts (2 per event = 6 total) ──────────────────────────────────

type SampleContact = {
  name: string; role: string; company: string; email: string; phone: string
  linkedin_url: string; role_bucket: string; contact_type: string
  offering_bucket: string; seeking_bucket: string
  avatar_initials: string; avatar_gradient: string
  bookmarked: boolean; followed_up: boolean
  tags: string[]; note: string
  event_key: 'tc' | 'ai' | 'sg'
}

const SAMPLE_CONTACTS: SampleContact[] = [
  // ── TechConnect Summit ────────────────────────────────────────────────────
  {
    name: 'Sarah Raines', role: 'Product Manager', company: 'Stripe',
    email: 'sarah.raines@stripe.com', phone: '+14155552671',
    linkedin_url: 'https://linkedin.com/in/sarahraines',
    role_bucket: 'CXO', contact_type: 'Panelist',
    offering_bucket: 'SaaS', seeking_bucket: 'Clients',
    avatar_initials: 'SR', avatar_gradient: 'grad-purple',
    bookmarked: true, followed_up: false,
    tags: ['#fintech', '#product', '#hot-lead'],
    note: 'Mentioned Stripe is evaluating AI-first CRM tools. Follow up with pricing deck.',
    event_key: 'tc',
  },
  {
    name: 'Marcus Kim', role: 'Head of Engineering', company: 'Linear',
    email: 'marcus@linear.app', phone: '+14155559823',
    linkedin_url: 'https://linkedin.com/in/marcuskim',
    role_bucket: 'Engg', contact_type: 'Panelist',
    offering_bucket: 'SaaS', seeking_bucket: 'Dist. Partners',
    avatar_initials: 'MK', avatar_gradient: 'grad-green',
    bookmarked: false, followed_up: true,
    tags: ['#devtools', '#api'],
    note: 'Great panel session on dev tooling. Interested in integration possibilities.',
    event_key: 'tc',
  },
  // ── AI Founders Mixer ─────────────────────────────────────────────────────
  {
    name: 'Anika Torres', role: 'Founder & CEO', company: 'Bloom AI',
    email: 'anika@bloom.ai', phone: '+14155554432',
    linkedin_url: 'https://linkedin.com/in/anikatorres',
    role_bucket: 'Founders', contact_type: 'Visitor',
    offering_bucket: 'AI Services', seeking_bucket: 'Clients',
    avatar_initials: 'AT', avatar_gradient: 'grad-amber',
    bookmarked: true, followed_up: false,
    tags: ['#seed', '#ai', '#intro-requested'],
    note: 'Pre-seed stage. Looking for investor intros. Mutual connection with Raj.',
    event_key: 'ai',
  },
  {
    name: 'Raj Joshi', role: 'Principal', company: 'Sequoia Capital',
    email: 'raj@sequoiacap.com', phone: '+16505551234',
    linkedin_url: 'https://linkedin.com/in/rajjoshi',
    role_bucket: 'Investor VC/PE', contact_type: 'Visitor',
    offering_bucket: 'Funding', seeking_bucket: 'Founders',
    avatar_initials: 'RJ', avatar_gradient: 'grad-purple',
    bookmarked: true, followed_up: false,
    tags: ['#vc', '#fintech', '#seed'],
    note: 'Focuses on B2B SaaS Series A. Said to reach out with deck in Q2.',
    event_key: 'ai',
  },
  // ── SaaS Growth Summit ────────────────────────────────────────────────────
  {
    name: 'Lena Park', role: 'Head of Design', company: 'Figma',
    email: 'lena.park@figma.com', phone: '+14085553901',
    linkedin_url: 'https://linkedin.com/in/lenapark',
    role_bucket: 'UX', contact_type: 'Exhibitor',
    offering_bucket: 'SaaS', seeking_bucket: 'Early Customers',
    avatar_initials: 'LP', avatar_gradient: 'grad-green',
    bookmarked: true, followed_up: true,
    tags: ['#design', '#ux', '#enterprise'],
    note: 'Running a design systems pilot. Could be a good design partner.',
    event_key: 'sg',
  },
  {
    name: 'Devon Shaw', role: 'VP of Sales', company: 'Salesforce',
    email: 'dshaw@salesforce.com', phone: '+14155557788',
    linkedin_url: 'https://linkedin.com/in/devonshaw',
    role_bucket: 'Sales', contact_type: 'Exhibitor',
    offering_bucket: 'SaaS', seeking_bucket: 'Dist. Partners',
    avatar_initials: 'DS', avatar_gradient: 'grad-amber',
    bookmarked: false, followed_up: false,
    tags: ['#crm', '#enterprise', '#partnership'],
    note: 'Exploring partnership opportunities for AI CRM integrations.',
    event_key: 'sg',
  },
]

// ─── Sample AI follow-ups (one per unfollowed-up contact) ─────────────────────

type SampleFollowup = {
  contact_key: string   // matches SAMPLE_CONTACTS name
  message: string
  reason: string
  action: string
  priority: 'High' | 'Medium' | 'Low'
}

const SAMPLE_FOLLOWUPS: SampleFollowup[] = [
  {
    contact_key: 'Sarah Raines',
    message: "Hi Sarah, great connecting at TechConnect! I'd love to share our pricing deck — Stripe's AI-first CRM evaluation sounds like a perfect fit for what we've built. When's a good time for a quick call?",
    reason: 'Based on: #hot-lead tag + explicit mention of evaluating AI CRM tools.',
    action: 'Send via Email',
    priority: 'High',
  },
  {
    contact_key: 'Anika Torres',
    message: "Hey Anika, loved your energy at the AI Founders Mixer! Happy to make that intro to Raj — I think there's a real fit there. Should I just connect you two over email?",
    reason: 'Based on: #intro-requested tag + mutual connection noted.',
    action: 'Send via WhatsApp',
    priority: 'High',
  },
  {
    contact_key: 'Raj Joshi',
    message: "Hi Raj, thanks for the chat in Brooklyn! We've polished the deck since — would love to get 20 mins on your calendar before end of quarter to walk through Series A readiness.",
    reason: 'Based on: Investor VC/PE role + said to reach out with deck in Q2.',
    action: 'Send via Email',
    priority: 'High',
  },
  {
    contact_key: 'Devon Shaw',
    message: "Devon, great meeting you at SaaS Growth! Given Salesforce's distribution reach, I think there's a compelling partnership angle for our AI automation layer. Would love to explore further.",
    reason: 'Based on: #partnership tag + VP Sales role at enterprise company.',
    action: 'Send via LinkedIn',
    priority: 'Medium',
  },
  {
    contact_key: 'Marcus Kim',
    message: "Marcus, enjoyed the devtools panel at TechConnect! The Linear integration angle is worth a follow-up — happy to share our API docs if helpful.",
    reason: 'Based on: already followed up, but integration opportunity noted.',
    action: 'Send via Email',
    priority: 'Low',
  },
]

// ─── POST /api/onboarding/seed ────────────────────────────────────────────────

export async function POST(_req: NextRequest) {
  try {
    const profile = await getProfile()

    if (profile.seeded_at) {
      return ok({ seeded: false, reason: 'Already seeded' })
    }

    const now = new Date().toISOString()

    // 1. Insert sample events
    const { data: events, error: evErr } = await supabaseAdmin
      .from('events')
      .insert(SAMPLE_EVENTS.map(e => ({ ...e, profile_id: profile.id })))
      .select('id, name')

    if (evErr) throw evErr

    type EventRow = { id: string; name: string }
    const eventMap: Record<string, string | null> = {
      tc: (events as EventRow[]).find((e: EventRow) => e.name.startsWith('TechConnect'))?.id ?? null,
      ai: (events as EventRow[]).find((e: EventRow) => e.name.startsWith('AI Founders'))?.id ?? null,
      sg: (events as EventRow[]).find((e: EventRow) => e.name.startsWith('SaaS Growth'))?.id ?? null,
    }

    const eventNames: Record<string, string> = {
      tc: 'TechConnect Summit 2025',
      ai: 'AI Founders Mixer — NYC',
      sg: 'SaaS Growth Summit',
    }
    const eventLocations: Record<string, string> = {
      tc: 'Moscone Center, San Francisco',
      ai: 'The Brooklyn Lab, New York',
      sg: 'WeWork, Austin TX',
    }

    // 2. Insert sample contacts
    const contactRows = SAMPLE_CONTACTS.map(({ tags: _t, note: _n, event_key, ...c }) => ({
      ...c,
      owner_id:       profile.id,
      event_id:       eventMap[event_key] ?? null,
      met_at:         now,
      met_event_name: eventNames[event_key],
      met_location:   eventLocations[event_key],
      is_sample:      true,
    }))

    const { data: contacts, error: conErr } = await supabaseAdmin
      .from('contacts')
      .insert(contactRows)
      .select('id, name')

    if (conErr) throw conErr

    // 3. Insert tags + notes
    type ContactRow = { id: string; name: string }
    const contactByName = Object.fromEntries((contacts as ContactRow[]).map((c: ContactRow) => [c.name, c.id]))
    const tagRows:  { contact_id: string; tag: string }[]     = []
    const noteRows: { contact_id: string; content: string }[] = []

    for (const sc of SAMPLE_CONTACTS) {
      const cid = contactByName[sc.name]
      if (!cid) continue
      sc.tags.forEach(tag => tagRows.push({ contact_id: cid, tag }))
      if (sc.note) noteRows.push({ contact_id: cid, content: sc.note })
    }

    if (tagRows.length)  await supabaseAdmin.from('contact_tags').insert(tagRows)
    if (noteRows.length) await supabaseAdmin.from('contact_notes').insert(noteRows)

    // 4. Insert sample AI follow-ups
    const followupRows = SAMPLE_FOLLOWUPS.map(f => {
      const contact = SAMPLE_CONTACTS.find(c => c.name === f.contact_key)
      const cid = contactByName[f.contact_key] ?? null
      const eid = contact ? (eventMap[contact.event_key] ?? null) : null
      return {
        owner_id:   profile.id,
        contact_id: cid,
        event_id:   eid,
        message:    f.message,
        reason:     f.reason,
        action:     f.action,
        priority:   f.priority,
        status:     'pending',
        is_sample:  true,
      }
    }).filter(r => r.contact_id)

    if (followupRows.length) {
      await supabaseAdmin.from('ai_followups').insert(followupRows)
    }

    // 5. Welcome notification
    await supabaseAdmin.from('notifications').insert({
      owner_id:     profile.id,
      type:         'feature',
      title:        'Welcome to NetCard! 🎉',
      body:         "We've loaded 3 sample events, 6 contacts & AI follow-up drafts so you can explore the full app. Delete them anytime from Account → Delete Sample Data.",
      action_nav:   'account',
      action_label: 'Go to Account',
      icon:         'ai',
      icon_bg:      '#6366F1',
    })

    // 6. Mark profile as seeded
    await supabaseAdmin
      .from('profiles')
      .update({ seeded_at: now })
      .eq('id', profile.id)

    return ok({
      seeded:    true,
      events:    events.length,
      contacts:  contacts.length,
      followups: followupRows.length,
    }, 201)
  } catch (e) {
    return handleError(e)
  }
}

// ─── DELETE /api/onboarding/seed ─────────────────────────────────────────────

export async function DELETE(_req: NextRequest) {
  try {
    const profile = await getProfile()

    // Delete sample AI follow-ups
    await supabaseAdmin
      .from('ai_followups')
      .delete()
      .eq('owner_id', profile.id)
      .eq('is_sample', true)

    // Delete sample contacts (cascade removes notes + tags)
    const { count: contactsDeleted } = await supabaseAdmin
      .from('contacts')
      .delete({ count: 'exact' })
      .eq('owner_id', profile.id)
      .eq('is_sample', true)

    // Delete sample events
    const { count: eventsDeleted } = await supabaseAdmin
      .from('events')
      .delete({ count: 'exact' })
      .eq('profile_id', profile.id)
      .eq('is_sample', true)

    // Reset seeded_at
    await supabaseAdmin
      .from('profiles')
      .update({ seeded_at: null })
      .eq('id', profile.id)

    // Confirmation notification
    await supabaseAdmin.from('notifications').insert({
      owner_id: profile.id,
      type:     'system',
      title:    'Sample data deleted.',
      body:     "All sample events, contacts and AI drafts have been removed. You're starting fresh!",
      icon:     'analytics',
      icon_bg:  '#059669',
    })

    return ok({ deleted: true, contacts: contactsDeleted ?? 0, events: eventsDeleted ?? 0 })
  } catch (e) {
    return handleError(e)
  }
}
