import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { isActive, description } = body

    const zone = await (prisma as any).deliveryZone.update({
      where: { id: params.id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    })

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Update delivery zone error:', error)
    return NextResponse.json({ error: 'Failed to update delivery zone' }, { status: 500 })
  }
}
