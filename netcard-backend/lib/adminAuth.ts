import { NextRequest, NextResponse } from 'next/server'
import { err } from '@/lib/response'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_SECRET = process.env.ADMIN_SECRET
const ROLE_RANK: Record<string, number> = { view: 0, comment: 1, admin: 2, superadmin: 3 }

/** Validates x-admin-key. Returns 401 NextResponse on failure, null on success. */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (!ADMIN_SECRET) return err('Admin access not configured', 503) as NextResponse
  const key = req.headers.get('x-admin-key') ?? req.nextUrl.searchParams.get('key')
  if (key !== ADMIN_SECRET) return err('Unauthorized', 401) as NextResponse
  return null
}

/**
 * Validates key + checks x-admin-email against admin_users table with a minimum role.
 * Use for user-management routes where role matters.
 */
export async function requireRole(
  req: NextRequest,
  minRole: 'view' | 'comment' | 'admin' | 'superadmin',
): Promise<NextResponse | null> {
  const keyDenied = requireAdmin(req)
  if (keyDenied) return keyDenied

  const email = (req.headers.get('x-admin-email') ?? '').toLowerCase().trim()
  if (!email) return err('Unauthorized', 401) as NextResponse

  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('role')
    .eq('email', email)
    .single()

  if (!data) return err('Unauthorized', 401) as NextResponse
  if ((ROLE_RANK[data.role] ?? -1) < (ROLE_RANK[minRole] ?? 99))
    return err('Insufficient permissions', 403) as NextResponse

  return null
}
