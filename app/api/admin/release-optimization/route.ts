import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildDemandSnapshot } from '@/lib/demandInsights'
import { deriveReleaseOptimization } from '@/lib/releaseOptimizationEngine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/release-optimization
 *
 * Returns full release optimization analysis: per-product recommendations,
 * portfolio-level signal bias, allocation pressure list, and release monitor
 * status summary.
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

    // Persist lastRecommendationAt so freshness can be tracked on subsequent runs
    const analysedIds = result.recommendations.map((r) => r.productId)
    if (analysedIds.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: analysedIds } },
        data:  { lastRecommendationAt: new Date() },
      })
    }

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
