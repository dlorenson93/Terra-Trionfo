/**
 * app/api/admin/planning-decisions/[id]/route.ts
 *
 * Phase 14 — Execution Tracking & Plan Adherence
 *
 * PATCH — Record execution actuals against an existing planning decision row.
 *         Derives and stores planAdherence label on write so it is queryable
 *         without recomputation.
 */

import { NextResponse }           from 'next/server'
import { getServerSession }       from 'next-auth'
import { authOptions }            from '@/lib/auth'
import { prisma }                 from '@/lib/prisma'
import { derivePlanAdherence }    from '@/lib/planAdherenceEngine'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = params
  const body = await req.json()

  const {
    executionStatus,
    executedAllocationSizing,
    executedReleaseTiming,
    executedRolloutMode,
    executionNotes,
  } = body

  const VALID_EXEC_STATUSES = ['EXECUTED', 'PARTIAL', 'DEVIATED', 'NOT_EXECUTED']
  if (!executionStatus || !VALID_EXEC_STATUSES.includes(executionStatus)) {
    return NextResponse.json({ error: 'Invalid executionStatus' }, { status: 400 })
  }

  // Load the existing decision row
  const existing = await (prisma as any).productPlanningDecision.findUnique({
    where: { id },
    select: {
      id:                          true,
      decisionStatus:              true,
      recommendedAllocationSizing: true,
      recommendedReleaseTiming:    true,
      recommendedRolloutMode:      true,
      selectedAllocationSizing:    true,
      selectedReleaseTiming:       true,
      selectedRolloutMode:         true,
    },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
  }

  // Derive plan adherence
  const adherence = derivePlanAdherence({
    decisionStatus:              existing.decisionStatus,
    executionStatus,
    recommendedAllocationSizing: existing.recommendedAllocationSizing,
    recommendedReleaseTiming:    existing.recommendedReleaseTiming,
    recommendedRolloutMode:      existing.recommendedRolloutMode,
    selectedAllocationSizing:    existing.selectedAllocationSizing,
    selectedReleaseTiming:       existing.selectedReleaseTiming,
    selectedRolloutMode:         existing.selectedRolloutMode,
    executedAllocationSizing:    executedAllocationSizing ?? null,
    executedReleaseTiming:       executedReleaseTiming    ?? null,
    executedRolloutMode:         executedRolloutMode      ?? null,
  })

  const userId   = (session.user as any).id   as string | undefined
  const userName = (session.user as any).name as string | undefined

  const updated = await (prisma as any).productPlanningDecision.update({
    where: { id },
    data: {
      executionStatus,
      executedAllocationSizing: executedAllocationSizing ?? null,
      executedReleaseTiming:    executedReleaseTiming    ?? null,
      executedRolloutMode:      executedRolloutMode      ?? null,
      executionNotes:           executionNotes           ?? null,
      executedAt:               new Date(),
      executedByUserId:         userId   ?? null,
      executedByUserName:       userName ?? null,
      planAdherence:            adherence,
    },
    select: {
      id:                          true,
      productId:                   true,
      decisionStatus:              true,
      recommendedAllocationSizing: true,
      recommendedReleaseTiming:    true,
      recommendedRolloutMode:      true,
      recommendedPlanConfidence:   true,
      selectedAllocationSizing:    true,
      selectedReleaseTiming:       true,
      selectedRolloutMode:         true,
      planningDecisionNotes:       true,
      signalScoreAtDecision:       true,
      inventoryAtDecision:         true,
      plannedAt:                   true,
      executionStatus:             true,
      executedAllocationSizing:    true,
      executedReleaseTiming:       true,
      executedRolloutMode:         true,
      executionNotes:              true,
      executedAt:                  true,
      executedByUserId:            true,
      executedByUserName:          true,
      planAdherence:               true,
      plannedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return NextResponse.json(updated)
}
