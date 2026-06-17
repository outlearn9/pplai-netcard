import { NextRequest, NextResponse } from 'next/server'
import { ok, err } from '@/lib/response'

// Exchanges a Clerk __clerk_ticket for a session by hitting Clerk's frontend API.
// The response sets __session and __client_uat cookies that authenticate future requests.
export async function POST(req: NextRequest) {
  try {
    const { ticket } = await req.json()
    if (!ticket || typeof ticket !== 'string') return err('Missing ticket')

    const clerkFrontendApi = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      ?.replace('pk_test_', '')
      ?.replace('pk_live_', '')

    // Decode the base64 frontend API URL from the publishable key
    // Format: pk_test_<base64(frontendApiUrl)>$
    let frontendApiUrl = ''
    try {
      const raw = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
      const b64 = raw.replace(/^pk_(test|live)_/, '').replace(/\$?$/, '')
      frontendApiUrl = atob(b64).replace(/\/$/, '')
    } catch {
      // fallback
      frontendApiUrl = 'https://glad-muskrat-39.clerk.accounts.dev'
    }

    // Exchange the ticket via Clerk's frontend API
    const res = await fetch(`${frontendApiUrl}/v1/client/sign_ins?__clerk_ticket=${encodeURIComponent(ticket)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'http://localhost:5173',
      },
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[exchange-ticket] Clerk error:', data)
      return err('Failed to exchange ticket', 400)
    }

    // Forward the Set-Cookie headers from Clerk back to the browser
    const response = NextResponse.json({ success: true })
    const setCookies = res.headers.getSetCookie?.() ?? []
    for (const cookie of setCookies) {
      response.headers.append('Set-Cookie', cookie)
    }

    return response
  } catch (e) {
    console.error('[exchange-ticket]', e)
    return err('Exchange failed', 500)
  }
}
