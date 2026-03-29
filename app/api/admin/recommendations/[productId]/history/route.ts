import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/recommendations/[productId]/history
 *
 * Returns the full audit trail for a product's recommendation workflow,
 * newest first. Includes the name of the admin who made each change.
 *
 * ADMIN-ONLY.
 */
export async function GET(
  _request: Request,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { productId } = params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const history = await (prisma as any).productRecommendationHistory.findMany({
      where:   { productId },
      orderBy: { createdAt: 'desc' },
      select: {
        id:                      true,
        previousStatus:          true,
        newStatus:               true,
        previousActionType:      true,
        newActionType:           true,
        note:                    true,
        releaseMonitorStatus:    true,
        exposureTier:            true,
        previousResolutionStatus: true,
        newResolutionStatus:     true,
        createdAt:               true,
        changedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('[Recommendations GET history]', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendation history.' },
      { status: 500 },
    )
  }
}
