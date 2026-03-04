import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'

// token is typed loosely
interface AuthToken {
  id?: string
  role?: string
  profileCompleted?: boolean
  exp?: number
}

export async function requireAuth(req: NextRequest) {
  const token = await getToken({ req }) as AuthToken | null
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }
  return token
}

export async function requireRole(req: NextRequest, role: UserRole) {
  const token = await requireAuth(req)
  if (!token || token instanceof NextResponse) return token
  if (token.role !== role) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  return token
}

export async function requireProfileComplete(req: NextRequest) {
  const token = await getToken({ req }) as AuthToken | null
  if (!token) return null
  if (!token.profileCompleted) {
    const url = req.nextUrl.clone()
    url.pathname = '/profile/setup'
    return NextResponse.redirect(url)
  }
  return token
}
