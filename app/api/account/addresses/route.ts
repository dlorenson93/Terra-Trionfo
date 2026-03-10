import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const addresses = await (prisma as any).customerAddress.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(addresses)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const { label, address1, address2, city, state, zipCode, isDefault } = body

  if (!address1 || !city || !state || !zipCode) {
    return NextResponse.json({ error: 'address1, city, state, and zipCode are required' }, { status: 400 })
  }

  // Only MA addresses for local delivery
  if (state.toUpperCase() !== 'MA') {
    return NextResponse.json(
      { error: 'Local delivery is currently available in Massachusetts only.' },
      { status: 400 },
    )
  }

  // If this is being set as default, unset all others
  if (isDefault) {
    await (prisma as any).customerAddress.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    })
  }

  // If this is the first address, make it default automatically
  const count = await (prisma as any).customerAddress.count({ where: { userId: user.id } })
  const makeDefault = isDefault || count === 0

  const address = await (prisma as any).customerAddress.create({
    data: {
      userId: user.id,
      label: label?.trim() || 'Home',
      address1: address1.trim(),
      address2: address2?.trim() || null,
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zipCode: zipCode.trim(),
      isDefault: makeDefault,
    },
  })

  return NextResponse.json(address, { status: 201 })
}
