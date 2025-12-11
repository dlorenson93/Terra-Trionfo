import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where: any = {}

    // Consumers see their own orders
    if (session.user.role === 'CONSUMER') {
      where.userId = session.user.id
    }
    // Admin sees all orders
    // Vendors would need more complex logic to see orders containing their products

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items } = body // items: [{ productId, quantity }]

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      )
    }

    // Fetch all products and check inventory
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products not found' },
        { status: 400 }
      )
    }

    // Check inventory and calculate total
    let total = 0
    const orderItems: any[] = []

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) continue

      if (product.inventory < item.quantity) {
        return NextResponse.json(
          { error: `Not enough inventory for ${product.name}` },
          { status: 400 }
        )
      }

      const itemTotal = product.consumerPrice * item.quantity
      total += itemTotal

      // Determine model type
      let modelType = 'MARKETPLACE'
      if (product.isWholesale && !product.isMarketplace) {
        modelType = 'WHOLESALE'
      }

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.consumerPrice,
        modelType,
      })
    }

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total,
          status: 'CONFIRMED',
          orderItems: {
            create: orderItems,
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      })

      // Update inventory
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              decrement: item.quantity,
            },
          },
        })
      }

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
