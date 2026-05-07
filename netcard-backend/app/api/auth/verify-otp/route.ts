import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err } from '@/lib/response'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

const schema = z.object({
  email: z.string().email(),
  code:  z.string().length(6),
})

type OtpRecord = { code: string; name: string; phone: string; attempts: number; expiresAt: number }

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err('Invalid request')

    const { email, code } = parsed.data
    const normalEmail = email.toLowerCase().trim()
    const key = `otp:${normalEmail}`

    const raw = await redis.get<OtpRecord | string>(key)
    if (!raw) return err('Code expired or not found. Request a new one.', 410)

    const record: OtpRecord = typeof raw === 'string' ? JSON.parse(raw) : raw

    if (Date.now() > record.expiresAt) {
      await redis.del(key)
      return err('Code expired. Please request a new one.', 410)
    }

    record.attempts++
    if (record.attempts > 5) {
      await redis.del(key)
      return err('Too many incorrect attempts. Please request a new code.', 429)
    }

    if (record.code !== code) {
      const remaining = Math.max(1, Math.floor((record.expiresAt - Date.now()) / 1000))
      await redis.setex(key, remaining, JSON.stringify(record))
      return err(`Incorrect code. ${5 - record.attempts + 1} attempt(s) remaining.`, 422)
    }

    // Valid — remove OTP
    await redis.del(key)

    const { name, phone } = record
    const clerkHeaders = {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    }

    // Find or create Clerk user
    const searchRes  = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(normalEmail)}`,
      { headers: clerkHeaders },
    )
    const users = await searchRes.json() as Array<{ id: string }>

    let userId: string

    if (Array.isArray(users) && users.length > 0) {
      userId = users[0].id
    } else {
      const nameParts = name.trim().split(' ')
      const createRes  = await fetch('https://api.clerk.com/v1/users', {
        method: 'POST',
        headers: clerkHeaders,
        body: JSON.stringify({
          email_address:            [normalEmail],
          first_name:               nameParts[0] ?? '',
          last_name:                nameParts.slice(1).join(' ') || undefined,
          skip_password_requirement: true,
          skip_password_checks:      true,
        }),
      })
      const created = await createRes.json() as { id?: string; errors?: unknown }
      if (!createRes.ok || !created.id) {
        console.error('[verify-otp] create user failed', created)
        return err('Failed to create account. Please try again.', 500)
      }
      userId = created.id
    }

    // Issue a sign-in token (valid 5 min)
    const tokenRes  = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
      method: 'POST',
      headers: clerkHeaders,
      body: JSON.stringify({ user_id: userId, expires_in_seconds: 300 }),
    })
    const tokenData = await tokenRes.json() as { url?: string; errors?: unknown }

    if (!tokenRes.ok || !tokenData.url) {
      console.error('[verify-otp] sign-in token failed', tokenData)
      return err('Authentication failed. Please try again.', 500)
    }

    return ok({ token_url: tokenData.url, name, phone })
  } catch (e) {
    console.error('[verify-otp]', e)
    return err('Verification failed. Please try again.', 500)
  }
}
