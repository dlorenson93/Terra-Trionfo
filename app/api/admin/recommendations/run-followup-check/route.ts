import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deriveResolutionStatus } from '@/lib/deriveResolutionStatus'
import { deriveSignalScore, deriveEffectivenessDelta } from '@/lib/deriveEffectivenessDelta'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/recommendations/run-followup-check
 *
 * Scans all ACTIONED products and:
 *  1. Auto-derives resolution status (UNRESOLVED / IMPROVING / RESOLVED / REQUIRES_FOLLOW_UP)
 *  2. Computes effectiveness delta by comparing pre-action signal snapshot to
 *     current post-action signals (POSITIVE_SHIFT / NO_MEANINGFUL_CHANGE / etc.)
 *  3. Writes both back to the product and creates an audit history row.
 *
 * ADMIN-ONLY.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all ACTIONED products with pre-action snapshot fields
    const actionedProducts = await (prisma.product.findMany as Function)({
      where: { recommendationStatus: 'ACTIONED' },
      select: {
        id:                                true,
        recommendationStatus:              true,
        releaseMonitorStatus:              true,
        exposureTier:                      true,
        lastRecommendationActionedAt:      true,
        recommendationResolutionStatus:    true,
        // Pre-action snapshot captured when ACTIONED
        preActionMonitorStatus:            true,
        preActionExposureTier:             true,
        preActionSignalScore:              true,
        effectivenessDelta:                true,
      },
    }) as Array<{
      id:                             string
      recommendationStatus:           string
      releaseMonitorStatus:           string | null
      exposureTier:                   string | null
      lastRecommendationActionedAt:   Date | null
      recommendationResolutionStatus: string | null
      preActionMonitorStatus:         string | null
      preActionExposureTier:          string | null
      preActionSignalScore:           number | null
      effectivenessDelta:             string | null
    }>

    const counts = {
      checked:   actionedProducts.length,
      updated:   0,
      unchanged: 0,
    }

    const now = new Date()

    for (const product of actionedProducts) {
      // ── Resolution ──────────────────────────────────────────────────────────
      const derivedResolution = deriveResolutionStatus({
        recommendationStatus:         product.recommendationStatus,
        lastRecommendationActionedAt: product.lastRecommendationActionedAt,
        releaseMonitorStatus:         product.releaseMonitorStatus,
        exposureTier:                 product.exposureTier,
      })

      // ── Effectiveness ────────────────────────────────────────────────────────
      const effectiveness = deriveEffectivenessDelta({
        preMonitorStatus:  product.preActionMonitorStatus,
        preExposureTier:   product.preActionExposureTier,
        postMonitorStatus: product.releaseMonitorStatus,
        postExposureTier:  product.exposureTier,
      })

      const postSignalScore = deriveSignalScore(product.releaseMonitorStatus, product.exposureTier)

      // Skip if both resolution and effectiveness are unchanged
      const resolutionUnchanged    = derivedResolution === product.recommendationResolutionStatus
      const effectivenessUnchanged = effectiveness.effectivenessDelta === product.effectivenessDelta

      if (resolutionUnchanged && effectivenessUnchanged) {
        counts.unchanged++
        continue
      }

      const updateData: Record<string, unknown> = {
        postActionSignalScore:           postSignalScore,
        effectivenessDelta:              effectiveness.effectivenessDelta,
        effectivenessReason:             effectiveness.effectivenessReason,
        effectivenessLastComputedAt:     now,
        recommendationResolutionStatus:  derivedResolution,
      }

      if (derivedResolution === 'RESOLVED') {
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
            productId:                product.id,
            // Workflow state carries forward unchanged
            newStatus:                product.recommendationStatus,
            releaseMonitorStatus:     product.releaseMonitorStatus ?? null,
            exposureTier:             product.exposureTier         ?? null,
            previousResolutionStatus: product.recommendationResolutionStatus ?? null,
            newResolutionStatus:      derivedResolution,
            // Effectiveness snapshot on this audit row
            preActionSignalScore:     product.preActionSignalScore  ?? null,
            postActionSignalScore:    postSignalScore,
            effectivenessDelta:       effectiveness.effectivenessDelta,
            note:                     `Auto follow-up: ${effectiveness.effectivenessReason}`,
            changedByUserId:          session.user.id,
          },
        }),
      ])

      counts.updated++
    }

    return NextResponse.json({
      message: 'Follow-up check complete.',
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
