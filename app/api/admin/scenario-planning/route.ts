/**
 * GET /api/admin/scenario-planning
 *
 * Phase 17 — Scenario Planning & Strategy Simulation
 *
 * Loads current demand signals, effectiveness rollups, calibration, and
 * decision quality history in parallel. Derives allocation plans, then runs
 * computeScenarioPlanning() to produce:
 *
 *   - Per-product scenario comparisons (recommended + up to 2 alternatives)
 *   - Each scenario scored by the predictive planning engine
 *   - Ranked by predicted likelihood
 *   - Portfolio-level divergence note
 *
 * Advisory only — no automation, no write operations.
 * ADMIN-ONLY. Never expose to consumers or vendors.
 */

import { NextResponse }                   from 'next/server'
import { getServerSession }               from 'next-auth'
import { authOptions }                    from '@/lib/auth'
import { prisma }                         from '@/lib/prisma'
import { buildDemandSnapshot }            from '@/lib/demandInsights'
import { deriveAllocationPlanning }       from '@/lib/allocationPlanningEngine'
import { computeEffectivenessRollups }    from '@/lib/effectivenessRollups'
import type { RollupProduct }             from '@/lib/effectivenessRollups'
import { computeCalibrationRollups }      from '@/lib/calibrationRollups'
import type { CalibrationPoint }          from '@/lib/calibrationRollups'
import { computeDecisionQualityRollups }  from '@/lib/decisionQualityRollups'
import type { DecisionRow }               from '@/lib/decisionQualityRollups'
import { computeScenarioPlanning }        from '@/lib/scenarioPlanningEngine'

export const dynamic = 'force-dynamic'

function priceTier(cents: number): string {
  if (cents < 2000)  return 'entry'
  if (cents < 5000)  return 'mid'
  if (cents < 10000) return 'premium'
  return 'ultra-premium'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const generatedAt = new Date().toISOString()

  const [snapshot, measuredRaw, historyRaw, decisionRows] = await Promise.all([

    buildDemandSnapshot(),

    (prisma.product.findMany as Function)({
      where: {
        recommendationStatus: 'ACTIONED',
        effectivenessDelta:   { not: null },
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
    }),

    (prisma as any).productRecommendationHistory.findMany({
      where: { newStatus: 'ACTIONED', baseConfidenceScore: { not: null } },
      select: {
        baseConfidenceScore:     true,
        adjustedConfidenceScore: true,
        biasApplied:             true,
        biasMultiplier:          true,
        product: {
          select: {
            effectivenessDelta:             true,
            recommendationResolutionStatus: true,
          },
        },
      },
    }),

    (prisma as any).productPlanningDecision.findMany({
      orderBy: { plannedAt: 'desc' },
      select: {
        id:                          true,
        productId:                   true,
        decisionStatus:              true,
        recommendedAllocationSizing: true,
        selectedAllocationSizing:    true,
        executedAllocationSizing:    true,
        recommendedReleaseTiming:    true,
        selectedReleaseTiming:       true,
        executedReleaseTiming:       true,
        recommendedRolloutMode:      true,
        selectedRolloutMode:         true,
        executedRolloutMode:         true,
        recommendedPlanConfidence:   true,
        executionStatus:             true,
        planAdherence:               true,
      },
    }),
  ])

  // ── Effectiveness rollups ────────────────────────────────────────────────────
  let rollups = null
  try {
    if ((measuredRaw as RollupProduct[]).length > 0) {
      rollups = computeEffectivenessRollups(measuredRaw as RollupProduct[])
    }
  } catch { /* non-fatal */ }

  // ── Calibration ──────────────────────────────────────────────────────────────
  let calibration = null
  try {
    const pts: CalibrationPoint[] = (historyRaw as any[]).map(r => ({
      baseConfidenceScore:       r.baseConfidenceScore,
      adjustedConfidenceScore:   r.adjustedConfidenceScore,
      biasApplied:               r.biasApplied,
      biasMultiplier:            r.biasMultiplier,
      productEffectivenessDelta: r.product?.effectivenessDelta ?? null,
      productResolutionStatus:   r.product?.recommendationResolutionStatus ?? null,
    }))
    if (pts.length > 0) calibration = computeCalibrationRollups(pts)
  } catch { /* non-fatal */ }

  // ── Allocation plans ─────────────────────────────────────────────────────────
  const { plans } = deriveAllocationPlanning(snapshot, rollups, calibration)

  if (plans.length === 0) {
    return NextResponse.json({
      generatedAt,
      comparisons: [],
      portfolioNote: 'No products with sufficient signal for scenario planning.',
    })
  }

  // ── Decision quality ─────────────────────────────────────────────────────────
  let decisionQuality = null
  try {
    const dRows = decisionRows as any[]
    if (dRows.length > 0) {
      const productIds = Array.from(
        new Set(dRows.map(r => r.productId as string))
      ) as string[]

      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true, effectivenessDelta: true,
          region: true, wineStyle: true, retailPriceCents: true,
        },
      })
      const productMap = new Map(products.map(p => [p.id, p]))

      const dqRows: DecisionRow[] = dRows.map(d => {
        const product = productMap.get(d.productId)
        return {
          id: d.id, productId: d.productId,
          decisionStatus: d.decisionStatus,
          recommendedAllocationSizing: d.recommendedAllocationSizing,
          selectedAllocationSizing:    d.selectedAllocationSizing,
          executedAllocationSizing:    d.executedAllocationSizing,
          recommendedReleaseTiming:    d.recommendedReleaseTiming,
          selectedReleaseTiming:       d.selectedReleaseTiming,
          executedReleaseTiming:       d.executedReleaseTiming,
          recommendedRolloutMode:      d.recommendedRolloutMode,
          selectedRolloutMode:         d.selectedRolloutMode,
          executedRolloutMode:         d.executedRolloutMode,
          recommendedPlanConfidence:   d.recommendedPlanConfidence,
          executionStatus:             d.executionStatus ?? 'PENDING',
          planAdherence:               d.planAdherence,
          effectivenessDelta:          product?.effectivenessDelta ?? null,
          region:                      product?.region             ?? null,
          wineStyle:                   product?.wineStyle          ?? null,
          priceTier:                   product ? priceTier(product.retailPriceCents ?? 0) : null,
        }
      })

      decisionQuality = computeDecisionQualityRollups(dqRows)
    }
  } catch { /* non-fatal */ }

  // ── Scenario planning ─────────────────────────────────────────────────────────
  const output = computeScenarioPlanning(plans, decisionQuality, rollups, generatedAt)

  return NextResponse.json(output)
}
