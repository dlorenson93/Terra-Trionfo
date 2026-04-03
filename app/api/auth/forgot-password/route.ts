import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalised = email.toLowerCase().trim()

    // Always return success to prevent user enumeration
    const user = await prisma.user.findUnique({ where: { email: normalised }, select: { id: true, email: true } })

    if (user) {
      // Invalidate any existing unused tokens for this email
      await (prisma as any).passwordResetToken.updateMany({
        where: { email: normalised, used: false },
        data: { used: true },
      })

      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await (prisma as any).passwordResetToken.create({
        data: { token, email: normalised, expiresAt },
      })

      const origin = process.env.NEXTAUTH_URL || 'https://terratrionfo.com'
      const resetUrl = `${origin}/auth/reset-password?token=${token}`

      await sendPasswordResetEmail(normalised, resetUrl)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
