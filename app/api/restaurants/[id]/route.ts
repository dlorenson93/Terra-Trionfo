import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const isPublic = !session || session.user.role === 'CONSUMER'

    // Support lookup by either id or slug
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
        ...(isPublic ? { status: 'APPROVED', contentStatus: 'LIVE' } : {}),
      },
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
                grapeVarietals: true,
                tastingNotesShort: true,
                retailPriceCents: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Get restaurant error:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name, slug, description, website,
      address, city, state, zipCode,
      latitude, longitude, heroImageUrl,
      cuisineType, priceRange, isFeatured,
      status, contentStatus,
    } = body

    const data: any = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (description !== undefined) data.description = description
    if (website !== undefined) data.website = website
    if (address !== undefined) data.address = address
    if (city !== undefined) data.city = city
    if (state !== undefined) data.state = state
    if (zipCode !== undefined) data.zipCode = zipCode
    if (latitude !== undefined) data.latitude = latitude ? parseFloat(latitude) : null
    if (longitude !== undefined) data.longitude = longitude ? parseFloat(longitude) : null
    if (heroImageUrl !== undefined) data.heroImageUrl = heroImageUrl
    if (cuisineType !== undefined) data.cuisineType = cuisineType
    if (priceRange !== undefined) data.priceRange = priceRange
    if (isFeatured !== undefined) data.isFeatured = isFeatured
    if (status !== undefined) data.status = status
    if (contentStatus !== undefined) data.contentStatus = contentStatus

    const restaurant = await prisma.restaurant.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Update restaurant error:', error)
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 })
  }
}
