import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1',  10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip  = (page - 1) * limit

    const where: any = {}

    if (session.user.role === 'CONSUMER') {
      // Consumers see only their own orders
      where.userId = session.user.id
    } else if (session.user.role === 'VENDOR') {
      // Vendors see orders that contain at least one of their products
      const vendorCompanies = await prisma.company.findMany({
        where: { ownerId: session.user.id },
        select: { id: true },
      })
      const vendorProductIds = await prisma.product.findMany({
        where: { companyId: { in: vendorCompanies.map((c: { id: string }) => c.id) } },
        select: { id: true },
      })
      where.orderItems = {
        some: { productId: { in: vendorProductIds.map((p: { id: string }) => p.id) } },
      }
    }
    // ADMIN: no where constraint — sees all orders

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          orderItems: {
            include: {
              product: { select: { id: true, name: true, imageUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, limit, pages: Math.ceil(total / limit) })
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
      // include ecommerce fields in case needed
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
      const product = products.find((p: any) => p.id === item.productId) as any
      if (!product) continue

      if (product.inventory < item.quantity) {
        return NextResponse.json(
          { error: `Not enough inventory for ${product.name}` },
          { status: 400 }
        )
      }

      const unitPrice = product.retailPriceCents / 100
      const itemTotal = unitPrice * item.quantity
      total += itemTotal

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        commerceModel: product.commerceModel,
      })
    }

    // Create order in transaction
    const order = await prisma.$transaction(async (tx: any) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total,
          status: 'CONFIRMED',
          orderItems: {
            // cast because Prisma types may be stale
            create: orderItems as any,
          },
        } as any,
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
