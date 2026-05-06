import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

/** POST /api/admin/reset-password — validate token and set new password */
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return err('Token and password required', 400)
    if ((password as string).length < 6) return err('Password must be at least 6 characters', 400)

    const { data: user } = await supabaseAdmin
      .from('admin_users')
      .select('id, reset_token_expires_at')
      .eq('reset_token', token)
      .single()

    if (!user) return err('Invalid or expired reset link', 400)

    if (user.reset_token_expires_at && new Date(user.reset_token_expires_at) < new Date()) {
      return err('Reset link has expired. Request a new one.', 400)
    }

    const password_hash = await bcrypt.hash(password as string, 10)

    await supabaseAdmin
      .from('admin_users')
      .update({ password_hash, reset_token: null, reset_token_expires_at: null })
      .eq('id', user.id)

    return ok({ reset: true })
  } catch (e) {
    return handleError(e)
  }
}
