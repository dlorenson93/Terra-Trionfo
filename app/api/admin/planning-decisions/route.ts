/**
 * app/api/admin/planning-decisions/route.ts
 *
 * Phase 13 — Planning Workflow & Decision Capture
 *
 * GET  — Return all planning decision rows ordered newest-first.
 *         The admin page builds the latest-per-product map client-side.
 *
 * POST — Record a new planning decision event for a product.
 *         Creates a new row every time (audit log, not upsert) so the
 *         full history of accepted / overridden / deferred decisions is
 *         preserved for future outcome comparison.
 */

import { NextResponse }         from 'next/server'
import { getServerSession }     from 'next-auth'
import { authOptions }          from '@/lib/auth'
import { prisma }               from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await (prisma as any).productPlanningDecision.findMany({
    orderBy: { plannedAt: 'desc' },
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
      plannedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return NextResponse.json(rows)
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  const {
    productId,
    decisionStatus,
    recommendedAllocationSizing,
    recommendedReleaseTiming,
    recommendedRolloutMode,
    recommendedPlanConfidence,
    signalScoreAtDecision,
    inventoryAtDecision,
    selectedAllocationSizing,
    selectedReleaseTiming,
    selectedRolloutMode,
    planningDecisionNotes,
  } = body

  // Validate required fields
  if (!productId || !decisionStatus ||
      !recommendedAllocationSizing || !recommendedReleaseTiming ||
      !recommendedRolloutMode || !recommendedPlanConfidence) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const VALID_STATUSES = ['ACCEPTED', 'OVERRIDDEN', 'DEFERRED']
  if (!VALID_STATUSES.includes(decisionStatus)) {
    return NextResponse.json({ error: 'Invalid decisionStatus' }, { status: 400 })
  }

  // Ensure product exists
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const userId = (session.user as any).id
  if (!userId) {
    return NextResponse.json({ error: 'Unable to resolve user ID from session' }, { status: 400 })
  }

  const decision = await (prisma as any).productPlanningDecision.create({
    data: {
      productId,
      decisionStatus,
      recommendedAllocationSizing,
      recommendedReleaseTiming,
      recommendedRolloutMode,
      recommendedPlanConfidence,
      signalScoreAtDecision: signalScoreAtDecision ?? null,
      inventoryAtDecision:   inventoryAtDecision   ?? null,
      selectedAllocationSizing: selectedAllocationSizing ?? null,
      selectedReleaseTiming:    selectedReleaseTiming    ?? null,
      selectedRolloutMode:      selectedRolloutMode      ?? null,
      planningDecisionNotes:    planningDecisionNotes    ?? null,
      plannedByUserId: userId,
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
      plannedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return NextResponse.json(decision, { status: 201 })
}
