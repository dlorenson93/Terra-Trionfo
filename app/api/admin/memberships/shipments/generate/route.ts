import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateSubscriptionShipments, isValidMembershipTier } from '@/lib/membership'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tier, month, year } = body

  if (!isValidMembershipTier(tier) || !month || !year) {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  }

  const result = await generateSubscriptionShipments(tier, month, year, session.user.id)
  return NextResponse.json(result)
}
