import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidMembershipTier, logMembershipAudit } from '@/lib/membership'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tier = searchParams.get('tier')
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined

  const where: any = {}
  if (tier && isValidMembershipTier(tier)) where.tier = tier
  if (month) where.month = month
  if (year) where.year = year

  const selections = await prisma.subscriptionSelection.findMany({
    where,
    include: { product: true },
    orderBy: [{ tier: 'asc' }, { year: 'desc' }, { month: 'desc' }, { productId: 'asc' }],
  })

  return NextResponse.json({ selections })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tier, month, year, items } = body

  if (!isValidMembershipTier(tier) || !month || !year || !Array.isArray(items)) {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.subscriptionSelection.deleteMany({ where: { tier, month, year } })

    if (items.length > 0) {
      await tx.subscriptionSelection.createMany({
        data: items.map((item: any) => ({
          tier,
          month,
          year,
          productId: item.productId,
          quantity: item.quantity,
        })),
      })
    }

    await tx.subscriptionAuditLog.create({
      data: {
        action: 'UPDATE_SELECTIONS',
        entityType: 'SubscriptionSelection',
        entityId: `${tier}-${month}-${year}`,
        details: { tier, month, year, items },
        createdBy: session.user.id,
      },
    })
  })

  return NextResponse.json({ success: true, message: 'Membership selections saved' })
}
