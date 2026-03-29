import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['UNVERIFIED', 'ELIGIBLE', 'INELIGIBLE']

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { ageVerificationStatus } = await request.json()
    if (!ageVerificationStatus || !VALID_STATUSES.includes(ageVerificationStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ageVerificationStatus,
        ageVerifiedAt: ageVerificationStatus === 'ELIGIBLE' ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, ageVerificationStatus: updated.ageVerificationStatus })
  } catch (error) {
    console.error('Update age verification error:', error)
    return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 })
  }
}
