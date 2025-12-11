import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      )
    }

    const { items } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Fetch product details with pricing
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'APPROVED',
      },
    })

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: 'Some products are unavailable' },
        { status: 400 }
      )
    }

    // Create Stripe line items
    const lineItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) throw new Error('Product not found')

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: product.imageUrl ? [product.imageUrl] : [],
          },
          unit_amount: Math.round(product.consumerPrice * 100), // Convert to cents
        },
        quantity: item.quantity,
      }
    })

    // Calculate total for order creation
    const total = items.reduce((sum: number, item: any) => {
      const product = products.find((p) => p.id === item.productId)
      return sum + (product?.consumerPrice || 0) * item.quantity
    }, 0)

    // Create pending order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        total,
        status: 'PENDING',
        orderItems: {
          create: items.map((item: any) => {
            const product = products.find((p) => p.id === item.productId)!
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: product.consumerPrice,
              modelType: product.isMarketplace ? 'MARKETPLACE' : 'WHOLESALE',
            }
          }),
        },
      },
    })

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
      metadata: {
        orderId: order.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
