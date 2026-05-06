import { NextRequest, NextResponse } from 'next/server'
import { NextFetchEvent } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const host = request.headers.get('host') ?? ''

  // admin.pplai.app → rewrite to /admin/*
  if (host.startsWith('admin.')) {
    const url = request.nextUrl.clone()
    const path = url.pathname === '/' ? '/admin' : `/admin${url.pathname}`
    url.pathname = path
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
