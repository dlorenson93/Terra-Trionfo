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

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { ageVerificationStatus, name, firstName, lastName, phone, email } = body

    const updateData: any = {}

    // Age verification update
    if (ageVerificationStatus !== undefined) {
      if (!VALID_STATUSES.includes(ageVerificationStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.ageVerificationStatus = ageVerificationStatus
      updateData.ageVerifiedAt = ageVerificationStatus === 'ELIGIBLE' ? new Date() : null
    }

    // Profile field updates
    if (name !== undefined) updateData.name = name
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) {
      // Check email uniqueness
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: params.id } } })
      if (existing) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
      updateData.email = email
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        ageVerificationStatus: true,
        ageVerifiedAt: true,
      },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
