/**
 * GET /api/admin/effectiveness-rollups
 *
 * Computes portfolio-level effectiveness rollups across action types,
 * regions, styles, and price tiers. Also derives learning signals,
 * Phase 10 bias-engine weights, and persists the current data sufficiency
 * status on the BiasGovernance singleton.
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
import {
  deriveBiasDataSufficiency,
  isBiasSafeToApply,
}                                         from '@/lib/deriveBiasDataSufficiency'

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
  const totalMeasured = rollups.portfolioSummary.totalMeasured

  // ── Derive learning signals ───────────────────────────────────────────────
  const learningSignals = deriveLearningSignals(rollups)

  // ── Derive Phase 10 bias weights ──────────────────────────────────────────
  const biasWeights = deriveRecommendationBias(learningSignals, totalMeasured)

  // ── Derive + persist data sufficiency on governance singleton ─────────────
  const sufficiencyStatus = deriveBiasDataSufficiency(totalMeasured)
  const governance = await (prisma as any).biasGovernance.upsert({
    where:  { id: 'singleton' },
    create: {
      id:                        'singleton',
      biasEnabled:               false,
      biasMode:                  'OBSERVE_ONLY',
      biasDataSufficiencyStatus: sufficiencyStatus,
      biasLastComputedAt:        new Date(),
      totalMeasuredAtLastCompute: totalMeasured,
      updatedAt:                 new Date(),
    },
    update: {
      biasDataSufficiencyStatus:  sufficiencyStatus,
      biasLastComputedAt:         new Date(),
      totalMeasuredAtLastCompute: totalMeasured,
    },
  })

  const safeToApply = isBiasSafeToApply(totalMeasured, governance.biasEnabled, governance.biasMode)

  return NextResponse.json({
    rollups,
    learningSignals,
    biasWeights,
    governance: { ...governance, safeToApply },
    computedAt: new Date().toISOString(),
  })
}
