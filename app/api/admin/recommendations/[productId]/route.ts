import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deriveSignalScore } from '@/lib/deriveEffectivenessDelta'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/recommendations/[productId]
 *
 * Records a workflow action against the current recommendation for a product
 * and writes an audit row to ProductRecommendationHistory.
 *
 * ADMIN-ONLY.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { productId } = params

    // Fetch current state for diff + audit snapshot
    const product = await (prisma.product.findUnique as Function)({
      where:  { id: productId },
      select: {
        id:                                 true,
        releaseMonitorStatus:               true,
        exposureTier:                       true,
        recommendationStatus:               true,
        recommendationActionType:           true,
        recommendationResolutionStatus:     true,
        lastRecommendationReviewedAt:       true,
        lastRecommendationActionedAt:       true,
      },
    }) as {
      id: string
      releaseMonitorStatus:              string | null
      exposureTier:                      string | null
      recommendationStatus:              string | null
      recommendationActionType:          string | null
      recommendationResolutionStatus:    string | null
      lastRecommendationReviewedAt:      Date | null
      lastRecommendationActionedAt:      Date | null
    } | null

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await request.json() as {
      recommendationStatus?:           'OPEN' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED'
      recommendationActionType?:       string | null
      recommendationNotes?:            string | null
      recommendationResolutionStatus?: string | null
    }

    const {
      recommendationStatus,
      recommendationActionType,
      recommendationNotes,
      recommendationResolutionStatus,
    } = body

    const VALID_STATUSES = ['OPEN', 'REVIEWED', 'ACTIONED', 'DISMISSED'] as const
    const VALID_ACTION_TYPES = [
      'NONE', 'ACCELERATE_RELEASE', 'HOLD_RELEASE', 'INCREASE_ALLOCATION',
      'REDUCE_EXPOSURE', 'INCREASE_MERCHANDISING', 'MAINTAIN', 'DISMISSED',
    ] as const
    const VALID_RESOLUTION_STATUSES = [
      'UNRESOLVED', 'IMPROVING', 'RESOLVED', 'REQUIRES_FOLLOW_UP',
    ] as const

    // At least one of the two update vectors must be present
    const updatingWorkflow   = recommendationStatus !== undefined
    const updatingResolution = recommendationResolutionStatus !== undefined

    if (!updatingWorkflow && !updatingResolution) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    if (
      updatingWorkflow &&
      !VALID_STATUSES.includes(recommendationStatus as typeof VALID_STATUSES[number])
    ) {
      return NextResponse.json({ error: 'Invalid recommendationStatus' }, { status: 400 })
    }
    if (
      recommendationActionType != null &&
      !VALID_ACTION_TYPES.includes(recommendationActionType as typeof VALID_ACTION_TYPES[number])
    ) {
      return NextResponse.json({ error: 'Invalid recommendationActionType' }, { status: 400 })
    }
    if (
      updatingResolution &&
      recommendationResolutionStatus !== null &&
      !VALID_RESOLUTION_STATUSES.includes(
        recommendationResolutionStatus as typeof VALID_RESOLUTION_STATUSES[number],
      )
    ) {
      return NextResponse.json({ error: 'Invalid recommendationResolutionStatus' }, { status: 400 })
    }

    const now = new Date()
    const data: Record<string, unknown> = {}

    // ── Workflow update ──────────────────────────────────────────────────────
    if (updatingWorkflow) {
      data.recommendationStatus  = recommendationStatus
      data.recommendationNotes   = recommendationNotes ?? null

      if (recommendationActionType !== undefined) {
        data.recommendationActionType = recommendationActionType
      }
      if (recommendationStatus === 'REVIEWED' || recommendationStatus === 'DISMISSED') {
        data.lastRecommendationReviewedAt = now
      }
      if (recommendationStatus === 'ACTIONED') {
        if (!product.lastRecommendationReviewedAt) {
          data.lastRecommendationReviewedAt = now
        }
        data.lastRecommendationActionedAt = now
        // Snapshot the signal state at moment of action for later comparison
        data.preActionMonitorStatus  = product.releaseMonitorStatus ?? null
        data.preActionExposureTier   = product.exposureTier         ?? null
        data.preActionSignalScore    = deriveSignalScore(product.releaseMonitorStatus, product.exposureTier)
        // Clear any stale effectiveness data from a previous cycle
        data.postActionSignalScore       = null
        data.effectivenessDelta          = null
        data.effectivenessReason         = null
        data.effectivenessLastComputedAt = null
        // Auto-seed resolution as UNRESOLVED when first actioned
        if (!product.recommendationResolutionStatus) {
          data.recommendationResolutionStatus = 'UNRESOLVED'
        }
      }
      if (recommendationStatus === 'OPEN') {
        // Reopening clears both action timestamps, resolution, and effectiveness
        data.lastRecommendationActionedAt    = null
        data.recommendationResolutionStatus  = null
        data.lastRecommendationResolvedAt    = null
        data.preActionMonitorStatus          = null
        data.preActionExposureTier           = null
        data.preActionSignalScore            = null
        data.postActionSignalScore           = null
        data.effectivenessDelta              = null
        data.effectivenessReason             = null
        data.effectivenessLastComputedAt     = null
      }
    }

    // ── Resolution update ────────────────────────────────────────────────────
    if (updatingResolution) {
      data.recommendationResolutionStatus = recommendationResolutionStatus
      if (recommendationResolutionStatus === 'RESOLVED') {
        data.lastRecommendationResolvedAt = now
      } else if (recommendationResolutionStatus !== null) {
        // Cleared or set to non-resolved — clear the resolved timestamp
        data.lastRecommendationResolvedAt = null
      }
    }

    // Write product update + audit history row in one transaction
    const [updated] = await prisma.$transaction([
      (prisma.product.update as Function)({
        where: { id: productId },
        data,
        select: {
          id:                                 true,
          recommendationStatus:               true,
          recommendationActionType:           true,
          recommendationNotes:                true,
          lastRecommendationReviewedAt:       true,
          lastRecommendationActionedAt:       true,
          recommendationResolutionStatus:     true,
          lastRecommendationResolvedAt:       true,
          preActionSignalScore:               true,
          effectivenessDelta:                 true,
          effectivenessReason:                true,
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).productRecommendationHistory.create({
        data: {
          productId,
          previousStatus:            updatingWorkflow ? (product.recommendationStatus ?? null) : undefined,
          newStatus:                 updatingWorkflow ? recommendationStatus : (product.recommendationStatus ?? 'OPEN'),
          previousActionType:        updatingWorkflow ? (product.recommendationActionType ?? null) : undefined,
          newActionType:             updatingWorkflow ? (recommendationActionType ?? null) : undefined,
          note:                      recommendationNotes ?? null,
          releaseMonitorStatus:      product.releaseMonitorStatus ?? null,
          exposureTier:              product.exposureTier         ?? null,
          previousResolutionStatus:  updatingResolution ? (product.recommendationResolutionStatus ?? null) : undefined,
          newResolutionStatus:       updatingResolution ? (recommendationResolutionStatus ?? null)         : undefined,
          changedByUserId:           session.user.id,
        },
      }),
    ])

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Recommendations PATCH]', error)
    return NextResponse.json(
      { error: 'Failed to update recommendation status.' },
      { status: 500 },
    )
  }
}
