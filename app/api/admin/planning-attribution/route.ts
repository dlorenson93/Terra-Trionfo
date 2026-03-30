/**
 * GET /api/admin/planning-attribution
 *
 * Phase 21 — Planning Outcome Attribution & Model Trust Analytics
 *
 * Loads all ProductPlanningDecision rows that have a composition snapshot
 * (compositeFinalScore not null) and joins with each product's eventual
 * effectivenessDelta. Runs computeAttributionRollups() to produce:
 *
 *   - Composite score tier accuracy (did high-tier scores deliver positively?)
 *   - Per-contributor reliability (bias / predictive / pattern)
 *   - Overall model trust note
 *
 * Advisory only. Admin-only. Never expose to consumers or vendors.
 */

import { NextResponse }                    from 'next/server'
import { getServerSession }                from 'next-auth'
import { authOptions }                     from '@/lib/auth'
import { prisma }                          from '@/lib/prisma'
import { computeAttributionRollups }       from '@/lib/planningAttributionRollups'
import type { AttributionRow }             from '@/lib/planningAttributionRollups'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const generatedAt = new Date().toISOString()

  // ── Load planning decisions with composition snapshot ────────────────────────
  const [decisionRows, products] = await Promise.all([

    (prisma as any).productPlanningDecision.findMany({
      orderBy: { plannedAt: 'desc' },
      select: {
        id:                      true,
        productId:               true,
        decisionStatus:          true,
        planAdherence:           true,
        // Phase 21 composition snapshot
        compositeBaseConfidence:  true,
        compositeBiasAdjustment:  true,
        compositePredictiveNudge: true,
        compositePatternDelta:    true,
        compositeFinalScore:      true,
        compositeLabel:           true,
      },
    }),

    // Product outcome data
    prisma.product.findMany({
      select: {
        id:                true,
        effectivenessDelta: true,
      },
    }),
  ])

  // ── Join decisions with product outcomes ────────────────────────────────────
  const outcomeMap = new Map(
    (products as any[]).map(p => [p.id, p.effectivenessDelta ?? null]),
  )

  const attributionRows: AttributionRow[] = (decisionRows as any[]).map(d => ({
    id:             d.id,
    productId:      d.productId,
    decisionStatus: d.decisionStatus,
    planAdherence:  d.planAdherence,
    // Composition snapshot
    compositeBaseConfidence:  d.compositeBaseConfidence  ?? null,
    compositeBiasAdjustment:  d.compositeBiasAdjustment  ?? null,
    compositePredictiveNudge: d.compositePredictiveNudge ?? null,
    compositePatternDelta:    d.compositePatternDelta    ?? null,
    compositeFinalScore:      d.compositeFinalScore      ?? null,
    compositeLabel:           d.compositeLabel           ?? null,
    // Outcome from product
    effectivenessDelta: outcomeMap.get(d.productId) ?? null,
  }))

  const output = computeAttributionRollups(attributionRows, generatedAt)

  return NextResponse.json(output)
}
