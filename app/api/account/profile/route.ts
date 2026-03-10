import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      ageVerificationStatus: true,
      ageVerifiedAt: true,
    } as any,
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { firstName, lastName, phone, dateOfBirth } = body

  // Sanitise DOB
  let parsedDOB: Date | null = null
  if (dateOfBirth) {
    const d = new Date(dateOfBirth)
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 })
    }
    parsedDOB = d
  }

  // Calculate age eligibility
  let ageVerificationStatus: 'UNVERIFIED' | 'ELIGIBLE' | 'INELIGIBLE' = 'UNVERIFIED'
  let ageVerifiedAt: Date | null = null
  if (parsedDOB) {
    const today = new Date()
    let age = today.getFullYear() - parsedDOB.getFullYear()
    const m = today.getMonth() - parsedDOB.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < parsedDOB.getDate())) age--
    ageVerificationStatus = age >= 21 ? 'ELIGIBLE' : 'INELIGIBLE'
    ageVerifiedAt = new Date()
  }

  const updated = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      phone: phone?.trim() || null,
      dateOfBirth: parsedDOB,
      ageVerificationStatus,
      ageVerifiedAt,
    } as any,
    select: {
      id: true,
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      ageVerificationStatus: true,
      ageVerifiedAt: true,
    } as any,
  })

  return NextResponse.json(updated)
}
