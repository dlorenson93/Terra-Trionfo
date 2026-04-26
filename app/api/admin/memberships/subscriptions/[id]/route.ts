import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logMembershipAudit } from '@/lib/membership'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscriptionId = params.id
  const body = await request.json()
  const { status } = body
  const allowed = ['ACTIVE', 'PAUSED', 'CANCELLED']

  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } })
  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status },
  })

  await logMembershipAudit('UPDATE_SUBSCRIPTION_STATUS', 'Subscription', subscriptionId, { previous: subscription.status, next: status }, session.user.id)

  return NextResponse.json({ subscription: updated })
}
