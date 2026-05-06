import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/response'
import { sendJobApplicationEmail } from '@/lib/email'

const OPEN_ROLES = [
  'Software Engineer',
  'AI / ML Engineer',
  'Product Designer',
  'Growth & Marketing',
  'Other',
]

/** POST /api/jobs — public, no auth required */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const role = formData.get('role')
    const message = formData.get('message')
    const resume = formData.get('resume')

    if (!role || typeof role !== 'string' || !OPEN_ROLES.includes(role)) {
      return err('Please select a valid role', 400)
    }

    const resumeFileName = resume instanceof File ? resume.name : null
    const resumeSize = resume instanceof File ? resume.size : 0

    if (resume instanceof File && resumeSize > 5 * 1024 * 1024) {
      return err('Resume file must be under 5 MB', 400)
    }

    const messageStr = typeof message === 'string' ? message.slice(0, 300) : null
    console.log('[job-application]', { role, message: messageStr, resume: resumeFileName })
    await sendJobApplicationEmail({ role, message: messageStr, resumeFileName }).catch(e =>
      console.error('[job-application] email send failed:', e)
    )

    return ok({ received: true }, 201)
  } catch {
    return err('Failed to submit application. Please try again.', 500)
  }
}
