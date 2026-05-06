import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { ok, err, handleError } from '@/lib/response'

type Ctx = { params: Promise<{ userId: string }> }

/**
 * POST /api/admin/impersonate/[userId]
 * Creates a Clerk sign-in token to impersonate a user (admin only).
 * The returned signInUrl can be opened to sign in as that user.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req)
  if (denied) return denied

  try {
    const { userId } = await params
    if (!userId) return err('userId required', 400)

    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerk = await clerkClient()

    // Verify the Clerk user exists before issuing a token
    const user = await clerk.users.getUser(userId).catch(() => null)
    if (!user) return err('User not found in Clerk', 404)

    const signInToken = await clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 3600,
    })

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    const signInUrl = `${frontendUrl}/?__clerk_ticket=${signInToken.token}`

    return ok({ signInUrl, token: signInToken.token, expiresAt: new Date(Date.now() + 3600_000).toISOString() })
  } catch (e) {
    return handleError(e)
  }
}
