import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { ok, err } from '@/lib/response'

// Only available outside production
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { email, name } = await req.json()
  if (!email) return err('email required')

  const normalEmail = (email as string).toLowerCase().trim()
  const displayName = (name as string | undefined)?.trim() || normalEmail.split('@')[0]

  const clerkHeaders = {
    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  }

  // Find or create Clerk user
  const searchRes = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(normalEmail)}`,
    { headers: clerkHeaders },
  )
  const users = await searchRes.json() as Array<{ id: string }>

  let userId: string
  if (Array.isArray(users) && users.length > 0) {
    userId = users[0].id
  } else {
    const nameParts = displayName.split(' ')
    const createRes = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: clerkHeaders,
      body: JSON.stringify({
        email_address:             [normalEmail],
        first_name:                nameParts[0] ?? '',
        last_name:                 nameParts.slice(1).join(' ') || undefined,
        skip_password_requirement: true,
        skip_password_checks:      true,
      }),
    })
    const created = await createRes.json() as { id?: string; errors?: unknown }
    if (!createRes.ok || !created.id) return err('Failed to create user', 500)
    userId = created.id
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({ sub: userId, email: normalEmail, name: displayName })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)

  return ok({ token, name: displayName })
}
