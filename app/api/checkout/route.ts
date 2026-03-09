import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkoutSchema } from '@/lib/validation/checkout'
// local union type for fulfillment

type Fulfillment = 'PICKUP' | 'LOCAL_DELIVERY' | 'SHIP'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.errors }, { status: 400 })
    }

    const { items, fulfillmentType, zoneId, scheduledDate, pickupLocationId } = parsed.data

    // shipping is forbidden for consumers
    if (fulfillmentType === 'SHIP') {
      return NextResponse.json({ error: 'Shipping is not available at this time.' }, { status: 400 })
    }

    // fetch settings for delivery fee
    const settingsRaw = await prisma.settings.findUnique({ where: { id: 'default' } })
    const settings = settingsRaw as any

    // fetch products
    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'APPROVED' },
    })

    if (products.length !== items.length) {
      return NextResponse.json({ error: 'Some products are unavailable' }, { status: 400 })
    }

    // validate fulfillment support and inventory
    for (const item of items) {
      const prodRaw = products.find((p) => p.id === item.productId)!
      const prod = prodRaw as any
      if (!prod.allowedFulfillment.includes(fulfillmentType as Fulfillment)) {
        return NextResponse.json({ error: `Product ${prod.name} does not support ${fulfillmentType}` }, { status: 400 })
      }
      if (prod.inventory < item.quantity) {
        return NextResponse.json({ error: `Insufficient inventory for ${prod.name}` }, { status: 400 })
      }
    }

    // local delivery validation — route-based
    let deliveryFee = 0
    if (fulfillmentType === 'LOCAL_DELIVERY') {
      if (!zoneId || !scheduledDate) {
        return NextResponse.json({ error: 'Delivery zone and scheduled date are required' }, { status: 400 })
      }

      const date = new Date(scheduledDate)
      const weekday = date.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

      const route = await (prisma as any).deliveryRoute.findFirst({
        where: { zoneId, deliveryDay: weekday, isActive: true },
      })

      if (!route) {
        const zoneInfo = await (prisma as any).deliveryZone.findUnique({ where: { id: zoneId }, select: { name: true } })
        const zoneName = zoneInfo?.name || 'your region'
        return NextResponse.json({
          error: `Delivery is not available in ${zoneName} on ${DAY_NAMES[weekday]}. Please select a valid delivery date for your region.`,
        }, { status: 400 })
      }

      deliveryFee = settings?.deliveryFeeCents || 0
    }

    // pickup validation — schedule-based
    if (fulfillmentType === 'PICKUP') {
      if (!pickupLocationId) {
        return NextResponse.json({ error: 'A pickup location is required' }, { status: 400 })
      }

      if (scheduledDate) {
        const date = new Date(scheduledDate)
        const weekday = date.getDay()

        const schedule = await (prisma as any).pickupSchedule.findFirst({
          where: { locationId: pickupLocationId, pickupDay: weekday, isActive: true },
        })

        if (!schedule) {
          return NextResponse.json({
            error: `Pickup is not available on ${DAY_NAMES[weekday]}. Please select a scheduled pickup day.`,
          }, { status: 400 })
        }
      }
    }

    // calculate totals in dollars for order
    const total = items.reduce((sum, item) => {
      const prodRaw = products.find((p) => p.id === item.productId)!
      const prod = prodRaw as any
      return sum + (prod.retailPriceCents / 100) * item.quantity
    }, 0)

    // perform transactional write: create order, items, decrement inventory
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total,
          status: 'PENDING',
          fulfillmentType: fulfillmentType as any,
          deliveryFeeCents: deliveryFee,
          scheduledDeliveryDate: scheduledDate ? new Date(scheduledDate) : null,
          pickupLocationId: fulfillmentType === 'PICKUP' ? pickupLocationId : null,
          orderItems: {
            create: items.map((item) => {
              const prod = products.find((p) => p.id === item.productId)! as any
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: prod.retailPriceCents / 100,
                commerceModel: prod.commerceModel,
              }
            }) as any,
          },
        } as any,
      })

      // decrement inventory
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { inventory: { decrement: item.quantity } },
        })
      }

      return newOrder
    })

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 })
  }
}
