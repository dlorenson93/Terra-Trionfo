import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const isPublic = !session || session.user.role === 'CONSUMER'

    const locations = await prisma.pickupLocation.findMany({
      where: {
        isActive: true,
        ...(isPublic ? { status: 'APPROVED', contentStatus: 'LIVE' } : {}),
      },
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Pickup locations fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch pickup locations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, city, state, zipCode, latitude, longitude, partnerType } = body

    if (!name || !address || !city || !state) {
      return NextResponse.json({ error: 'name, address, city, and state are required' }, { status: 400 })
    }

    const location = await prisma.pickupLocation.create({
      data: {
        name,
        address,
        city,
        state,
        zipCode: zipCode || '',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        partnerType: partnerType || 'WAREHOUSE',
      },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Create pickup location error:', error)
    return NextResponse.json({ error: 'Failed to create pickup location' }, { status: 500 })
  }
}
