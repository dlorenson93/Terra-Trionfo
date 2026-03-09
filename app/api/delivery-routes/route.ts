import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET() {
  try {
    const routes = await (prisma as any).deliveryRoute.findMany({
      include: {
        zone: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ zone: { name: 'asc' } }, { deliveryDay: 'asc' }],
    })
    return NextResponse.json(routes.map((r: any) => ({ ...r, deliveryDayName: DAY_NAMES[r.deliveryDay] })))
  } catch (error) {
    console.error('Delivery routes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery routes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { zoneId, deliveryDay } = body

    if (!zoneId || deliveryDay === undefined || deliveryDay === null) {
      return NextResponse.json({ error: 'zoneId and deliveryDay are required' }, { status: 400 })
    }

    const day = parseInt(deliveryDay, 10)
    if (isNaN(day) || day < 0 || day > 6) {
      return NextResponse.json({ error: 'deliveryDay must be 0-6' }, { status: 400 })
    }

    const route = await (prisma as any).deliveryRoute.create({
      data: { zoneId, deliveryDay: day },
      include: { zone: { select: { id: true, name: true, code: true } } },
    })

    return NextResponse.json({ ...route, deliveryDayName: DAY_NAMES[route.deliveryDay] }, { status: 201 })
  } catch (error) {
    console.error('Create delivery route error:', error)
    return NextResponse.json({ error: 'Failed to create delivery route' }, { status: 500 })
  }
}
