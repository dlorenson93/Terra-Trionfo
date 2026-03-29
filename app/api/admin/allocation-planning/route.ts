/**
 * GET /api/admin/allocation-planning
 *
 * Phase 12 — Predictive Allocation & Release Planning
 *
 * Returns per-product allocation sizing, release timing, and rollout mode
 * suggestions backed by current demand signals, historical effectiveness
 * rollups, and calibration context.
 *
 * All suggestions are admin-only and recommendation-only — nothing is
 * auto-executed. Final decisions remain with the admin operator.
 *
 * ADMIN-ONLY. Never expose to consumers or vendors.
 */

import { NextResponse }           from 'next/server'
import { getServerSession }       from 'next-auth'
import { authOptions }            from '@/lib/auth'
import { prisma }                 from '@/lib/prisma'
import { buildDemandSnapshot }    from '@/lib/demandInsights'
import { deriveAllocationPlanning } from '@/lib/allocationPlanningEngine'
import { computeEffectivenessRollups } from '@/lib/effectivenessRollups'
import type { RollupProduct }     from '@/lib/effectivenessRollups'
import { computeCalibrationRollups } from '@/lib/calibrationRollups'
import type { CalibrationPoint }  from '@/lib/calibrationRollups'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parallel: snapshot + measured products for rollups + history rows for calibration
  const [snapshot, measuredRaw, historyRaw] = await Promise.all([
    buildDemandSnapshot(),

    // Effectiveness rollups source
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

    // Calibration source — ACTIONED history rows with confidence snapshot
    (prisma as any).productRecommendationHistory.findMany({
      where: {
        newStatus:           'ACTIONED',
        baseConfidenceScore: { not: null },
      },
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
  ])

  // Build rollups — null if no measured data yet
  let rollups = null
  try {
    if ((measuredRaw as RollupProduct[]).length > 0) {
      rollups = computeEffectivenessRollups(measuredRaw as RollupProduct[])
    }
  } catch {
    // Non-fatal — proceed without rollup context
  }

  // Build calibration — null if no snapshot data yet
  let calibration = null
  try {
    const calibPoints: CalibrationPoint[] = (historyRaw as any[]).map((row) => ({
      baseConfidenceScore:       row.baseConfidenceScore,
      adjustedConfidenceScore:   row.adjustedConfidenceScore,
      biasApplied:               row.biasApplied,
      biasMultiplier:            row.biasMultiplier,
      productEffectivenessDelta: row.product?.effectivenessDelta          ?? null,
      productResolutionStatus:   row.product?.recommendationResolutionStatus ?? null,
    }))
    if (calibPoints.length > 0) {
      calibration = computeCalibrationRollups(calibPoints)
    }
  } catch {
    // Non-fatal — proceed without calibration context
  }

  const result = deriveAllocationPlanning(snapshot, rollups, calibration)

  return NextResponse.json({
    generatedAt: snapshot.generatedAt,
    ...result,
    context: {
      rollupMeasuredCount:   (measuredRaw as RollupProduct[]).length,
      calibrationPoints:     (historyRaw as any[]).length,
      hasRollups:            rollups !== null,
      hasCalibration:        calibration !== null,
    },
  })
}
