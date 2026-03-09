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
    const { isActive } = body

    const schedule = await (prisma as any).pickupSchedule.update({
      where: { id: params.id },
      data: { ...(isActive !== undefined ? { isActive } : {}) },
      include: { location: { select: { id: true, name: true, city: true, state: true } } },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Update pickup schedule error:', error)
    return NextResponse.json({ error: 'Failed to update pickup schedule' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await (prisma as any).pickupSchedule.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete pickup schedule error:', error)
    return NextResponse.json({ error: 'Failed to delete pickup schedule' }, { status: 500 })
  }
}
