/**
 * GET /api/admin/decision-quality
 *
 * Phase 15 — Decision Quality & Adherence Analytics
 *
 * Joins ProductPlanningDecision rows with their product's effectivenessDelta,
 * region, wineStyle, and retailPriceCents, then runs computeDecisionQualityRollups()
 * to produce:
 *   - recommendation quality (accepted vs overridden outcome rates)
 *   - execution quality (full / partial / deviated / not-executed rates)
 *   - adherence quality (which adherence patterns correlate with positive outcomes)
 *   - dimensional breakdown (region, wineStyle)
 *   - process health summary
 *
 * ADMIN-ONLY. Never expose to consumers or vendors.
 */

import { NextResponse }      from 'next/server'
import { getServerSession }  from 'next-auth'
import { authOptions }       from '@/lib/auth'
import { prisma }            from '@/lib/prisma'
import {
  computeDecisionQualityRollups,
} from '@/lib/decisionQualityRollups'
import type { DecisionRow }  from '@/lib/decisionQualityRollups'

export const dynamic = 'force-dynamic'

// Derive price tier bucket from cents
function priceTier(cents: number): string {
  if (cents < 2000)       return 'entry'      // < $20
  if (cents < 5000)       return 'mid'        // $20–49
  if (cents < 10000)      return 'premium'    // $50–99
  return                         'ultra-premium' // $100+
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Load all planning decision rows (no filter — we want full history)
  const decisionRows = await (prisma as any).productPlanningDecision.findMany({
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
  })

  if (decisionRows.length === 0) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totalDecisions: 0,
      rollups: null,
      note: 'No planning decisions recorded yet.',
    })
  }

  // Load the distinct products referenced by these decisions (for outcome data)
  const productIds = Array.from(new Set(decisionRows.map((r: any) => r.productId as string))) as string[]

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id:                  true,
      effectivenessDelta:  true,
      region:              true,
      wineStyle:           true,
      retailPriceCents:    true,
    },
  })

  const productMap = new Map(products.map(p => [p.id, p]))

  // Build the DecisionRow array by joining decisions with product outcome data
  const rows: DecisionRow[] = decisionRows.map((d: any) => {
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

  const rollups = computeDecisionQualityRollups(rows)

  return NextResponse.json({
    generatedAt:    new Date().toISOString(),
    totalDecisions: rows.length,
    rollups,
  })
}
