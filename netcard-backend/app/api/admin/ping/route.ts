import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { ok } from '@/lib/response'

/** GET /api/admin/ping — lightweight auth check, no DB calls */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  return ok({ ok: true })
}
