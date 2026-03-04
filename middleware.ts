import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// skip for static assets
const PUBLIC_FILE = /\.(.*)$/

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // allow public files and auth routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/static') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req })

  // if logged in but profile incomplete, redirect to setup
  if (token && token.profileCompleted === false && !pathname.startsWith('/profile/setup')) {
    const url = req.nextUrl.clone()
    url.pathname = '/profile/setup'
    return NextResponse.redirect(url)
  }

  // protect dashboard/admin and dashboard/vendor
  if (pathname.startsWith('/dashboard/admin')) {
    if (!token || token.role !== 'ADMIN') {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith('/dashboard/vendor')) {
    if (!token || token.role !== 'VENDOR') {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // other protected pages (account, orders) require auth
  if (
    pathname.startsWith('/account') ||
    pathname.startsWith('/orders')
  ) {
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth/signin'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
