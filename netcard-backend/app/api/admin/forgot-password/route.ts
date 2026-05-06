import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'
import { sendAdminPasswordResetEmail } from '@/lib/email'

/** POST /api/admin/forgot-password — send password reset email to admin */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return err('Email required', 400)

    const normalEmail = (email as string).toLowerCase().trim()

    const { data: user } = await supabaseAdmin
      .from('admin_users')
      .select('id, email')
      .eq('email', normalEmail)
      .single()

    // Always return success to avoid email enumeration
    if (!user) return ok({ sent: true })

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await supabaseAdmin
      .from('admin_users')
      .update({ reset_token: token, reset_token_expires_at: expires.toISOString() })
      .eq('id', user.id)

    const rawOrigin = req.nextUrl.origin
    const origin = rawOrigin.includes('localhost') ? rawOrigin.replace(/^https:\/\//, 'http://') : rawOrigin
    const resetUrl = `${origin}/admin/reset-password?token=${token}`

    await sendAdminPasswordResetEmail(normalEmail, resetUrl).catch(e =>
      console.error('[forgot-password] email failed:', e)
    )

    return ok({ sent: true })
  } catch (e) {
    return handleError(e)
  }
}
