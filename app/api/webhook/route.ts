import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmation } from '@/lib/email'
import { generateSubscriptionShipmentForSubscription, MEMBERSHIP_TIERS } from '@/lib/membership'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const isSubscriptionCheckout = session.mode === 'subscription' || !!session.subscription
    const tier = session.metadata?.tier
    const userId = session.metadata?.userId

    if (isSubscriptionCheckout && tier && userId && session.subscription) {
      try {
        const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
        const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
        const item = stripeSubscription.items.data[0]
        const monthlyPriceCents = item?.price?.unit_amount ?? 0
        const currentPeriodEnd = stripeSubscription.current_period_end

        const existingSubscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId },
        })

        if (existingSubscription) {
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: 'ACTIVE',
              monthlyPriceCents,
              nextBillingDate: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
            },
          })
        } else {
          await prisma.subscription.create({
            data: {
              userId,
              tier: tier as any,
              status: 'ACTIVE',
              monthlyPriceCents,
              bottlesPerMonth: MEMBERSHIP_TIERS[tier as keyof typeof MEMBERSHIP_TIERS].bottlesPerMonth,
              stripeSubscriptionId,
              nextBillingDate: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
            },
          })
        }

        console.log(`✅ Membership subscription created or updated for ${stripeSubscriptionId}`)
        return NextResponse.json({ received: true })
      } catch (error) {
        console.error('Error creating membership subscription:', error)
        return NextResponse.json({ error: 'Failed to create membership subscription' }, { status: 500 })
      }
    }

    const orderId = session.metadata?.orderId

    if (!orderId) {
      console.error('No orderId in session metadata')
      return NextResponse.json({ error: 'No orderId found' }, { status: 400 })
    }

    try {
      // Update order status to confirmed
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
        },
      })

      // Decrement inventory for each product
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: { product: { select: { name: true } } },
          },
          user: { select: { name: true, email: true } },
        },
      })

      if (order) {
        for (const item of order.orderItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              inventory: {
                decrement: item.quantity,
              },
            },
          })
        }

        // Send order confirmation email
        if (order.user?.email) {
          await sendOrderConfirmation({
            to:           order.user.email,
            customerName: order.user.name ?? 'Valued Customer',
            orderId:      order.id,
            orderItems:   order.orderItems.map((item) => ({
              productName: item.product.name,
              quantity:    item.quantity,
              unitPrice:   item.unitPrice,
            })),
            total:           order.total,
            fulfillmentType: order.fulfillmentType,
          })
        }
      }

      console.log(`✅ Payment confirmed for order ${orderId}`)
    } catch (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const stripeSubscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id

    if (stripeSubscriptionId) {
      try {
        const subscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId },
        })

        if (subscription && subscription.status === 'ACTIVE') {
          const periodStart = invoice.period_start
            ? new Date(invoice.period_start * 1000)
            : new Date()
          const month = periodStart.getMonth() + 1
          const year = periodStart.getFullYear()

          const result = await generateSubscriptionShipmentForSubscription(
            subscription.id,
            month,
            year,
            'stripe-webhook',
          )

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              nextBillingDate: invoice.current_period_end
                ? new Date(invoice.current_period_end * 1000)
                : null,
            },
          })

          if (!result.success) {
            console.warn('Subscription shipment generation issue:', result.issues || result.message)
          }
        }
      } catch (error) {
        console.error('Error processing subscription invoice:', error)
      }
    }
  }

  return NextResponse.json({ received: true })
}
