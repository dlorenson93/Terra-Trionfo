import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildDemandSnapshot } from '@/lib/demandInsights'
import { deriveRecommendations, filterByType } from '@/lib/importDecisionEngine'
import { deriveReleaseOptimization } from '@/lib/releaseOptimizationEngine'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const snapshot = await buildDemandSnapshot()
    const { recommendations, regionTrends, styleTrends } = deriveRecommendations(snapshot)
    const releaseOpt = deriveReleaseOptimization(snapshot)

    const products = snapshot.products

    // ── High demand: top products by demand intensity ─────────────────
    const highDemand = [...products]
      .filter((p) => p.waitlistCount > 0)
      .sort((a, b) => b.demandIntensity - a.demandIntensity)
      .slice(0, 10)
      .map((p) => ({
        productId: p.productId,
        productName: p.productName,
        company: p.company,
        waitlistSignups: p.waitlistCount,
        recentOrders: p.recentPurchaseCount,
      }))

    // ── Allocation pressure: limited-allocation with waitlist ──────────
    const allocationPressure = [...products]
      .filter((p) => p.isLimitedAllocation && p.waitlistCount > 0)
      .map((p) => ({
        productId: p.productId,
        productName: p.productName,
        company: p.company,
        waitlistSignups: p.waitlistCount,
        currentInventory: p.inventory,
        pressureScore: Math.round((p.waitlistCount / Math.max(1, p.inventory)) * 100) / 100,
      }))
      .sort((a, b) => b.pressureScore - a.pressureScore)
      .slice(0, 10)

    // ── Trade signals: top products by trade inquiry ───────────────────
    const tradeSignals = [...products]
      .filter((p) => p.tradeInterestCount > 0)
      .sort((a, b) => b.tradeInterestCount - a.tradeInterestCount)
      .slice(0, 10)
      .map((p) => ({
        productId: p.productId,
        productName: p.productName,
        company: p.company,
        tradeInquiries: p.tradeInterestCount,
        totalCaseInterest: p.totalCaseInterest,
      }))

    // ── Low conversion: live products with no recent orders ───────────
    const lowConversion = products
      .filter((p) => p.contentStatus === 'LIVE' && p.recentPurchaseCount === 0)
      .slice(0, 10)
      .map((p) => ({
        productId: p.productId,
        productName: p.productName,
        company: p.company,
        region: p.region ?? '',
        retailPriceCents: p.retailPriceCents,
        daysSinceListed: null,
      }))

    // ── Upcoming release interest: non-live with waitlist ─────────────
    const upcomingReleaseInterest = products
      .filter((p) => p.contentStatus !== 'LIVE' && p.waitlistCount > 0)
      .sort((a, b) => b.waitlistCount - a.waitlistCount)
      .slice(0, 10)
      .map((p) => ({
        productId: p.productId,
        productName: p.productName,
        company: p.company,
        contentStatus: p.contentStatus,
        waitlistSignups: p.waitlistCount,
      }))

    // ── Phase 4 additions ─────────────────────────────────────────────

    // Unmet demand: high interest but no recent conversions
    const unmetDemand = filterByType(recommendations, 'unmet_demand').map((r) => ({
      productId: r.targetId,
      productName: r.target,
      reason: r.reason,
      confidence: r.confidence,
      waitlistSignups: r.signals.waitlistCount ?? 0,
      inventory: r.signals.inventory ?? 0,
    }))

    // Pricing signals: interest present but conversion friction
    const pricingSignals = filterByType(recommendations, 'pricing_review').map((r) => ({
      productId: r.targetId,
      productName: r.target,
      reason: r.reason,
      confidence: r.confidence,
      waitlistSignups: r.signals.waitlistCount ?? 0,
      purchaseCount: r.signals.purchaseCount ?? 0,
    }))

    // Allocation recommendations: combine allocation_increase + allocation_pressure
    const allocationRecommendations = [
      ...filterByType(recommendations, 'allocation_increase'),
      ...filterByType(recommendations, 'allocation_pressure'),
    ].map((r) => ({
      productId: r.targetId,
      productName: r.target,
      type: r.type,
      reason: r.reason,
      confidence: r.confidence,
    }))

    // Trade opportunity signals
    const tradeOpportunitySignals = filterByType(recommendations, 'trade_opportunity').map((r) => ({
      productId: r.targetId,
      productName: r.target,
      reason: r.reason,
      confidence: r.confidence,
      tradeInquiries: r.signals.tradeInterestCount ?? 0,
      totalCaseInterest: r.signals.totalCaseInterest ?? 0,
    }))

    return NextResponse.json({
      generatedAt: snapshot.generatedAt,
      // ── Existing signals (shape preserved) ──
      highDemand,
      allocationPressure,
      tradeSignals,
      lowConversion,
      upcomingReleaseInterest,
      // ── Phase 4 additions ──
      unmetDemand,
      pricingSignals,
      allocationRecommendations,
      tradeOpportunitySignals,
      regionTrends,
      styleTrends,
      // ── Phase 9 additions — release intelligence (non-breaking) ──
      releaseOptimizationSummary:       releaseOpt.summary,
      tradeVsConsumerBias:              releaseOpt.signalBias,
      releaseAccelerationCandidates:    releaseOpt.releaseAccelerationCandidates.map((r) => ({
        productId:     r.productId,
        productName:   r.wineName,
        confidence:    r.confidence,
        reason:        r.reason,
        monitorStatus: r.monitorStatus,
      })),
      underperformingWines:             releaseOpt.underperformingWines.map((r) => ({
        productId:     r.productId,
        productName:   r.wineName,
        reason:        r.reason,
        monitorStatus: r.monitorStatus,
        exposureTier:  r.exposureTier,
      })),
      releaseStageHealth:               releaseOpt.recommendations.map((r) => ({
        productId:     r.productId,
        wineName:      r.wineName,
        monitorStatus: r.monitorStatus,
        exposureTier:  r.exposureTier,
        type:          r.type,
      })),
    })
  } catch (error) {
    console.error('[Admin Insights]', error)
    return NextResponse.json({ error: 'Failed to generate insights.' }, { status: 500 })
  }
}
