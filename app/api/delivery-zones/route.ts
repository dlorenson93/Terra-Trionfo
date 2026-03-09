import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const zones = await (prisma as any).deliveryZone.findMany({
      where: { isActive: true },
      include: {
        routes: {
          where: { isActive: true },
          select: { id: true, deliveryDay: true, isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(zones)
  } catch (error) {
    console.error('Delivery zones fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery zones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'name and code are required' }, { status: 400 })
    }

    const zone = await (prisma as any).deliveryZone.create({
      data: { name, code: code.toUpperCase(), description: description || null },
    })

    return NextResponse.json(zone, { status: 201 })
  } catch (error) {
    console.error('Create delivery zone error:', error)
    return NextResponse.json({ error: 'Failed to create delivery zone' }, { status: 500 })
  }
}
