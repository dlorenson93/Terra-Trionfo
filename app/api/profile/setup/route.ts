import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { profileSetupSchema } from '@/lib/validation/profile'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = profileSetupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
    }

    const { role } = parsed.data

    // update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role,
        profileCompleted: true,
      },
    })

    // if vendor role, create blank company record
    if (role === 'VENDOR') {
      await prisma.company.create({
        data: {
          name: '',
          contactEmail: updatedUser.email,
          status: 'PENDING',
          ownerId: updatedUser.id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Profile setup error:', err)
    return NextResponse.json({ error: 'Failed to complete profile' }, { status: 500 })
  }
}