import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        id:                           true,
        releaseMonitorStatus:         true,
        exposureTier:                 true,
        recommendationStatus:         true,
        recommendationActionType:     true,
        lastRecommendationReviewedAt: true,
      },
    }) as {
      id: string
      releaseMonitorStatus:         string | null
      exposureTier:                 string | null
      recommendationStatus:         string | null
      recommendationActionType:     string | null
      lastRecommendationReviewedAt: Date | null
    } | null

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await request.json() as {
      recommendationStatus:     'OPEN' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED'
      recommendationActionType?: string | null
      recommendationNotes?:      string | null
    }

    const { recommendationStatus, recommendationActionType, recommendationNotes } = body

    const VALID_STATUSES = ['OPEN', 'REVIEWED', 'ACTIONED', 'DISMISSED'] as const
    const VALID_ACTION_TYPES = [
      'NONE', 'ACCELERATE_RELEASE', 'HOLD_RELEASE', 'INCREASE_ALLOCATION',
      'REDUCE_EXPOSURE', 'INCREASE_MERCHANDISING', 'MAINTAIN', 'DISMISSED',
    ] as const

    if (!VALID_STATUSES.includes(recommendationStatus as typeof VALID_STATUSES[number])) {
      return NextResponse.json({ error: 'Invalid recommendationStatus' }, { status: 400 })
    }
    if (
      recommendationActionType != null &&
      !VALID_ACTION_TYPES.includes(recommendationActionType as typeof VALID_ACTION_TYPES[number])
    ) {
      return NextResponse.json({ error: 'Invalid recommendationActionType' }, { status: 400 })
    }

    const now = new Date()
    const data: Record<string, unknown> = {
      recommendationStatus,
      recommendationNotes: recommendationNotes ?? null,
    }

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
    }

    if (recommendationStatus === 'OPEN') {
      data.lastRecommendationActionedAt = null
    }

    // Write product update + audit history row in one transaction
    const [updated] = await prisma.$transaction([
      (prisma.product.update as Function)({
        where: { id: productId },
        data,
        select: {
          id:                            true,
          recommendationStatus:          true,
          recommendationActionType:      true,
          recommendationNotes:           true,
          lastRecommendationReviewedAt:  true,
          lastRecommendationActionedAt:  true,
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).productRecommendationHistory.create({
        data: {
          productId,
          previousStatus:      product.recommendationStatus    ?? null,
          newStatus:           recommendationStatus,
          previousActionType:  product.recommendationActionType ?? null,
          newActionType:       recommendationActionType         ?? null,
          note:                recommendationNotes              ?? null,
          releaseMonitorStatus: product.releaseMonitorStatus   ?? null,
          exposureTier:         product.exposureTier           ?? null,
          changedByUserId:      session.user.id,
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
