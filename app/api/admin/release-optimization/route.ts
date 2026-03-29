import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildDemandSnapshot } from '@/lib/demandInsights'
import {
  deriveReleaseOptimization,
  deriveReleaseHealth,
  deriveExposureTier,
  NEUTRAL_BIAS,
} from '@/lib/releaseOptimizationEngine'
import type { BiasContext } from '@/lib/releaseOptimizationEngine'
import { computeEffectivenessRollups } from '@/lib/effectivenessRollups'
import type { RollupProduct } from '@/lib/effectivenessRollups'
import { deriveLearningSignals } from '@/lib/deriveLearningSignals'
import { deriveRecommendationBias } from '@/lib/recommendationBiasEngine'

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

    // Fetch snapshot, governance singleton, and measured products in parallel
    const [snapshot, governance, measuredRaw] = await Promise.all([
      buildDemandSnapshot(),
      (prisma as any).biasGovernance.upsert({
        where:  { id: 'singleton' },
        create: { id: 'singleton' },
        update: {},
      }),
      (prisma.product.findMany as Function)({
        where: {
          recommendationStatus: 'ACTIONED',
          effectivenessDelta:   { not: null },
        },
        select: {
          id:                   true,
          recommendationType:   true,
          recommendationConfidence: true,
          effectivenessDelta:   true,
          varietalType:         true,
          region:               true,
          pricePoint:           true,
          inventory:            true,
        },
      }),
    ])

    // Build bias context from learned weights
    let biasCtx: BiasContext = NEUTRAL_BIAS
    try {
      const rollups = computeEffectivenessRollups(measuredRaw as RollupProduct[])
      const signals = deriveLearningSignals(rollups)
      const weights = deriveRecommendationBias(signals, rollups.portfolioSummary.totalMeasured)
      biasCtx = {
        actionType:     weights.actionType,
        globalModifier: weights.globalModifier,
        biasEnabled:    governance.biasEnabled,
        biasMode:       governance.biasMode,
        totalMeasured:  rollups.portfolioSummary.totalMeasured,
      }
    } catch {
      // If bias computation fails for any reason, fall back to neutral — never block recommendations
    }

    const result = deriveReleaseOptimization(snapshot, biasCtx)

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
      biasContext: {
        active:         biasCtx.biasEnabled && biasCtx.biasMode === 'APPLY_TO_CONFIDENCE',
        mode:           biasCtx.biasMode,
        totalMeasured:  biasCtx.totalMeasured,
        globalModifier: biasCtx.globalModifier,
      },
    })
  } catch (error) {
    console.error('[Release Optimization]', error)
    return NextResponse.json(
      { error: 'Failed to generate release optimization data.' },
      { status: 500 },
    )
  }
}
