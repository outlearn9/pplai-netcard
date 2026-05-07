import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err } from '@/lib/response'
import { Resend } from 'resend'
import { Redis } from '@upstash/redis'

const resend = new Resend(process.env.RESEND_API_KEY)
const redis  = Redis.fromEnv()

const schema = z.object({
  email: z.string().email(),
  name:  z.string().min(1).max(100),
  phone: z.string().optional(),
})

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err('Invalid request')

    const { email, name, phone } = parsed.data
    const normalEmail = email.toLowerCase().trim()

    // Rate-limit: 3 sends per email per 10 min
    const rlKey = `otp:rl:${normalEmail}`
    const sends = await redis.incr(rlKey)
    if (sends === 1) await redis.expire(rlKey, 600)
    if (sends > 3) return err('Too many attempts. Please wait 10 minutes.', 429)

    const code      = generateOtp()
    const expiresAt = Date.now() + 600_000  // 10 min

    await redis.setex(
      `otp:${normalEmail}`,
      600,
      JSON.stringify({ code, name, phone: phone ?? '', attempts: 0, expiresAt }),
    )

    await resend.emails.send({
      from: 'PPL AI <noreply@contact.pplai.app>',
      to:   email,
      subject: `${code} — your PPL AI verification code`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#0f172a;">
          <div style="font-size:22px;font-weight:800;margin-bottom:4px;">PPL AI</div>
          <div style="font-size:13px;color:#64748b;margin-bottom:32px;">Digital Business Card</div>
          <p style="font-size:15px;line-height:1.6;margin-bottom:8px;">Hi ${name},</p>
          <p style="font-size:15px;line-height:1.6;margin-bottom:28px;">Your verification code is:</p>
          <div style="font-size:44px;font-weight:900;letter-spacing:10px;color:#6366f1;text-align:center;padding:24px 0;background:#f5f3ff;border-radius:12px;">${code}</div>
          <p style="font-size:13px;color:#64748b;margin-top:24px;line-height:1.6;">This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    return ok({ sent: true })
  } catch (e) {
    console.error('[send-otp]', e)
    return err('Failed to send code. Please try again.', 500)
  }
}
