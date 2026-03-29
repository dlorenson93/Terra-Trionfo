/**
 * GET /api/admin/effectiveness-rollups
 *
 * Computes portfolio-level effectiveness rollups across action types,
 * regions, styles, and price tiers. Also derives learning signals and
 * Phase 10 bias-engine weights.
 *
 * ADMIN-only. Never exposes raw product data — output is aggregate only.
 */

import { NextResponse }                   from 'next/server'
import { getServerSession }               from 'next-auth'
import { authOptions }                    from '@/lib/auth'
import { prisma }                         from '@/lib/prisma'
import { computeEffectivenessRollups }    from '@/lib/effectivenessRollups'
import type { RollupProduct }             from '@/lib/effectivenessRollups'
import { deriveLearningSignals }          from '@/lib/deriveLearningSignals'
import { deriveRecommendationBias }       from '@/lib/recommendationBiasEngine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // ── Query: all ACTIONED products with a measured effectiveness delta ──────
  const rawProducts = await (prisma.product.findMany as Function)({
    where: {
      recommendationStatus:  'ACTIONED',
      effectivenessDelta:    { not: null },
    },
    select: {
      id:                       true,
      recommendationStatus:     true,
      recommendationActionType: true,
      effectivenessDelta:       true,
      preActionSignalScore:     true,
      postActionSignalScore:    true,
      releaseMonitorStatus:     true,
      exposureTier:             true,
      region:                   true,
      wineStyle:                true,
      grapeVarietals:           true,
      appellation:              true,
      retailPriceCents:         true,
    },
  }) as RollupProduct[]

  // ── Aggregate ─────────────────────────────────────────────────────────────
  const rollups = computeEffectivenessRollups(rawProducts)

  // ── Derive learning signals ───────────────────────────────────────────────
  const learningSignals = deriveLearningSignals(rollups)

  // ── Derive Phase 10 bias weights ──────────────────────────────────────────
  const biasWeights = deriveRecommendationBias(
    learningSignals,
    rollups.portfolioSummary.totalMeasured,
  )

  return NextResponse.json({
    rollups,
    learningSignals,
    biasWeights,
    computedAt: new Date().toISOString(),
  })
}
