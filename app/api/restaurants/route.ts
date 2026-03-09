import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const session = await getServerSession(authOptions)
    const isPublic = !session || session.user.role === 'CONSUMER'

    const where: any = {}
    if (isPublic) {
      where.status = 'APPROVED'
      where.contentStatus = 'LIVE'
    }
    if (featured === 'true') {
      where.isFeatured = true
    }

    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        wines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                imageUrl: true,
                vintage: true,
                appellation: true,
              },
            },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json(restaurants)
  } catch (error) {
    console.error('Get restaurants error:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name, slug, description, website,
      address, city, state, zipCode,
      latitude, longitude,
      heroImageUrl, cuisineType, priceRange,
    } = body

    if (!name || !slug || !address || !city || !state || !zipCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        slug,
        description: description || null,
        website: website || null,
        address,
        city,
        state,
        zipCode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        heroImageUrl: heroImageUrl || null,
        cuisineType: cuisineType || null,
        priceRange: priceRange || null,
      },
    })

    return NextResponse.json(restaurant, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }
    console.error('Create restaurant error:', error)
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 })
  }
}
