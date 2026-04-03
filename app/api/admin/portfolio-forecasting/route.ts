/**
 * GET /api/admin/portfolio-forecasting
 *
 * Phase 23 — Portfolio Forecasting & Import Opportunity Layer
 *
 * Synthesises demand signals, portfolio effectiveness history, and strategy
 * execution playbooks to produce forward-looking portfolio guidance:
 *
 *   - Import opportunity signals
 *   - Portfolio gap signals
 *   - Region expansion signals
 *   - Style deepening signals
 *   - Price tier opportunity signals
 *
 * Runs three data computations in parallel:
 *   1. buildDemandSnapshot()          — current demand activity
 *   2. computeEffectivenessRollups()  — historical action performance
 *   3. computeStrategyExecutionLearning() — strategy playbook memory
 *
 * Advisory only. ADMIN-ONLY. Never expose to consumers or vendors.
 */

import { NextResponse }                          from 'next/server'
import { getServerSession }                      from 'next-auth'
import { authOptions }                            from '@/lib/auth'
import { prisma }                                from '@/lib/prisma'
import { buildDemandSnapshot }                   from '@/lib/demandInsights'
import { computeEffectivenessRollups }           from '@/lib/effectivenessRollups'
import type { RollupProduct }                    from '@/lib/effectivenessRollups'
import { computeStrategyExecutionLearning }      from '@/lib/strategyExecutionLearningEngine'
import type { LearningRow }                      from '@/lib/strategyExecutionLearningEngine'
import { computePortfolioForecasting }           from '@/lib/portfolioForecastingEngine'

export const dynamic = 'force-dynamic'

// Consistent with strategy-learning route
function derivePriceTierKey(cents: number): string {
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

  // ── Parallel load: three independent data sources ─────────────────────────
  const [
    demandSnapshot,
    rollupProducts,
    [decisionRows, learningProducts],
  ] = await Promise.all([

    // 1. Demand signals — handles its own internal DB queries
    buildDemandSnapshot(),

    // 2. ACTIONED + measured products for effectiveness rollups
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
    }) as Promise<RollupProduct[]>,

    // 3. Planning decisions + products for strategy learning
    Promise.all([
      (prisma as any).productPlanningDecision.findMany({
        select: {
          id:                       true,
          productId:                true,
          decisionStatus:           true,
          selectedAllocationSizing: true,
          selectedReleaseTiming:    true,
          selectedRolloutMode:      true,
          executionStatus:          true,
          planAdherence:            true,
        },
      }),
      prisma.product.findMany({
        select: {
          id:                       true,
          region:                   true,
          wineStyle:                true,
          retailPriceCents:         true,
          recommendationActionType: true,
          effectivenessDelta:       true,
        },
      }),
    ]),

  ])

  // ── Compute effectiveness rollups ─────────────────────────────────────────
  const effectivenessRollups = computeEffectivenessRollups(rollupProducts)

  // ── Build learning rows + compute strategy learning ───────────────────────
  const productMap = new Map((learningProducts as any[]).map(p => [p.id, p]))

  const learningRows: LearningRow[] = (decisionRows as any[]).flatMap((d: any) => {
    const p = productMap.get(d.productId)
    if (!p) return []
    return [{
      id:        d.id,
      productId: d.productId,
      recommendationActionType: p.recommendationActionType ?? null,
      region:    p.region    ?? null,
      wineStyle: p.wineStyle ?? null,
      priceTier: p.retailPriceCents != null ? derivePriceTierKey(p.retailPriceCents) : null,
      selectedAllocationSizing: d.selectedAllocationSizing ?? null,
      selectedReleaseTiming:    d.selectedReleaseTiming    ?? null,
      selectedRolloutMode:      d.selectedRolloutMode      ?? null,
      decisionStatus:           d.decisionStatus,
      executionStatus:          d.executionStatus,
      planAdherence:            d.planAdherence ?? null,
      effectivenessDelta:       p.effectivenessDelta ?? null,
    } satisfies LearningRow]
  })

  const strategyLearning = computeStrategyExecutionLearning(learningRows, generatedAt)

  // ── Compute portfolio forecasting ─────────────────────────────────────────
  const output = computePortfolioForecasting(
    { demandSnapshot, effectivenessRollups, strategyLearning },
    generatedAt,
  )

  return NextResponse.json(output)
}
