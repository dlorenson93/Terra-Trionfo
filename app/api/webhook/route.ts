import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

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
        include: { orderItems: true },
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

  return NextResponse.json({ received: true })
}
