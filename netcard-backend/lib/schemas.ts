import { z } from 'zod'

const sharedContactFields = {
  role: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  linkedin_url: z.string().optional(),
  role_bucket: z.string().optional(),
  contact_type: z.string().optional(),
  offering_bucket: z.string().optional(),
  seeking_bucket: z.string().optional(),
  mode: z.enum(['Seeking', 'Offering']).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
}

export const ContactSchema = z.object({
  name: z.string().min(1),
  event_id: z.string().uuid().optional(),
  avatar_initials: z.string().max(3).optional(),
  avatar_gradient: z.string().optional(),
  tags: z.array(z.string()).optional(),
  met_at: z.string().optional(),
  met_location: z.string().optional(),
  met_event_name: z.string().optional(),
  met_venue_type: z.string().optional(),
  met_context: z.string().optional(),
  met_highlights: z.string().optional(),
  ...sharedContactFields,
})

export const ContactUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  bookmarked: z.boolean().optional(),
  followed_up: z.boolean().optional(),
  met_context: z.string().optional(),
  met_highlights: z.string().optional(),
  ...sharedContactFields,
})

const VENUE_TYPES = ['event', 'workspace', 'travel', 'housing', 'gym', 'clubhouse', 'party'] as const

export const EventSchema = z.object({
  name:       z.string().min(1),
  start_date: z.string().optional(),
  end_date:   z.string().optional(),
  location:   z.string().optional(),
  seeking:    z.string().optional(),
  offering:   z.string().optional(),
  is_active:  z.boolean().optional(),
  venue_type: z.enum(VENUE_TYPES).optional(),
})

export const EventUpdateSchema = z.object({
  name:       z.string().min(1).optional(),
  start_date: z.string().optional(),
  end_date:   z.string().optional(),
  location:   z.string().optional(),
  seeking:    z.string().optional(),
  offering:   z.string().optional(),
  status:     z.enum(['active', 'upcoming', 'past']).optional(),
  venue_type: z.enum(VENUE_TYPES).optional(),
})

export const NotificationSchema = z.object({
  type:         z.string().min(1),
  title:        z.string().min(1),
  body:         z.string().optional(),
  action_nav:   z.string().optional(),
  action_label: z.string().optional(),
  action_data:  z.record(z.unknown()).optional(),
  icon:         z.string().optional(),
  icon_bg:      z.string().optional(),
})
