import { NextRequest, NextResponse } from 'next/server'
import { NextFetchEvent } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const host = request.headers.get('host') ?? ''

  // api.pplai.app — allow /api/* and Clerk auth paths; redirect everything else
  const path = request.nextUrl.pathname
  const isClerkPath = path === '/' ? false :
    path.startsWith('/sign-in') || path.startsWith('/sign-up') ||
    path.startsWith('/app-redirect') || path.startsWith('/sso-callback') ||
    path.startsWith('/__clerk') || path.startsWith('/factor-')
  if (host.startsWith('api.') && !path.startsWith('/api') && !isClerkPath) {
    return NextResponse.redirect('https://pplai.app', { status: 301 })
  }

  // admin.pplai.app → rewrite to /admin/* (but leave /api/* unchanged)
  if (host.startsWith('admin.') && !request.nextUrl.pathname.startsWith('/api')) {
    const url = request.nextUrl.clone()
    url.pathname = url.pathname === '/' ? '/admin' : `/admin${url.pathname}`
    return NextResponse.rewrite(url)
  }

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
