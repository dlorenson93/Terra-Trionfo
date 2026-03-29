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

/** Freshness of a recommendation relative to when the engine last ran for this product */
export type RecommendationFreshness = 'fresh' | 'needs_refresh' | 'stale' | 'never_analyzed'

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
  /** Human-readable explanation of why this confidence level was assigned */
  confidenceReason: string
  reason: string
  monitorStatus: ReleaseMonitorStatus
  exposureTier: ExposureTier
  /** Whether the intelligence for this product is current or acting on stale data */
  freshness: RecommendationFreshness
  /** Primary demand channel driving signals for this product */
  dominantDriver: 'consumer' | 'trade' | 'balanced'
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
  /** Numeric confidence score (0–100) before bias adjustment */
  baseConfidenceScore: number
  /** Numeric confidence score (0–100) after bias multiplier applied (may equal base if bias not active) */
  adjustedConfidenceScore: number
  /** Whether a bias multiplier was applied to produce adjustedConfidenceScore */
  biasApplied: boolean
  /** The bias multiplier that was applied (1.0 = no change) */
  biasMultiplier: number
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

// ─── Constants ──────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000

// ─── Thresholds ───────────────────────────────────────────────────────────────

const FRESHNESS_THRESHOLDS = {
  FRESH_DAYS:          7,   // within 7 days of last run → fresh
  NEEDS_REFRESH_DAYS: 14,   // 7–14 days → degrading signal window
  // > 14 days → stale; admin should re-run before acting
} as const

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
 * Freshness of the last recommendation run for a product.
 * null = never analysed; >14 days = stale; 7–14 = needs_refresh; ≤7 = fresh.
 */
export function deriveFreshness(lastRecommendationAt: Date | null): RecommendationFreshness {
  if (!lastRecommendationAt) return 'never_analyzed'
  const daysSince = (Date.now() - lastRecommendationAt.getTime()) / MS_PER_DAY
  if (daysSince <= FRESHNESS_THRESHOLDS.FRESH_DAYS) return 'fresh'
  if (daysSince <= FRESHNESS_THRESHOLDS.NEEDS_REFRESH_DAYS) return 'needs_refresh'
  return 'stale'
}

/**
 * Primary demand channel driving signals for a single product.
 * Trade half-life is 60 days; consumer 30 days — weights are already decay-adjusted.
 */
export function deriveProductDominantDriver(
  sig: ProductSignals,
): 'consumer' | 'trade' | 'balanced' {
  const tradeWeight    = sig.weightedTradeScore
  const consumerWeight = sig.weightedWaitlistScore + sig.weightedPurchaseScore
  const total = tradeWeight + consumerWeight
  if (total === 0) return 'balanced'
  const tradeRatio = tradeWeight / total
  if (tradeRatio >= THRESHOLDS.TRADE_DOMINANT_RATIO)    return 'trade'
  if (tradeRatio <= 1 - THRESHOLDS.CONSUMER_DOMINANT_RATIO) return 'consumer'
  return 'balanced'
}

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

// ─── Bias types passed in from the calling route ─────────────────────────────

export interface BiasContext {
  actionType:     Record<string, number>
  globalModifier: number
  biasEnabled:    boolean
  biasMode:       string
  totalMeasured:  number
}

/** Neutral bias context — used when no governance data is available */
export const NEUTRAL_BIAS: BiasContext = {
  actionType:     {},
  globalModifier: 1.0,
  biasEnabled:    false,
  biasMode:       'OFF',
  totalMeasured:  0,
}

// ─── Numeric confidence map ───────────────────────────────────────────────────

/**
 * Maps the engine's qualitative confidence tier to a 0–100 numeric score.
 * Midpoint of each tier so bias multipliers produce meaningful differentiation.
 */
const CONFIDENCE_NUMERIC: Record<'high' | 'medium' | 'low', number> = {
  high:   85,
  medium: 55,
  low:    25,
}

/**
 * Returns the qualitative confidence label for a numeric score.
 * Used to re-derive the label after bias adjustment, so that a medium
 * boosted to 73+ becomes 'high', and a medium dampened to 35- becomes 'low'.
 */
export function numericToConfidenceLabel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

// ─── Bias action type key mapping ─────────────────────────────────────────────

/**
 * Maps engine ReleaseRecommendationType to the DB action type key used
 * by the bias engine (which stores SCREAMING_SNAKE_CASE keys from
 * RecommendationActionType enum).
 */
const TYPE_TO_ACTION_KEY: Partial<Record<ReleaseRecommendationType, string>> = {
  accelerate_release:    'ACCELERATE_RELEASE',
  hold_release:          'HOLD_RELEASE',
  increase_allocation:   'INCREASE_ALLOCATION',
  reduce_exposure:       'REDUCE_EXPOSURE',
  increase_merchandising: 'INCREASE_MERCHANDISING',
  maintain:              'MAINTAIN',
  trade_led_interest:    'INCREASE_ALLOCATION',    // closest action equivalent
  consumer_led_interest: 'INCREASE_MERCHANDISING', // closest action equivalent
}

// ─── Per-recommendation bias stamper ─────────────────────────────────────────

import { isBiasSafeToApply } from './deriveBiasDataSufficiency'

/**
 * Takes a partial recommendation (without bias fields) and stamps the four
 * bias-related fields onto it: baseConfidenceScore, adjustedConfidenceScore,
 * biasApplied, biasMultiplier.
 *
 * This is pure — no side effects. Called inside evaluateProduct.
 */
function stampBiasFields(
  confidence: 'high' | 'medium' | 'low',
  type:       ReleaseRecommendationType,
  bias:       BiasContext,
): Pick<ReleaseRecommendation, 'baseConfidenceScore' | 'adjustedConfidenceScore' | 'biasApplied' | 'biasMultiplier'> {
  const base    = CONFIDENCE_NUMERIC[confidence]
  const canApply = isBiasSafeToApply(bias.totalMeasured, bias.biasEnabled, bias.biasMode)

  if (!canApply) {
    return {
      baseConfidenceScore:     base,
      adjustedConfidenceScore: base,
      biasApplied:             false,
      biasMultiplier:          1.0,
    }
  }

  const actionKey  = TYPE_TO_ACTION_KEY[type] ?? null
  const typeMult   = actionKey ? (bias.actionType[actionKey] ?? 1.0) : 1.0
  const multiplier = parseFloat((typeMult * bias.globalModifier).toFixed(3))
  const adjusted   = Math.min(100, Math.max(0, Math.round(base * multiplier)))

  return {
    baseConfidenceScore:     base,
    adjustedConfidenceScore: adjusted,
    biasApplied:             true,
    biasMultiplier:          multiplier,
  }
}

// ─── Per-product rule evaluator ───────────────────────────────────────────────

function evaluateProduct(sig: ProductSignals, bias: BiasContext = NEUTRAL_BIAS): ReleaseRecommendation | null {
  const monitorStatus   = deriveReleaseHealth(sig)
  const exposureTier    = deriveExposureTier(sig)
  const freshness       = deriveFreshness(sig.lastRecommendationAt)
  const dominantDriver  = deriveProductDominantDriver(sig)

  const base = {
    productId:     sig.productId,
    wineName:      sig.productName,
    releaseStatus: sig.releaseStatus,
    monitorStatus,
    exposureTier,
    freshness,
    dominantDriver,
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
    const isHigh = sig.signalScore >= 3.0
    return {
      ...base,
      type: 'accelerate_release',
      confidence: isHigh ? 'high' : 'medium',
      confidenceReason: isHigh
        ? `Signal score ${sig.signalScore} well above threshold with ${sig.waitlistCount} verified sign-ups — strong pre-release momentum`
        : `Signal score ${sig.signalScore} is above activation threshold but still building — moderate confidence to move to LIVE`,
      reason: `${sig.waitlistCount} early sign-ups with signal score ${sig.signalScore} — consumer interest is ready; consider moving to LIVE`,
      signals: { signalScore: sig.signalScore, waitlistCount: sig.waitlistCount },
      ...stampBiasFields(isHigh ? 'high' : 'medium', 'accelerate_release', bias),
    }
  }

  // Rule 2 — Trade-led interest
  // Strong B2B inquiry volume with minimal direct consumer signals.
  if (
    sig.tradeInterestCount >= 2 &&
    sig.waitlistCount <= 1 &&
    sig.purchaseCount < 2
  ) {
    const isHigh = sig.tradeInterestCount >= 4
    return {
      ...base,
      type: 'trade_led_interest',
      confidence: isHigh ? 'high' : 'medium',
      confidenceReason: isHigh
        ? `${sig.tradeInterestCount} B2B inquiries strongly suggests on-premise fit; trade signals account for ≈${Math.round(tradeRatio * 100)}% of weighted demand`
        : `${sig.tradeInterestCount} trade inquiries present but below high-confidence threshold — follow-up needed to confirm placement intent`,
      reason: `${sig.tradeInterestCount} trade inquiries vs minimal consumer demand — prioritise B2B outreach and on-premise placement`,
      signals: {
        tradeInterestCount: sig.tradeInterestCount,
        waitlistCount:      sig.waitlistCount,
        purchaseCount:      sig.purchaseCount,
        tradeRatio,
      },
      ...stampBiasFields(isHigh ? 'high' : 'medium', 'trade_led_interest', bias),
    }
  }

  // Rule 3 — Consumer-led interest
  // Primarily consumer-driven with active purchase velocity but no trade follow-up.
  if (
    sig.waitlistCount >= 2 &&
    sig.tradeInterestCount === 0 &&
    sig.recentPurchaseCount > 0
  ) {
    const isHigh = sig.signalScore >= 2.0
    return {
      ...base,
      type: 'consumer_led_interest',
      confidence: isHigh ? 'high' : 'medium',
      confidenceReason: isHigh
        ? `Signal score ${sig.signalScore} driven by ${sig.waitlistCount} waitlist entries + ${sig.recentPurchaseCount} recent purchases — consistent 30-day velocity`
        : `Early consumer traction with ${sig.recentPurchaseCount} recent purchases but signal score ${sig.signalScore} is still accumulating`,
      reason: `${sig.waitlistCount} consumer sign-ups and ${sig.recentPurchaseCount} recent purchases with no trade interest — strong D2C channel signal`,
      signals: {
        waitlistCount:      sig.waitlistCount,
        purchaseCount:      sig.purchaseCount,
        velocityScore:      sig.velocityScore,
        consumerRatio,
      },
      ...stampBiasFields(isHigh ? 'high' : 'medium', 'consumer_led_interest', bias),
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
      confidenceReason: `Signal score ${sig.signalScore} ≥ ${THRESHOLDS.HIGH_DEMAND_SIGNAL} threshold with only ${sig.inventory} units remaining — demand is outpacing available supply`,
      reason: `Signal score ${sig.signalScore} with only ${sig.inventory} units remaining — request additional allocation from producer`,
      signals: {
        signalScore:  sig.signalScore,
        inventory:    sig.inventory,
        velocityScore: sig.velocityScore,
      },
      ...stampBiasFields('high', 'increase_allocation', bias),
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
      confidenceReason: `Interest exists (${sig.waitlistCount} waitlist) but conversion proxy is ${Math.round(sig.conversionProxy * 100)}% — below ${Math.round(THRESHOLDS.MERCH_MAX_CONVERSION_PROXY * 100)}% threshold; suggesting editorial issue, not demand deficit`,
      reason: `${sig.waitlistCount} interested but conversion proxy is ${Math.round(sig.conversionProxy * 100)}% — increase editorial coverage or feature placement`,
      signals: {
        signalScore:      sig.signalScore,
        waitlistCount:    sig.waitlistCount,
        conversionProxy:  sig.conversionProxy,
      },
      ...stampBiasFields('medium', 'increase_merchandising', bias),
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
      confidenceReason: `Zero demand signals across all channels with ${sig.inventory} units in inventory — low confidence as this could reflect newness rather than genuine underperformance`,
      reason: `No demand signals with ${sig.inventory} units in inventory — consider reducing catalog prominence or running a targeted promotion`,
      signals: {
        signalScore: sig.signalScore,
        inventory:   sig.inventory,
      },
      ...stampBiasFields('low', 'reduce_exposure', bias),
    }
  }

  // Rule 7 — Maintain
  // Signals above zero, monitor status stable — no intervention needed.
  if (sig.signalScore > 0 && monitorStatus === 'STABLE') {
    return {
      ...base,
      type: 'maintain',
      confidence: 'low',
      confidenceReason: `Signal score ${sig.signalScore} is positive but no rule threshold is exceeded — monitor trends before acting`,
      reason: `Demand signals present and release health is stable`,
      signals: { signalScore: sig.signalScore },
      ...stampBiasFields('low', 'maintain', bias),
    }
  }

  // Rule 8 — Hold release
  // Upcoming wine with no pre-release signals — not ready to go live.
  if (sig.releaseStatus === 'UPCOMING') {
    return {
      ...base,
      type: 'hold_release',
      confidence: 'low',
      confidenceReason: `No pre-release signals generated yet — insufficient data to support a higher confidence recommendation`,
      reason: `Pre-release wine with minimal interest signals — complete content and await market timing`,
      signals: {
        signalScore:  sig.signalScore,
        waitlistCount: sig.waitlistCount,
      },
      ...stampBiasFields('low', 'hold_release', bias),
    }
  }

  return null
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Primary entry point. Takes a DemandSnapshot and returns the full
 * ReleaseOptimizationOutput.
 */
export function deriveReleaseOptimization(
  snapshot: DemandSnapshot,
  bias: BiasContext = NEUTRAL_BIAS,
): ReleaseOptimizationOutput {
  const recommendations: ReleaseRecommendation[] = []

  for (const sig of snapshot.products) {
    const rec = evaluateProduct(sig, bias)
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
