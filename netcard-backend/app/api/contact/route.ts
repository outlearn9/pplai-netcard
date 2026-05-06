import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err } from '@/lib/response'
import { sendContactFormEmail } from '@/lib/email'

const schema = z.object({
  name:     z.string().min(1).max(100),
  email:    z.string().email(),
  subject:  z.enum(['general', 'bug', 'billing', 'feature', 'other']).default('general'),
  message:  z.string().min(10).max(3000),
})

/** POST /api/contact — public, no auth required */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err('Invalid request: ' + Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => `${k}: ${v?.join(', ')}`).join('; '))

    const { name, email, subject, message } = parsed.data

    console.log('[contact-form]', { name, email, subject, message: message.slice(0, 120) })
    await sendContactFormEmail({ name, email, subject, message }).catch(e =>
      console.error('[contact-form] email send failed:', e)
    )

    return ok({ received: true }, 201)
  } catch {
    return err('Failed to submit message. Please try again.', 500)
  }
}
