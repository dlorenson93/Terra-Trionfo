import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function resolveAddress(id: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  const address = await (prisma as any).customerAddress.findFirst({
    where: { id, userId: user.id },
  })
  return address
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const address = await resolveAddress(params.id, session.user.email)
  if (!address) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { label, address1, address2, city, state, zipCode, isDefault } = body

  if (state && state.toUpperCase() !== 'MA') {
    return NextResponse.json(
      { error: 'Local delivery is currently available in Massachusetts only.' },
      { status: 400 },
    )
  }

  if (isDefault) {
    await (prisma as any).customerAddress.updateMany({
      where: { userId: address.userId },
      data: { isDefault: false },
    })
  }

  const updated = await (prisma as any).customerAddress.update({
    where: { id: params.id },
    data: {
      label: label?.trim() || address.label,
      address1: address1?.trim() || address.address1,
      address2: address2 !== undefined ? (address2?.trim() || null) : address.address2,
      city: city?.trim() || address.city,
      state: state ? state.trim().toUpperCase() : address.state,
      zipCode: zipCode?.trim() || address.zipCode,
      isDefault: isDefault ?? address.isDefault,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const address = await resolveAddress(params.id, session.user.email)
  if (!address) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await (prisma as any).customerAddress.delete({ where: { id: params.id } })

  // If the deleted address was default, promote the next one
  if (address.isDefault) {
    const next = await (prisma as any).customerAddress.findFirst({
      where: { userId: address.userId },
      orderBy: { createdAt: 'asc' },
    })
    if (next) {
      await (prisma as any).customerAddress.update({ where: { id: next.id }, data: { isDefault: true } })
    }
  }

  return NextResponse.json({ success: true })
}
