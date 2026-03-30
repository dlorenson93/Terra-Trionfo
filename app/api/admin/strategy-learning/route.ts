/**
 * GET /api/admin/strategy-learning
 *
 * Phase 22 — Strategy Execution Learning Loop & Playbook Candidate Engine
 *
 * Loads all planning decisions with execution data, joins with product context,
 * and calls computeStrategyExecutionLearning() to produce:
 *
 *   - Playbook candidates (repeat-winning strategy combinations)
 *   - Risk playbooks (repeat-failing patterns)
 *   - Execution learning summary
 *   - Portfolio learning coverage metrics
 *
 * Does NOT duplicate effectivenessRollups, strategyPatternEngine, or
 * planningAttributionRollups — this sits above those as a synthesis layer.
 *
 * Advisory only. ADMIN-ONLY. Never expose to consumers or vendors.
 */

import { NextResponse }                          from 'next/server'
import { getServerSession }                      from 'next-auth'
import { authOptions }                           from '@/lib/auth'
import { prisma }                                from '@/lib/prisma'
import { computeStrategyExecutionLearning }      from '@/lib/strategyExecutionLearningEngine'
import type { LearningRow }                      from '@/lib/strategyExecutionLearningEngine'

export const dynamic = 'force-dynamic'

// Consistent with decision-quality, predictive-planning, scenario-planning routes
function derivePriceTier(cents: number): string {
  if (cents < 2000)  return 'entry'          // < $20
  if (cents < 5000)  return 'mid'            // $20–$49
  if (cents < 10000) return 'premium'        // $50–$99
  return                    'ultra-premium'  // $100+
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const generatedAt = new Date().toISOString()

  // ── Parallel load: decisions + product context ────────────────────────────
  const [decisionRows, products] = await Promise.all([

    (prisma as any).productPlanningDecision.findMany({
      // Load all rows — the engine handles lifecycle filtering
      select: {
        id:                      true,
        productId:               true,
        decisionStatus:          true,
        selectedAllocationSizing: true,
        selectedReleaseTiming:   true,
        selectedRolloutMode:     true,
        executionStatus:         true,
        planAdherence:           true,
      },
    }),

    prisma.product.findMany({
      select: {
        id:                      true,
        region:                  true,
        wineStyle:               true,
        retailPriceCents:        true,
        recommendationActionType: true,
        effectivenessDelta:      true,
      },
    }),

  ])

  // ── Join: enrich each decision row with product context ───────────────────
  const productMap = new Map((products as any[]).map(p => [p.id, p]))

  const learningRows: LearningRow[] = (decisionRows as any[]).flatMap(d => {
    const p = productMap.get(d.productId)
    if (!p) return []   // skip orphaned decision rows
    return [{
      id:       d.id,
      productId: d.productId,

      // Product context
      recommendationActionType: p.recommendationActionType ?? null,
      region:    p.region    ?? null,
      wineStyle: p.wineStyle ?? null,
      priceTier: p.retailPriceCents != null ? derivePriceTier(p.retailPriceCents) : null,

      // Decision
      selectedAllocationSizing: d.selectedAllocationSizing ?? null,
      selectedReleaseTiming:    d.selectedReleaseTiming    ?? null,
      selectedRolloutMode:      d.selectedRolloutMode      ?? null,
      decisionStatus:           d.decisionStatus,

      // Execution
      executionStatus: d.executionStatus,
      planAdherence:   d.planAdherence ?? null,

      // Outcome (current product-level effectiveness state)
      effectivenessDelta: p.effectivenessDelta ?? null,
    } satisfies LearningRow]
  })

  const output = computeStrategyExecutionLearning(learningRows, generatedAt)

  return NextResponse.json(output)
}
