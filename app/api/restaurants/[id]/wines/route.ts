import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/restaurants/[id]/wines — assign a wine to a restaurant
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, servingType, notes } = await request.json()

    if (!productId || !servingType) {
      return NextResponse.json({ error: 'productId and servingType are required' }, { status: 400 })
    }

    if (!['BY_GLASS', 'BOTTLE_LIST'].includes(servingType)) {
      return NextResponse.json({ error: 'servingType must be BY_GLASS or BOTTLE_LIST' }, { status: 400 })
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({ where: { id: params.id } })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const restaurantWine = await prisma.restaurantWine.upsert({
      where: { restaurantId_productId: { restaurantId: params.id, productId } },
      create: {
        restaurantId: params.id,
        productId,
        servingType,
        notes: notes || null,
      },
      update: {
        servingType,
        notes: notes || null,
      },
      include: {
        product: { select: { id: true, name: true, category: true, vintage: true } },
      },
    })

    return NextResponse.json(restaurantWine, { status: 201 })
  } catch (error) {
    console.error('Assign wine to restaurant error:', error)
    return NextResponse.json({ error: 'Failed to assign wine' }, { status: 500 })
  }
}

// DELETE /api/restaurants/[id]/wines?productId=xxx — remove wine from restaurant
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId query parameter required' }, { status: 400 })
    }

    await prisma.restaurantWine.deleteMany({
      where: { restaurantId: params.id, productId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove wine from restaurant error:', error)
    return NextResponse.json({ error: 'Failed to remove wine' }, { status: 500 })
  }
}
