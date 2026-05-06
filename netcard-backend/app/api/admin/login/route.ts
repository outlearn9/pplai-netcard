import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, handleError } from '@/lib/response'

/** POST /api/admin/login — verify email + per-user password (or master ADMIN_SECRET) */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return err('Email and password required', 400)

    const normalEmail = (email as string).toLowerCase().trim()

    const { data: user } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, role, password_hash')
      .eq('email', normalEmail)
      .single()

    if (!user) return err('Invalid email or password', 401)

    // Master override: ADMIN_SECRET always works
    const ADMIN_SECRET = process.env.ADMIN_SECRET
    const isMaster = ADMIN_SECRET && password === ADMIN_SECRET

    if (!isMaster) {
      if (user.password_hash) {
        const match = await bcrypt.compare(password as string, user.password_hash)
        if (!match) return err('Invalid email or password', 401)
      } else {
        // No hash set — default password is '0000'
        if (password !== '0000') return err('Invalid email or password', 401)
      }
    }

    return ok({ email: normalEmail, role: user.role ?? 'admin' })
  } catch (e) {
    return handleError(e)
  }
}
