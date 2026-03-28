import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildDemandSnapshot } from '@/lib/demandInsights'
import { deriveRecommendations } from '@/lib/importDecisionEngine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/import-recommendations
 *
 * ADMIN ONLY. Returns actionable import recommendations derived from
 * real demand signals (orders, waitlists, trade interest).
 *
 * Response includes:
 *   - recommendations: ranked ImportRecommendation[]
 *   - regionTrends:    demand level + trend per Italian region
 *   - styleTrends:     signal + recommended action per grape/style
 *   - priceTiers:      conversion strength per price band
 *   - generatedAt:     ISO timestamp
 *
 * This endpoint NEVER exposes internal signals to consumers.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const snapshot = await buildDemandSnapshot()
    const { recommendations, regionTrends, styleTrends } = deriveRecommendations(snapshot)

    return NextResponse.json({
      generatedAt: snapshot.generatedAt,
      recommendations,
      regionTrends,
      styleTrends,
      priceTiers: snapshot.priceTierAggregates,
    })
  } catch (error) {
    console.error('[Import Recommendations]', error)
    return NextResponse.json({ error: 'Failed to generate recommendations.' }, { status: 500 })
  }
}
