import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const record = await (prisma as any).passwordResetToken.findUnique({ where: { token } })

    if (!record || record.used || new Date() > new Date(record.expiresAt)) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { passwordHash },
      }),
      (prisma as any).passwordResetToken.update({
        where: { token },
        data: { used: true },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
