import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Run all queries in parallel
    const [
      waitlistCounts,
      tradeInterestCounts,
      recentOrderItems,
      liveProducts,
    ] = await Promise.all([
      // Waitlist signups per product
      (prisma as any).waitlist.groupBy({
        by: ['productId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),

      // Trade interest per product
      (prisma as any).tradeInterest.groupBy({
        by: ['productId'],
        _count: { id: true },
        _sum: { caseInterest: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),

      // Order line items in last 30 days
      prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: thirtyDaysAgo } } },
        select: { productId: true, quantity: true, unitPrice: true },
      }),

      // All live products for context
      prisma.product.findMany({
        where: { status: 'APPROVED', contentStatus: 'LIVE' },
        select: {
          id: true,
          name: true,
          region: true,
          isLimitedAllocation: true,
          retailPriceCents: true,
          inventory: true,
          company: { select: { name: true } },
        },
      }),
    ])

    // Build lookup maps
    const productMap = new Map(liveProducts.map((p: any) => [p.id, p]))

    // Order volume per product (last 30 days)
    const orderVolume = new Map<string, { units: number; revenue: number }>()
    for (const item of recentOrderItems) {
      const existing = orderVolume.get(item.productId) ?? { units: 0, revenue: 0 }
      orderVolume.set(item.productId, {
        units: existing.units + item.quantity,
        revenue: existing.revenue + item.unitPrice * item.quantity,
      })
    }

    // ── High demand: products with most waitlist signups ──────────────
    const highDemand = waitlistCounts
      .map((row: any) => ({
        productId: row.productId,
        productName: productMap.get(row.productId)?.name ?? 'Unknown',
        company: productMap.get(row.productId)?.company?.name ?? '',
        waitlistSignups: row._count.id,
        recentOrders: orderVolume.get(row.productId)?.units ?? 0,
      }))
      .slice(0, 10)

    // ── Allocation pressure: limited-allocation products with demand ───
    const allocationPressure = waitlistCounts
      .filter((row: any) => productMap.get(row.productId)?.isLimitedAllocation)
      .map((row: any) => {
        const p = productMap.get(row.productId)
        return {
          productId: row.productId,
          productName: p?.name ?? 'Unknown',
          company: p?.company?.name ?? '',
          waitlistSignups: row._count.id,
          currentInventory: p?.inventory ?? 0,
          pressureScore: row._count.id / Math.max(1, p?.inventory ?? 1),
        }
      })
      .sort((a: any, b: any) => b.pressureScore - a.pressureScore)
      .slice(0, 10)

    // ── Trade signals: products with B2B interest ─────────────────────
    const tradeSignals = tradeInterestCounts
      .map((row: any) => ({
        productId: row.productId,
        productName: productMap.get(row.productId)?.name ?? 'Unknown',
        company: productMap.get(row.productId)?.company?.name ?? '',
        tradeInquiries: row._count.id,
        totalCaseInterest: row._sum?.caseInterest ?? 0,
      }))
      .slice(0, 10)

    // ── Low conversion: live products with no recent orders ───────────
    const lowConversion = liveProducts
      .filter((p: any) => !orderVolume.has(p.id))
      .map((p: any) => ({
        productId: p.id,
        productName: p.name,
        company: p.company?.name ?? '',
        region: p.region ?? '',
        retailPriceCents: p.retailPriceCents,
        daysSinceListed: null, // could compute from createdAt if needed
      }))
      .slice(0, 10)

    // ── Upcoming release interest: non-live products with waitlist ─────
    const nonLiveProductIds = waitlistCounts
      .map((row: any) => row.productId)
      .filter((id: string) => !productMap.has(id))

    const upcomingProducts = nonLiveProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: nonLiveProductIds } },
          select: {
            id: true,
            name: true,
            contentStatus: true,
            company: { select: { name: true } },
          },
        })
      : []

    const upcomingInterest = upcomingProducts.map((p: any) => {
      const wl = waitlistCounts.find((row: any) => row.productId === p.id)
      return {
        productId: p.id,
        productName: p.name,
        company: p.company?.name ?? '',
        contentStatus: p.contentStatus,
        waitlistSignups: wl?._count?.id ?? 0,
      }
    }).sort((a: any, b: any) => b.waitlistSignups - a.waitlistSignups)

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      highDemand,
      allocationPressure,
      tradeSignals,
      lowConversion,
      upcomingReleaseInterest: upcomingInterest,
    })
  } catch (error) {
    console.error('[Admin Insights]', error)
    return NextResponse.json({ error: 'Failed to generate insights.' }, { status: 500 })
  }
}
