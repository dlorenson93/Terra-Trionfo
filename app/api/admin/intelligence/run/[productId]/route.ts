import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildDemandSnapshot } from '@/lib/demandInsights'
import {
  deriveReleaseHealth,
  deriveExposureTier,
  deriveProductDominantDriver,
} from '@/lib/releaseOptimizationEngine'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/intelligence/run/[productId]
 *
 * Refreshes release intelligence for a single product.
 * Builds a full demand snapshot, locates this product's signals, derives
 * current monitor status and exposure tier, and persists them to the DB.
 *
 * ADMIN-ONLY.
 */
export async function POST(
  _request: Request,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { productId } = params

    // Confirm product exists
    const product = await prisma.product.findUnique({
      where:  { id: productId },
      select: { id: true, name: true, status: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Intelligence analysis is only available for APPROVED products' },
        { status: 422 },
      )
    }

    // Build snapshot and locate this product's signals
    const snapshot  = await buildDemandSnapshot()
    const signals   = snapshot.products.find((p) => p.productId === productId)

    if (!signals) {
      return NextResponse.json(
        { error: 'Product not found in demand snapshot — it may not yet have an APPROVED status' },
        { status: 422 },
      )
    }

    const releaseMonitorStatus = deriveReleaseHealth(signals)
    const exposureTier         = deriveExposureTier(signals)
    const dominantDriver       = deriveProductDominantDriver(signals)
    const now                  = new Date()

    await prisma.product.update({
      where: { id: productId },
      data:  { releaseMonitorStatus, exposureTier, lastRecommendationAt: now },
    })

    return NextResponse.json({
      productId,
      productName:          product.name,
      releaseMonitorStatus,
      exposureTier,
      dominantDriver,
      lastRecommendationAt: now.toISOString(),
      freshness:            'FRESH',
    })
  } catch (error) {
    console.error('[Intelligence Run Single]', error)
    return NextResponse.json(
      { error: 'Failed to run intelligence analysis.' },
      { status: 500 },
    )
  }
}
