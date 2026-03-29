import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deriveResolutionStatus } from '@/lib/deriveResolutionStatus'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/recommendations/run-followup-check
 *
 * Scans all ACTIONED products and auto-derives their resolution status from
 * current signal data (releaseMonitorStatus, exposureTier, actionedAt).
 * Writes updates back to the DB in a batch and creates history rows for
 * products whose resolution status changes.
 *
 * ADMIN-ONLY.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all ACTIONED products
    const actionedProducts = await (prisma.product.findMany as Function)({
      where: { recommendationStatus: 'ACTIONED' },
      select: {
        id:                                true,
        recommendationStatus:              true,
        releaseMonitorStatus:              true,
        exposureTier:                      true,
        lastRecommendationActionedAt:      true,
        recommendationResolutionStatus:    true,
      },
    }) as Array<{
      id:                             string
      recommendationStatus:           string
      releaseMonitorStatus:           string | null
      exposureTier:                   string | null
      lastRecommendationActionedAt:   Date | null
      recommendationResolutionStatus: string | null
    }>

    const counts = {
      checked:   actionedProducts.length,
      updated:   0,
      unchanged: 0,
    }

    const now = new Date()

    for (const product of actionedProducts) {
      const derived = deriveResolutionStatus({
        recommendationStatus:         product.recommendationStatus,
        lastRecommendationActionedAt: product.lastRecommendationActionedAt,
        releaseMonitorStatus:         product.releaseMonitorStatus,
        exposureTier:                 product.exposureTier,
      })

      // Skip if unchanged
      if (derived === product.recommendationResolutionStatus) {
        counts.unchanged++
        continue
      }

      const updateData: Record<string, unknown> = {
        recommendationResolutionStatus: derived,
      }
      if (derived === 'RESOLVED') {
        updateData.lastRecommendationResolvedAt = now
      } else {
        updateData.lastRecommendationResolvedAt = null
      }

      await prisma.$transaction([
        (prisma.product.update as Function)({
          where: { id: product.id },
          data:  updateData,
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma as any).productRecommendationHistory.create({
          data: {
            productId:               product.id,
            // Workflow state carries forward unchanged
            newStatus:               product.recommendationStatus,
            releaseMonitorStatus:    product.releaseMonitorStatus ?? null,
            exposureTier:            product.exposureTier         ?? null,
            previousResolutionStatus: product.recommendationResolutionStatus ?? null,
            newResolutionStatus:      derived,
            note:                    'Auto-derived by follow-up check',
            changedByUserId:         session.user.id,
          },
        }),
      ])

      counts.updated++
    }

    return NextResponse.json({
      message:  `Follow-up check complete.`,
      ...counts,
    })
  } catch (error) {
    console.error('[FollowupCheck POST]', error)
    return NextResponse.json(
      { error: 'Failed to run follow-up check.' },
      { status: 500 },
    )
  }
}
