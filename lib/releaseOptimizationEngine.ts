/**
 * Release Optimization Engine
 *
 * Pure functions — no database access. Consumes a DemandSnapshot produced by
 * demandInsights.ts and returns typed release-specific recommendations.
 *
 * Complements importDecisionEngine.ts (which handles quantity/sourcing decisions).
 * This engine focuses on WHEN to release, HOW to allocate catalog exposure, and
 * WHERE the demand signal is primarily coming from (trade vs consumer).
 *
 * Rule priority (per product):
 *   accelerate_release > trade_led_interest > consumer_led_interest >
 *   increase_allocation > increase_merchandising > reduce_exposure >
 *   maintain > hold_release
 *
 * DATA VISIBILITY: All outputs are ADMIN-ONLY. Never expose to consumers.
 */

import type { DemandSnapshot, ProductSignals } from './demandInsights'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReleaseRecommendationType =
  | 'accelerate_release'
  | 'hold_release'
  | 'increase_allocation'
  | 'reduce_exposure'
  | 'increase_merchandising'
  | 'maintain'
  | 'trade_led_interest'
  | 'consumer_led_interest'

export type ExposureTier = 'LOW' | 'STANDARD' | 'PRIORITY' | 'LIMITED'

export type ReleaseMonitorStatus =
  | 'STABLE'
  | 'NEEDS_REVIEW'
  | 'HIGH_DEMAND'
  | 'UNDERPERFORMING'
  | 'ALLOCATION_PRESSURE'
  | 'UPCOMING_INTEREST'

export interface ReleaseRecommendation {
  productId: string
  wineName: string
  /** DerivedReleaseStatus from demandInsights */
  releaseStatus: string
  type: ReleaseRecommendationType
  confidence: 'high' | 'medium' | 'low'
  reason: string
  monitorStatus: ReleaseMonitorStatus
  exposureTier: ExposureTier
  signals: {
    signalScore?: number
    waitlistCount?: number
    tradeInterestCount?: number
    purchaseCount?: number
    inventory?: number
    velocityScore?: number
    conversionProxy?: number
    /** share of demand coming from trade (0–1) */
    tradeRatio?: number
    /** share of demand coming from consumer (0–1) */
    consumerRatio?: number
  }
}

export interface SignalBias {
  /** 0–1: share of weighted demand volume from trade inquiries */
  tradeRatio: number
  /** 0–1: share of weighted demand volume from consumer signals */
  consumerRatio: number
  dominantChannel: 'trade' | 'consumer' | 'balanced'
  totalTradeWeight: number
  totalConsumerWeight: number
}

export interface AllocationPressureMetric {
  productId: string
  wineName: string
  inventory: number
  waitlistCount: number
  /** estimated units sold per week (30-day recent purchases ÷ 4) */
  weeklyVelocity: number
  /** inventory ÷ weeklyVelocity; capped at 99 when velocity = 0 */
  weeksOfSupply: number
  pressureLevel: 'critical' | 'high' | 'moderate' | 'low'
}

export interface ReleaseOptimizationSummary {
  totalAnalysed: number
  highDemandCount: number
  needsReviewCount: number
  allocationPressureCount: number
  upcomingInterestCount: number
  underperformingCount: number
  stableCount: number
}

export interface ReleaseOptimizationOutput {
  summary: ReleaseOptimizationSummary
  recommendations: ReleaseRecommendation[]
  signalBias: SignalBias
  allocationPressureList: AllocationPressureMetric[]
  /** UPCOMING wines with enough pre-release signals to warrant moving to LIVE */
  releaseAccelerationCandidates: ReleaseRecommendation[]
  /** AVAILABLE wines with no demand signals; candidate for de-listing or promotion */
  underperformingWines: ReleaseRecommendation[]
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  // accelerate_release: pre-release wine has meaningful waitlist + signal momentum
  ACCELERATE_WAITLIST: 2,
  ACCELERATE_SIGNAL_SCORE: 1.5,

  // HIGH_DEMAND monitor status
  HIGH_DEMAND_SIGNAL: 5.0,

  // allocation pressure: waitlist / inventory ratio
  ALLOCATION_PRESSURE_RATIO: 0.5,

  // underperforming: live wine with near-zero signal
  UNDERPERFORM_MAX_SIGNAL: 1.0,

  // trade/consumer dominance: if one channel provides >= this share, it's dominant
  TRADE_DOMINANT_RATIO: 0.65,
  CONSUMER_DOMINANT_RATIO: 0.65,

  // allocation pressure severity
  CRITICAL_WEEKS_SUPPLY: 2.0,
  HIGH_WEEKS_SUPPLY: 4.0,

  // increase_allocation: strong signal + low stock
  INCREASE_ALLOC_INVENTORY_CAP: 20,

  // reduce_exposure: no signal + large stock
  REDUCE_EXPOSURE_INVENTORY_FLOOR: 50,

  // increase_merchandising: interest present but low conversion proxy
  MERCH_MAX_CONVERSION_PROXY: 0.3,
} as const

// Sort order for recommendation types (lower = displayed first)
const TYPE_PRIORITY: Record<ReleaseRecommendationType, number> = {
  accelerate_release:    0,
  trade_led_interest:    1,
  consumer_led_interest: 2,
  increase_allocation:   3,
  increase_merchandising: 4,
  reduce_exposure:       5,
  maintain:              6,
  hold_release:          7,
}

const CONFIDENCE_PRIORITY: Record<string, number> = { high: 0, medium: 1, low: 2 }

// ─── Helpers — exported for use as DB write helpers ───────────────────────────

/**
 * Classify product into a ReleaseMonitorStatus based on demand signals
 * and current derived release status.
 */
export function deriveReleaseHealth(sig: ProductSignals): ReleaseMonitorStatus {
  if (sig.releaseStatus === 'UPCOMING' && sig.waitlistCount >= THRESHOLDS.ACCELERATE_WAITLIST) {
    return 'UPCOMING_INTEREST'
  }
  if (sig.releaseStatus === 'SOLD_OUT') {
    return sig.waitlistCount > 0 ? 'ALLOCATION_PRESSURE' : 'STABLE'
  }
  if (sig.signalScore >= THRESHOLDS.HIGH_DEMAND_SIGNAL) {
    return 'HIGH_DEMAND'
  }
  if (
    sig.releaseStatus === 'ALLOCATED' &&
    sig.inventory > 0 &&
    sig.waitlistCount / Math.max(1, sig.inventory) >= THRESHOLDS.ALLOCATION_PRESSURE_RATIO
  ) {
    return 'ALLOCATION_PRESSURE'
  }
  if (
    sig.releaseStatus === 'AVAILABLE' &&
    sig.signalScore <= THRESHOLDS.UNDERPERFORM_MAX_SIGNAL &&
    sig.purchaseCount === 0 &&
    sig.recentPurchaseCount === 0
  ) {
    return 'UNDERPERFORMING'
  }
  if (
    (sig.waitlistCount > 0 || sig.tradeInterestCount > 0) &&
    sig.signalScore < THRESHOLDS.HIGH_DEMAND_SIGNAL
  ) {
    return 'NEEDS_REVIEW'
  }
  return 'STABLE'
}

/**
 * Classify product into an ExposureTier (catalog prominence recommendation).
 */
export function deriveExposureTier(sig: ProductSignals): ExposureTier {
  if (sig.isLimitedAllocation && sig.signalScore > 0) return 'LIMITED'
  if (sig.signalScore >= THRESHOLDS.HIGH_DEMAND_SIGNAL) return 'PRIORITY'
  if (sig.signalScore >= 1.0 || sig.waitlistCount > 0 || sig.tradeInterestCount > 0) return 'STANDARD'
  return 'LOW'
}

/**
 * Compute portfolio-level trade vs consumer signal bias.
 * Aggregates all weighted scores across the product list.
 */
export function deriveSignalBias(products: ProductSignals[]): SignalBias {
  let totalTradeWeight = 0
  let totalConsumerWeight = 0

  for (const p of products) {
    totalTradeWeight += p.weightedTradeScore
    totalConsumerWeight += p.weightedWaitlistScore + p.weightedPurchaseScore
  }

  const total = totalTradeWeight + totalConsumerWeight

  if (total === 0) {
    return {
      tradeRatio: 0,
      consumerRatio: 0,
      dominantChannel: 'balanced',
      totalTradeWeight: 0,
      totalConsumerWeight: 0,
    }
  }

  const tradeRatio    = Math.round((totalTradeWeight    / total) * 100) / 100
  const consumerRatio = Math.round((totalConsumerWeight / total) * 100) / 100

  const dominantChannel =
    tradeRatio    >= THRESHOLDS.TRADE_DOMINANT_RATIO    ? 'trade' :
    consumerRatio >= THRESHOLDS.CONSUMER_DOMINANT_RATIO ? 'consumer' :
    'balanced'

  return {
    tradeRatio,
    consumerRatio,
    dominantChannel,
    totalTradeWeight:    Math.round(totalTradeWeight    * 100) / 100,
    totalConsumerWeight: Math.round(totalConsumerWeight * 100) / 100,
  }
}

/**
 * Compute per-product allocation pressure metric.
 */
export function deriveAllocationPressure(sig: ProductSignals): AllocationPressureMetric {
  // Estimate weekly run-rate from rolling 30-day purchases
  const weeklyVelocity = sig.recentPurchaseCount / 4
  const weeksOfSupply  =
    weeklyVelocity > 0 ? Math.round((sig.inventory / weeklyVelocity) * 10) / 10 : 99

  const pressureLevel =
    weeksOfSupply <= THRESHOLDS.CRITICAL_WEEKS_SUPPLY          ? 'critical' :
    weeksOfSupply <= THRESHOLDS.HIGH_WEEKS_SUPPLY               ? 'high' :
    sig.waitlistCount > sig.inventory                           ? 'moderate' :
    'low'

  return {
    productId: sig.productId,
    wineName:  sig.productName,
    inventory: sig.inventory,
    waitlistCount: sig.waitlistCount,
    weeklyVelocity: Math.round(weeklyVelocity * 10) / 10,
    weeksOfSupply,
    pressureLevel,
  }
}

// ─── Per-product rule evaluator ───────────────────────────────────────────────

function evaluateProduct(sig: ProductSignals): ReleaseRecommendation | null {
  const monitorStatus = deriveReleaseHealth(sig)
  const exposureTier  = deriveExposureTier(sig)

  const base = {
    productId:     sig.productId,
    wineName:      sig.productName,
    releaseStatus: sig.releaseStatus,
    monitorStatus,
    exposureTier,
  }

  const productTradeTotal = sig.weightedTradeScore
  const productSigTotal   = Math.max(0.01, sig.signalScore)
  const tradeRatio        = Math.round((productTradeTotal / productSigTotal) * 100) / 100
  const consumerRatio     = Math.round(((productSigTotal - productTradeTotal) / productSigTotal) * 100) / 100

  // Rule 1 — Accelerate release
  // UPCOMING wine with both meaningful waitlists AND a time-decayed signal — push it live.
  if (
    sig.releaseStatus === 'UPCOMING' &&
    sig.waitlistCount >= THRESHOLDS.ACCELERATE_WAITLIST &&
    sig.signalScore >= THRESHOLDS.ACCELERATE_SIGNAL_SCORE
  ) {
    return {
      ...base,
      type: 'accelerate_release',
      confidence: sig.signalScore >= 3.0 ? 'high' : 'medium',
      reason: `${sig.waitlistCount} early sign-ups with signal score ${sig.signalScore} — consumer interest is ready; consider moving to LIVE`,
      signals: { signalScore: sig.signalScore, waitlistCount: sig.waitlistCount },
    }
  }

  // Rule 2 — Trade-led interest
  // Strong B2B inquiry volume with minimal direct consumer signals.
  if (
    sig.tradeInterestCount >= 2 &&
    sig.waitlistCount <= 1 &&
    sig.purchaseCount < 2
  ) {
    return {
      ...base,
      type: 'trade_led_interest',
      confidence: sig.tradeInterestCount >= 4 ? 'high' : 'medium',
      reason: `${sig.tradeInterestCount} trade inquiries vs minimal consumer demand — prioritise B2B outreach and on-premise placement`,
      signals: {
        tradeInterestCount: sig.tradeInterestCount,
        waitlistCount:      sig.waitlistCount,
        purchaseCount:      sig.purchaseCount,
        tradeRatio,
      },
    }
  }

  // Rule 3 — Consumer-led interest
  // Primarily consumer-driven with active purchase velocity but no trade follow-up.
  if (
    sig.waitlistCount >= 2 &&
    sig.tradeInterestCount === 0 &&
    sig.recentPurchaseCount > 0
  ) {
    return {
      ...base,
      type: 'consumer_led_interest',
      confidence: sig.signalScore >= 2.0 ? 'high' : 'medium',
      reason: `${sig.waitlistCount} consumer sign-ups and ${sig.recentPurchaseCount} recent purchases with no trade interest — strong D2C channel signal`,
      signals: {
        waitlistCount:      sig.waitlistCount,
        purchaseCount:      sig.purchaseCount,
        velocityScore:      sig.velocityScore,
        consumerRatio,
      },
    }
  }

  // Rule 4 — Increase allocation
  // Live wine showing strong demand momentum with low remaining stock.
  if (
    (sig.releaseStatus === 'AVAILABLE' || sig.releaseStatus === 'ALLOCATED') &&
    sig.signalScore >= THRESHOLDS.HIGH_DEMAND_SIGNAL &&
    sig.inventory < THRESHOLDS.INCREASE_ALLOC_INVENTORY_CAP
  ) {
    return {
      ...base,
      type: 'increase_allocation',
      confidence: 'high',
      reason: `Signal score ${sig.signalScore} with only ${sig.inventory} units remaining — request additional allocation from producer`,
      signals: {
        signalScore:  sig.signalScore,
        inventory:    sig.inventory,
        velocityScore: sig.velocityScore,
      },
    }
  }

  // Rule 5 — Increase merchandising
  // Interest signals present but conversion is low — visibility problem, not demand problem.
  if (
    sig.releaseStatus === 'AVAILABLE' &&
    sig.signalScore > 0 &&
    sig.signalScore < THRESHOLDS.HIGH_DEMAND_SIGNAL &&
    sig.waitlistCount > 0 &&
    sig.conversionProxy < THRESHOLDS.MERCH_MAX_CONVERSION_PROXY
  ) {
    return {
      ...base,
      type: 'increase_merchandising',
      confidence: 'medium',
      reason: `${sig.waitlistCount} interested but conversion proxy is ${Math.round(sig.conversionProxy * 100)}% — increase editorial coverage or feature placement`,
      signals: {
        signalScore:      sig.signalScore,
        waitlistCount:    sig.waitlistCount,
        conversionProxy:  sig.conversionProxy,
      },
    }
  }

  // Rule 6 — Reduce exposure
  // Live wine with zero demand and large inventory — occupying catalog space.
  if (
    sig.releaseStatus === 'AVAILABLE' &&
    sig.signalScore < THRESHOLDS.UNDERPERFORM_MAX_SIGNAL &&
    sig.demandIntensity === 0 &&
    sig.inventory > THRESHOLDS.REDUCE_EXPOSURE_INVENTORY_FLOOR
  ) {
    return {
      ...base,
      type: 'reduce_exposure',
      confidence: 'low',
      reason: `No demand signals with ${sig.inventory} units in inventory — consider reducing catalog prominence or running a targeted promotion`,
      signals: {
        signalScore: sig.signalScore,
        inventory:   sig.inventory,
      },
    }
  }

  // Rule 7 — Maintain
  // Signals above zero, monitor status stable — no intervention needed.
  if (sig.signalScore > 0 && monitorStatus === 'STABLE') {
    return {
      ...base,
      type: 'maintain',
      confidence: 'low',
      reason: `Demand signals present and release health is stable`,
      signals: { signalScore: sig.signalScore },
    }
  }

  // Rule 8 — Hold release
  // Upcoming wine with no pre-release signals — not ready to go live.
  if (sig.releaseStatus === 'UPCOMING') {
    return {
      ...base,
      type: 'hold_release',
      confidence: 'low',
      reason: `Pre-release wine with minimal interest signals — complete content and await market timing`,
      signals: {
        signalScore:  sig.signalScore,
        waitlistCount: sig.waitlistCount,
      },
    }
  }

  return null
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Primary entry point. Takes a DemandSnapshot and returns the full
 * ReleaseOptimizationOutput.
 */
export function deriveReleaseOptimization(snapshot: DemandSnapshot): ReleaseOptimizationOutput {
  const recommendations: ReleaseRecommendation[] = []

  for (const sig of snapshot.products) {
    const rec = evaluateProduct(sig)
    if (rec) recommendations.push(rec)
  }

  // Sort: confidence first (high → low), then type priority
  recommendations.sort((a, b) => {
    const confDiff = CONFIDENCE_PRIORITY[a.confidence] - CONFIDENCE_PRIORITY[b.confidence]
    if (confDiff !== 0) return confDiff
    return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]
  })

  const signalBias = deriveSignalBias(snapshot.products)

  const allocationPressureList = snapshot.products
    .filter((p) => p.releaseStatus === 'AVAILABLE' || p.releaseStatus === 'ALLOCATED')
    .map(deriveAllocationPressure)
    .filter((m) => m.pressureLevel !== 'low')
    .sort((a, b) => {
      const order = { critical: 0, high: 1, moderate: 2, low: 3 }
      return order[a.pressureLevel] - order[b.pressureLevel]
    })

  const releaseAccelerationCandidates = recommendations.filter(
    (r) => r.type === 'accelerate_release',
  )

  const underperformingWines = recommendations.filter(
    (r) => r.type === 'reduce_exposure',
  )

  // Build summary
  const monitorCounts = { high: 0, needs: 0, pressure: 0, upcoming: 0, under: 0, stable: 0 }
  for (const sig of snapshot.products) {
    const status = deriveReleaseHealth(sig)
    if (status === 'HIGH_DEMAND')         monitorCounts.high++
    else if (status === 'NEEDS_REVIEW')   monitorCounts.needs++
    else if (status === 'ALLOCATION_PRESSURE') monitorCounts.pressure++
    else if (status === 'UPCOMING_INTEREST')   monitorCounts.upcoming++
    else if (status === 'UNDERPERFORMING')     monitorCounts.under++
    else                                       monitorCounts.stable++
  }

  const summary: ReleaseOptimizationSummary = {
    totalAnalysed:         snapshot.products.length,
    highDemandCount:       monitorCounts.high,
    needsReviewCount:      monitorCounts.needs,
    allocationPressureCount: monitorCounts.pressure,
    upcomingInterestCount: monitorCounts.upcoming,
    underperformingCount:  monitorCounts.under,
    stableCount:           monitorCounts.stable,
  }

  return {
    summary,
    recommendations,
    signalBias,
    allocationPressureList,
    releaseAccelerationCandidates,
    underperformingWines,
  }
}
