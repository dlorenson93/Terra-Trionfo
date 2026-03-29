/**
 * GET /api/admin/calibration-rollups
 *
 * Computes recommendation calibration metrics by comparing the confidence
 * snapshots captured at ACTIONED time against each product's eventual
 * effectiveness outcome.
 *
 * Answers:
 *   - When the system said "high confidence", was it right more often?
 *   - Do bias-adjusted recommendations resolve better than unbiased ones?
 *   - Is the adjusted confidence score more calibrated than the base score?
 *
 * ADMIN-only. Pure aggregate output — no raw product data exposed.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeCalibrationRollups } from '@/lib/calibrationRollups'
import type { CalibrationPoint } from '@/lib/calibrationRollups'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Query ACTIONED history rows that have a confidence snapshot, joined with
  // the product's current effectiveness outcome.
  // Only rows where baseConfidenceScore is non-null have calibration data.
  const historyRows = await (prisma as any).productRecommendationHistory.findMany({
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
    orderBy: { createdAt: 'desc' },
  })

  const points: CalibrationPoint[] = historyRows.map((row: any) => ({
    baseConfidenceScore:       row.baseConfidenceScore,
    adjustedConfidenceScore:   row.adjustedConfidenceScore,
    biasApplied:               row.biasApplied,
    biasMultiplier:            row.biasMultiplier,
    productEffectivenessDelta: row.product?.effectivenessDelta          ?? null,
    productResolutionStatus:   row.product?.recommendationResolutionStatus ?? null,
  }))

  const calibration = computeCalibrationRollups(points)

  return NextResponse.json({
    calibration,
    computedAt: new Date().toISOString(),
  })
}
