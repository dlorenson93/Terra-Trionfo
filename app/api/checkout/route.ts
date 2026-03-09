import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkoutSchema } from '@/lib/validation/checkout'
// local union type for fulfillment

type Fulfillment = 'PICKUP' | 'LOCAL_DELIVERY' | 'SHIP'

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

    const { items, fulfillmentType, deliveryState, scheduledDate, pickupLocationId } = parsed.data

    // shipping is forbidden for consumers
    if (fulfillmentType === 'SHIP') {
      return NextResponse.json({ error: 'Shipping is not available at this time.' }, { status: 400 })
    }

    // fetch settings for delivery rules (generated type may not include the array fields)
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
      // Prisma types may not reflect the allowedFulfillment field; cast to any
      const prod = prodRaw as any
      if (!prod.allowedFulfillment.includes(fulfillmentType as Fulfillment)) {
        return NextResponse.json({ error: `Product ${prod.name} does not support ${fulfillmentType}` }, { status: 400 })
      }
      if (prod.inventory < item.quantity) {
        return NextResponse.json({ error: `Insufficient inventory for ${prod.name}` }, { status: 400 })
      }
    }

    // local delivery checks
    let deliveryFee = 0
    if (fulfillmentType === 'LOCAL_DELIVERY') {
      if (!deliveryState || !scheduledDate) {
        return NextResponse.json({ error: 'Delivery state and scheduled date required' }, { status: 400 })
      }
      if (settings && !settings.deliveryAllowedStates.includes(deliveryState)) {
        return NextResponse.json({ error: 'Delivery not available in your state' }, { status: 400 })
      }
      const date = new Date(scheduledDate)
      const weekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay() // Sunday=0
      if (settings && !settings.deliveryDaysOfWeek.includes(weekday)) {
        return NextResponse.json({ error: 'Selected delivery day is not available' }, { status: 400 })
      }
      deliveryFee = settings?.deliveryFeeCents || 0
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
            // cast to any because generated Prisma types may still expect the old `modelType` field
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
