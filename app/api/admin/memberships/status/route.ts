import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIERS, validateTierSelection, isValidMembershipTier } from '@/lib/membership'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : new Date().getMonth() + 1
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()

  const tierSummaries = await Promise.all(
    Object.keys(MEMBERSHIP_TIERS).map(async (tier) => {
      if (!isValidMembershipTier(tier)) return null

      const activeSubscriptions = await prisma.subscription.count({
        where: { tier, status: 'ACTIVE' },
      })

      const validation = await validateTierSelection(tier, month, year)
      const requiredBottles = activeSubscriptions * MEMBERSHIP_TIERS[tier].bottlesPerMonth

      return {
        tier,
        activeSubscriptions,
        requiredBottles,
        selectionCount: validation.selections?.length ?? 0,
        valid: validation.valid,
        issues: validation.issues ?? [],
        month,
        year,
      }
    })
  )

  const memberships = await prisma.subscription.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tierSummaries: tierSummaries.filter(Boolean), memberships, month, year })
}
