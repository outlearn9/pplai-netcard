import { NextResponse } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

/**
 * NetCard Middleware
 * 
 * Bypasses Clerk authentication if NEXT_PUBLIC_MOCK_AUTH is enabled.
 * This prevents 500 errors when working without valid API keys.
 */
export default function middleware(request: any, event: any) {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return NextResponse.next()
  }

  return clerkMiddleware()(request, event)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
