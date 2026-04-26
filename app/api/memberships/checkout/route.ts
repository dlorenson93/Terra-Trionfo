import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { getStripePriceId, isValidMembershipTier } from '@/lib/membership'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const tier = body?.tier

  if (!isValidMembershipTier(tier)) {
    return NextResponse.json({ error: 'Invalid membership tier' }, { status: 400 })
  }

  let priceId: string
  try {
    priceId = getStripePriceId(tier)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  try {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      metadata: { userId: session.user.id, tier },
    })

    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://terratrionfo.com'

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          tier,
          userId: session.user.id,
        },
      },
      metadata: {
        userId: session.user.id,
        tier,
      },
      success_url: `${origin}/membership/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/membership`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('[membership checkout] Error:', err)
    return NextResponse.json({ error: 'Failed to create membership checkout session' }, { status: 500 })
  }
}
