import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildDemandSnapshot } from '@/lib/demandInsights'
import { deriveReleaseHealth, deriveExposureTier } from '@/lib/releaseOptimizationEngine'
import { deriveAnalysisFreshness } from '@/lib/deriveAnalysisFreshness'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/intelligence/run-all
 *
 * Rebuilds intelligence state for every APPROVED product in the catalog.
 * Builds the demand snapshot once, then derives and persists releaseMonitorStatus,
 * exposureTier, and lastRecommendationAt for each product in a single Promise.all.
 *
 * Returns a summary of counts by freshness state after the run.
 *
 * ADMIN-ONLY.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const snapshot = await buildDemandSnapshot()
    const now      = new Date()

    await Promise.all(
      snapshot.products.map((sig) =>
        prisma.product.update({
          where: { id: sig.productId },
          data: {
            releaseMonitorStatus: deriveReleaseHealth(sig),
            exposureTier:         deriveExposureTier(sig),
            lastRecommendationAt: now,
          },
        }),
      ),
    )

    // Fetch updated state to build freshness summary
    const updatedProducts = await prisma.product.findMany({
      where:  { status: 'APPROVED' },
      select: { id: true, lastRecommendationAt: true },
    })

    const freshnessCounts = { FRESH: 0, AGING: 0, STALE: 0, NEVER_RUN: 0 }
    for (const p of updatedProducts) {
      freshnessCounts[deriveAnalysisFreshness(p.lastRecommendationAt)]++
    }

    return NextResponse.json({
      updatedCount:    snapshot.products.length,
      analyzedAt:      now.toISOString(),
      freshnessCounts,
    })
  } catch (error) {
    console.error('[Intelligence Run All]', error)
    return NextResponse.json(
      { error: 'Failed to run intelligence analysis.' },
      { status: 500 },
    )
  }
}
