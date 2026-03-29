import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/recommendations/[productId]
 *
 * Records a workflow action against the current recommendation for a product.
 * Accepts: recommendationStatus, recommendationActionType, recommendationNotes.
 *
 * - REVIEWED   → stamps lastRecommendationReviewedAt
 * - ACTIONED   → stamps lastRecommendationActionedAt (and reviewedAt if not set)
 * - DISMISSED  → clears action type, stamps reviewedAt
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

    const product = await prisma.product.findUnique({
      where:  { id: productId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: { id: true, lastRecommendationReviewedAt: true } as any,
    }) as { id: string; lastRecommendationReviewedAt: Date | null } | null
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await request.json() as {
      recommendationStatus:     'OPEN' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED'
      recommendationActionType?: string | null
      recommendationNotes?:      string | null
    }

    const { recommendationStatus, recommendationActionType, recommendationNotes } = body

    const VALID_STATUSES   = ['OPEN', 'REVIEWED', 'ACTIONED', 'DISMISSED'] as const
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
      // Stamp reviewed if it hasn't been yet
      if (!product.lastRecommendationReviewedAt) {
        data.lastRecommendationReviewedAt = now
      }
      data.lastRecommendationActionedAt = now
    }

    // Reopening resets the actioned timestamp
    if (recommendationStatus === 'OPEN') {
      data.lastRecommendationActionedAt = null
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
      select: {
        id:                            true,
        recommendationStatus:          true,
        recommendationActionType:      true,
        recommendationNotes:           true,
        lastRecommendationReviewedAt:  true,
        lastRecommendationActionedAt:  true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Recommendations PATCH]', error)
    return NextResponse.json(
      { error: 'Failed to update recommendation status.' },
      { status: 500 },
    )
  }
}
