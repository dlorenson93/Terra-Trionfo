/**
 * Import Decision Engine
 *
 * Pure rule-based functions. Takes a DemandSnapshot and returns typed
 * ImportRecommendations. No database access — all logic is deterministic
 * and testable without IO.
 *
 * Rule priority order (high → low confidence, then by type):
 *   allocation_increase > unmet_demand > trade_opportunity >
 *   allocation_pressure > pricing_review > featuring_opportunity
 *
 * DATA VISIBILITY: Outputs are ADMIN-ONLY. Never expose to consumers.
 */

import type { DemandSnapshot, ProductSignals, RegionAggregate, StyleAggregate } from './demandInsights'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecommendationType =
  | 'allocation_increase'
  | 'unmet_demand'
  | 'trade_opportunity'
  | 'allocation_pressure'
  | 'pricing_review'
  | 'featuring_opportunity'

export interface ImportRecommendation {
  type: RecommendationType
  target: string
  targetId: string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  signals: {
    waitlistCount?: number
    tradeInterestCount?: number
    purchaseCount?: number
    inventory?: number
    demandIntensity?: number
    totalCaseInterest?: number
  }
}

export interface RegionTrend {
  region: string
  demandLevel: 'high' | 'medium' | 'low'
  trend: 'growing' | 'stable' | 'declining'
}

export interface StyleTrend {
  style: string
  signal: 'strong demand' | 'moderate demand' | 'low demand'
  action: string
}

export interface DecisionOutput {
  recommendations: ImportRecommendation[]
  regionTrends: RegionTrend[]
  styleTrends: StyleTrend[]
}

// ─── Thresholds ───────────────────────────────────────────────────────────────
// Conservative, interpretable thresholds given early-stage signal volumes.
// Adjust as the platform grows.

const THRESHOLD = {
  HIGH_DEMAND_INTENSITY: 5,       // Rule A: allocation_increase
  HIGH_CONVERSION_PROXY: 0.5,     // Rule A: with high demand
  HIGH_WAITLIST_UNMET: 3,         // Rule B: unmet_demand
  HIGH_TRADE_INTEREST: 2,         // Rule C: trade_opportunity
  HIGH_TRADE_INTEREST_CONFIDENT: 4,
  WAITLIST_PRICING_FRICTION: 2,   // Rule D: pricing_review
  LOW_CONVERSION_PROXY: 0.2,      // Rule D: with high waitlist
  ALLOCATION_PRESSURE_WAITLIST: 2, // Rule E: allocation_pressure
  FEATURING_MAX: 3,               // Rule F: cap low-visibility results
} as const

// Sort order by type (lower = shown first)
const TYPE_PRIORITY: Record<RecommendationType, number> = {
  allocation_increase:   0,
  unmet_demand:          1,
  trade_opportunity:     2,
  allocation_pressure:   3,
  pricing_review:        4,
  featuring_opportunity: 5,
}

const CONFIDENCE_PRIORITY: Record<string, number> = { high: 0, medium: 1, low: 2 }

// ─── Rule evaluator ───────────────────────────────────────────────────────────

function evaluateProduct(sig: ProductSignals): ImportRecommendation | null {
  const {
    productId, productName,
    purchaseCount, recentPurchaseCount, waitlistCount,
    tradeInterestCount, totalCaseInterest,
    demandIntensity, conversionProxy,
    isLimitedAllocation, inventory,
    releaseStatus,
  } = sig

  // Rule A — High Demand Expansion
  // Only for wines that are currently purchasable (not upcoming or sold out)
  if (
    (releaseStatus === 'AVAILABLE' || releaseStatus === 'ALLOCATED') &&
    demandIntensity >= THRESHOLD.HIGH_DEMAND_INTENSITY &&
    conversionProxy >= THRESHOLD.HIGH_CONVERSION_PROXY
  ) {
    return {
      type: 'allocation_increase',
      target: productName,
      targetId: productId,
      reason: `High demand intensity (${demandIntensity}) with strong conversion — increase allocation`,
      confidence: 'high',
      signals: { waitlistCount, purchaseCount, demandIntensity },
    }
  }

  // Rule B — Unmet Demand
  // Meaningful waitlist interest but zero recent purchases.
  // Valid for AVAILABLE (supply gap) and UPCOMING (release timing) — both are actionable.
  // Skip SOLD_OUT (expected) and ALLOCATED (handled by Rule E).
  if (
    releaseStatus !== 'SOLD_OUT' &&
    waitlistCount >= THRESHOLD.HIGH_WAITLIST_UNMET &&
    recentPurchaseCount === 0
  ) {
    const isTiming = releaseStatus === 'UPCOMING'
    return {
      type: 'unmet_demand',
      target: productName,
      targetId: productId,
      reason: isTiming
        ? `${waitlistCount} waitlist sign-ups on a pre-release wine — accelerate availability or confirm release date`
        : `${waitlistCount} waitlist sign-ups but no recent purchases — supply gap or positioning issue`,
      confidence: waitlistCount >= 5 ? 'high' : 'medium',
      signals: { waitlistCount, purchaseCount, inventory },
    }
  }

  // Rule C — Trade Opportunity
  // B2B inquiry volume indicates restaurant / retail potential
  if (tradeInterestCount >= THRESHOLD.HIGH_TRADE_INTEREST) {
    return {
      type: 'trade_opportunity',
      target: productName,
      targetId: productId,
      reason:
        `${tradeInterestCount} trade inquiries` +
        (totalCaseInterest > 0 ? ` representing ${totalCaseInterest} cases of interest` : ''),
      confidence: tradeInterestCount >= THRESHOLD.HIGH_TRADE_INTEREST_CONFIDENT ? 'high' : 'medium',
      signals: { tradeInterestCount, totalCaseInterest, purchaseCount },
    }
  }

  // Rule D — Pricing Friction
  // Only meaningful for AVAILABLE wines — UPCOMING wines haven't had a chance to convert
  if (
    releaseStatus === 'AVAILABLE' &&
    waitlistCount >= THRESHOLD.WAITLIST_PRICING_FRICTION &&
    conversionProxy < THRESHOLD.LOW_CONVERSION_PROXY &&
    purchaseCount < 2
  ) {
    return {
      type: 'pricing_review',
      target: productName,
      targetId: productId,
      reason: `Interest signals present (${waitlistCount} waitlist) but conversion is very low — review pricing or positioning`,
      confidence: 'medium',
      signals: { waitlistCount, purchaseCount },
    }
  }

  // Rule E — Allocation Pressure
  // Only for ALLOCATED wines — SOLD_OUT is a different signal, UPCOMING hasn't launched
  if (
    releaseStatus === 'ALLOCATED' &&
    waitlistCount >= THRESHOLD.ALLOCATION_PRESSURE_WAITLIST
  ) {
    return {
      type: 'allocation_pressure',
      target: productName,
      targetId: productId,
      reason: `Limited-allocation wine with ${waitlistCount} waitlist sign-ups and ${inventory} units remaining`,
      confidence: inventory <= waitlistCount ? 'high' : 'medium',
      signals: { waitlistCount, inventory },
    }
  }

  // Rule F — Low Visibility Opportunity
  // Only for AVAILABLE wines — SOLD_OUT and UPCOMING have different remedies
  if (
    releaseStatus === 'AVAILABLE' &&
    demandIntensity === 0 &&
    purchaseCount === 0 &&
    waitlistCount === 0
  ) {
    return {
      type: 'featuring_opportunity',
      target: productName,
      targetId: productId,
      reason: 'Live product with no recorded demand signals — candidate for featuring or targeted promotion',
      confidence: 'low',
      signals: { waitlistCount: 0, purchaseCount: 0 },
    }
  }

  return null
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function deriveRecommendations(snapshot: DemandSnapshot): DecisionOutput {
  const rawRecs: ImportRecommendation[] = []
  let featuringCount = 0

  for (const sig of snapshot.products) {
    const rec = evaluateProduct(sig)
    if (!rec) continue

    // Cap featuring_opportunity to avoid noise
    if (rec.type === 'featuring_opportunity') {
      if (featuringCount >= THRESHOLD.FEATURING_MAX) continue
      featuringCount++
    }

    rawRecs.push(rec)
  }

  // Sort: confidence first, then type priority
  rawRecs.sort((a, b) => {
    const confDiff = CONFIDENCE_PRIORITY[a.confidence] - CONFIDENCE_PRIORITY[b.confidence]
    if (confDiff !== 0) return confDiff
    return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]
  })

  const regionTrends: RegionTrend[] = snapshot.regionAggregates.map((r: RegionAggregate) => ({
    region: r.displayName,
    demandLevel: r.demandLevel,
    trend: r.trend,
  }))

  const styleTrends: StyleTrend[] = snapshot.styleAggregates.map((s: StyleAggregate) => ({
    style: s.style,
    signal: s.signal,
    action: s.action,
  }))

  return { recommendations: rawRecs, regionTrends, styleTrends }
}

// ─── Filtered views (for admin/insights signals) ──────────────────────────────

export function filterByType(
  recommendations: ImportRecommendation[],
  type: RecommendationType,
): ImportRecommendation[] {
  return recommendations.filter((r) => r.type === type)
}
