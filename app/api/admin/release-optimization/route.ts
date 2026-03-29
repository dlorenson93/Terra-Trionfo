import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
