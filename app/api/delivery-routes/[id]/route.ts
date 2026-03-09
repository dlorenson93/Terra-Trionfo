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

    const route = await (prisma as any).deliveryRoute.update({
      where: { id: params.id },
      data: { ...(isActive !== undefined ? { isActive } : {}) },
      include: { zone: { select: { id: true, name: true, code: true } } },
    })

    return NextResponse.json(route)
  } catch (error) {
    console.error('Update delivery route error:', error)
    return NextResponse.json({ error: 'Failed to update delivery route' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await (prisma as any).deliveryRoute.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete delivery route error:', error)
    return NextResponse.json({ error: 'Failed to delete delivery route' }, { status: 500 })
  }
}
