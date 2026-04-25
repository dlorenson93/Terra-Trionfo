import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PROFORMA_COUNT_BY_PRODUCER = {
  LAUTIN: 5,
  LANTIERI: 3,
  FACCINELLI: 3,
  RANDI: 8,
  STROPP: 4,
  ZANOTELLI: 4,
}

/**
 * Inventory alignment status
 * Shows current state vs target proforma state
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const status: Record<string, any> = {
      targetState: PROFORMA_COUNT_BY_PRODUCER,
      currentState: {},
      alignment: {},
      issues: [],
      timestamp: new Date().toISOString(),
    }

    // Get all companies and their wine counts
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        products: {
          where: { category: 'WINE' },
          select: {
            id: true,
            name: true,
            sku: true,
            vintage: true,
            bottleSizeMl: true,
            format: true,
            inventory: true,
            costEUR: true,
            retailPriceCents: true,
          },
        },
      },
    })

    // Check for SKU alignment (indicator of successful sync)
    let totalWinesWithSKU = 0
    let totalWinesWithoutSKU = 0
    const skusByProducer: Record<string, { with: number; without: number }> = {}

    for (const company of companies) {
      const companyName = company.name
      const wineCount = company.products.length
      status.currentState[companyName] = {
        wineCount,
        company: { name: company.name, slug: company.slug },
      }

      // Check SKU coverage
      const withSKU = company.products.filter(p => p.sku && p.sku.startsWith('TT-')).length
      const withoutSKU = wineCount - withSKU
      totalWinesWithSKU += withSKU
      totalWinesWithoutSKU += withoutSKU

      skusByProducer[companyName] = { with: withSKU, without: withoutSKU }

      // Check for data quality issues
      for (const wine of company.products) {
        const issues: string[] = []
        
        if (!wine.sku) issues.push('Missing SKU')
        if (wine.costEUR === null) issues.push('Missing costEUR')
        if (wine.vintage === null && !wine.name.includes('NV')) issues.push('Missing vintage')
        if (wine.bottleSizeMl === null) issues.push('Missing bottleSizeMl')
        if (wine.format === null) issues.push('Missing format')
        if (wine.inventory === 0) issues.push('Zero inventory')

        if (issues.length > 0) {
          status.issues.push({
            company: companyName,
            wine: wine.name,
            productId: wine.id,
            issues,
          })
        }
      }
    }

    // Determine alignment status
    let alignmentScore = 0
    const alignmentDetails: Record<string, any> = {
      producers: {},
    }

    for (const [producerId, targetCount] of Object.entries(PROFORMA_COUNT_BY_PRODUCER)) {
      const matching = companies.find(
        c =>
          c.slug?.toLowerCase().includes(producerId.toLowerCase()) ||
          c.name?.toLowerCase().includes(producerId.toLowerCase())
      )

      if (!matching) {
        alignmentDetails.producers[producerId] = {
          status: '❌ NOT FOUND',
          targetWines: targetCount,
          currentWines: 0,
          aligned: false,
        }
      } else {
        const currentCount = matching.products.length
        const aligned = currentCount >= targetCount
        alignmentDetails.producers[producerId] = {
          status: aligned ? '✅ ALIGNED' : '⚠️ INCOMPLETE',
          targetWines: targetCount,
          currentWines: currentCount,
          aligned,
          skuCoverage: `${skusByProducer[matching.name].with}/${currentCount} SKUs`,
        }
        if (aligned) alignmentScore += targetCount
      }
    }

    const alignmentPercentage = (alignmentScore / 27) * 100

    return NextResponse.json(
      {
        summary: {
          aligned: alignmentScore,
          total: 27,
          percentage: Math.round(alignmentPercentage),
          skuCoverage: `${totalWinesWithSKU}/27 have proforma SKU`,
          dataQualityIssues: status.issues.length,
        },
        alignmentDetails,
        dataQualityIssues: status.issues.slice(0, 10), // Show first 10 issues
        skuCoverage: skusByProducer,
        nextSteps:
          alignmentPercentage === 100
            ? [
                '✅ All 27 wines aligned!',
                'Run POST /api/admin/inventory/sync-proforma to finalize sync',
              ]
            : alignmentPercentage >= 50
              ? [
                  '⚠️ Partial alignment detected',
                  'Run POST /api/admin/inventory/match-analysis for details',
                  'Check missing producers',
                ]
              : [
                  '❌ Alignment incomplete',
                  'Run GET /api/admin/inventory/diagnose to see database state',
                  'Run POST /api/admin/inventory/match-analysis to see matching details',
                  'See ALIGNMENT_GUIDE.md for troubleshooting',
                ],
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[alignment-status] Error:', err)
    return NextResponse.json(
      {
        error: 'Failed to get alignment status',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
