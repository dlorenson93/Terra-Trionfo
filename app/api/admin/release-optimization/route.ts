import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildDemandSnapshot } from '@/lib/demandInsights'
import {
  deriveReleaseOptimization,
  deriveReleaseHealth,
  deriveExposureTier,
} from '@/lib/releaseOptimizationEngine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/release-optimization
 *
 * Returns full release optimization analysis: per-product recommendations,
 * portfolio-level signal bias, allocation pressure list, and release monitor
 * status summary.
 *
 * After computing, persists releaseMonitorStatus, exposureTier, and
 * lastRecommendationAt back to the DB for every analysed product so that
 * the Products tab can display intelligence state without re-running the engine.
 *
 * ADMIN-ONLY — never expose to consumers or vendors.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const snapshot = await buildDemandSnapshot()
    const result   = deriveReleaseOptimization(snapshot)

    // Persist computed intelligence state for EVERY analysed product.
    // We call the helpers directly on the snapshot so products that matched no
    // recommendation rule still get their monitor status and exposure tier written.
    const now = new Date()
    await Promise.all(
      snapshot.products.map((sig) =>
        prisma.product.update({
          where: { id: sig.productId },
          data: {
            releaseMonitorStatus:  deriveReleaseHealth(sig),
            exposureTier:          deriveExposureTier(sig),
            lastRecommendationAt:  now,
          },
        }),
      ),
    )

    return NextResponse.json({
      generatedAt: snapshot.generatedAt,
      ...result,
    })
  } catch (error) {
    console.error('[Release Optimization]', error)
    return NextResponse.json(
      { error: 'Failed to generate release optimization data.' },
      { status: 500 },
    )
  }
}
