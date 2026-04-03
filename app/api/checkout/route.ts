import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { checkoutSchema } from '@/lib/validation/checkout'

export const dynamic = 'force-dynamic'
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
    let deliveryFeeCents = 0
    if (fulfillmentType === 'LOCAL_DELIVERY') {
      if (!zoneId || !scheduledDate) {
        return NextResponse.json({ error: 'Delivery zone and scheduled date are required' }, { status: 400 })
      }

      const date = new Date(scheduledDate)
      const weekday = date.getDay()

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

      deliveryFeeCents = settings?.deliveryFeeCents || 0
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

    // calculate totals in cents for Stripe and in dollars for DB
    const itemsTotal = items.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId)! as any
      return sum + prod.retailPriceCents * item.quantity
    }, 0)
    const totalDollars = (itemsTotal + deliveryFeeCents) / 100

    // Create pending order in DB — no inventory decrement here.
    // Inventory decrements only after Stripe confirms payment via webhook.
    const order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          userId: session.user.id,
          total: totalDollars,
          status: 'PENDING',
          fulfillmentType: fulfillmentType as any,
          deliveryFeeCents,
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
    })

    // Build Stripe line items
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://terratrionfo.com'

    const lineItems = items.map((item) => {
      const prod = products.find((p) => p.id === item.productId)! as any
      return {
        price_data: {
          currency: 'usd',
          unit_amount: prod.retailPriceCents,
          product_data: {
            name: prod.name,
            ...(prod.imageUrl ? { images: [prod.imageUrl] } : {}),
          },
        },
        quantity: item.quantity,
      }
    })

    // Add delivery fee as a separate line item if applicable
    if (deliveryFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: deliveryFeeCents,
          product_data: { name: 'Delivery Fee' },
        },
        quantity: 1,
      })
    }

    // Create Stripe CheckoutSession — orderId in metadata so webhook can confirm it
    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      metadata: { orderId: order.id },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`,
      cancel_url: `${origin}/cart`,
      customer_email: session.user.email ?? undefined,
    })

    // Persist stripeSessionId on the order for webhook lookup
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: stripeSession.id } as any,
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 })
  }
}
