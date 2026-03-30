/**
 * GET /api/admin/strategy-patterns
 *
 * Phase 18 — Portfolio Strategy Memory & Pattern Library
 *
 * Loads all planning decision rows joined with product outcome data, plus
 * effectiveness rollups, then runs computeStrategyPatterns() to produce:
 *
 *   - winningPatterns: recurring cross-dimensional strategy moves that work
 *   - riskPatterns:    recurring strategy moves that underperform
 *   - portfolioInsight: synthesis sentence
 *
 * Advisory only. Never modifies any data.
 * ADMIN-ONLY. Never expose to consumers or vendors.
 */

import { NextResponse }                from 'next/server'
import { getServerSession }            from 'next-auth'
import { authOptions }                 from '@/lib/auth'
import { prisma }                      from '@/lib/prisma'
import { computeEffectivenessRollups } from '@/lib/effectivenessRollups'
import type { RollupProduct }          from '@/lib/effectivenessRollups'
import { computeStrategyPatterns }     from '@/lib/strategyPatternEngine'
import type { DecisionRow }            from '@/lib/decisionQualityRollups'

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

  // Load planning decisions + effectiveness source in parallel
  const [decisionRows, measuredRaw] = await Promise.all([
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
  ])

  // Build effectiveness rollups
  let rollups = null
  try {
    if ((measuredRaw as RollupProduct[]).length > 0) {
      rollups = computeEffectivenessRollups(measuredRaw as RollupProduct[])
    }
  } catch { /* non-fatal */ }

  // Join decisions with product context
  let dqRows: DecisionRow[] = []
  try {
    const dRows = decisionRows as any[]
    if (dRows.length > 0) {
      const productIds = Array.from(
        new Set(dRows.map(r => r.productId as string))
      ) as string[]

      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id:                 true,
          effectivenessDelta: true,
          region:             true,
          wineStyle:          true,
          retailPriceCents:   true,
        },
      })
      const productMap = new Map(products.map(p => [p.id, p]))

      dqRows = dRows.map(d => {
        const product = productMap.get(d.productId)
        return {
          id:                          d.id,
          productId:                   d.productId,
          decisionStatus:              d.decisionStatus,
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
    }
  } catch { /* non-fatal */ }

  const output = computeStrategyPatterns(dqRows, rollups, generatedAt)

  return NextResponse.json(output)
}
