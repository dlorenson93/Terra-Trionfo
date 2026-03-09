import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET() {
  try {
    const schedules = await (prisma as any).pickupSchedule.findMany({
      include: {
        location: { select: { id: true, name: true, city: true, state: true } },
      },
      orderBy: [{ location: { name: 'asc' } }, { pickupDay: 'asc' }],
    })
    return NextResponse.json(schedules.map((s: any) => ({ ...s, pickupDayName: DAY_NAMES[s.pickupDay] })))
  } catch (error) {
    console.error('Pickup schedules fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch pickup schedules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { locationId, pickupDay } = body

    if (!locationId || pickupDay === undefined || pickupDay === null) {
      return NextResponse.json({ error: 'locationId and pickupDay are required' }, { status: 400 })
    }

    const day = parseInt(pickupDay, 10)
    if (isNaN(day) || day < 0 || day > 6) {
      return NextResponse.json({ error: 'pickupDay must be 0-6' }, { status: 400 })
    }

    const schedule = await (prisma as any).pickupSchedule.create({
      data: { locationId, pickupDay: day },
      include: { location: { select: { id: true, name: true, city: true, state: true } } },
    })

    return NextResponse.json({ ...schedule, pickupDayName: DAY_NAMES[schedule.pickupDay] }, { status: 201 })
  } catch (error) {
    console.error('Create pickup schedule error:', error)
    return NextResponse.json({ error: 'Failed to create pickup schedule' }, { status: 500 })
  }
}
