/**
 * allocationPlanningEngine.ts
 *
 * Phase 12 — Predictive Allocation & Release Planning
 *
 * Pure functions — no DB access. Takes a DemandSnapshot plus optional
 * effectiveness rollups and calibration data, and produces per-product
 * forward-looking allocation sizing, release timing, and rollout mode
 * suggestions for admin review.
 *
 * DESIGN PRINCIPLES:
 * - Recommendation-only, never auto-executes anything
 * - All outputs are ADMIN-ONLY — never expose to consumers or vendors
 * - Uses the same signal vocabulary as releaseOptimizationEngine.ts
 * - Calibration context adjusts confidence in suggestions, does not
 *   override them
 * - Maximum conservatism: when signals conflict, prefer the cautious output
 */

import type { DemandSnapshot, ProductSignals } from './demandInsights'
import type { EffectivenessRollupOutput }       from './effectivenessRollups'
import type { CalibrationOutput }               from './calibrationRollups'

// ── Allocation sizing ─────────────────────────────────────────────────────────

export type AllocationSizing =
  | 'hold_flat'          // Do not request more from producer — signal does not justify it
  | 'modest_increase'    // +10–25% — early signal building but not yet conclusive
  | 'significant_increase' // +25–60% — strong demand signal with velocity
  | 'reduce_exposure'    // Consider returning / reducing forward orders — demand stalled
  | 'maintain'           // Current level appropriate

// ── Release timing ────────────────────────────────────────────────────────────

export type ReleaseTiming =
  | 'accelerate'          // Has enough pre-release signal — move to LIVE soon
  | 'hold_until_signal'   // Insufficient pre-release signal — wait
  | 'stage_two_waves'     // Strong demand but limited allocation — stagger releases
  | 'release_trade_first' // Trade inquiry depth is sufficient for B2B placement first
  | 'release_consumer_first' // Consumer-led signal — prioritise DTC launch
  | 'no_action'           // AVAILABLE/ALLOCATED/SOLD_OUT — timing decision not relevant

// ── Rollout mode ──────────────────────────────────────────────────────────────

export type RolloutMode =
  | 'consumer_led'        // DTC-first: website + waitlist notification + social
  | 'trade_led'           // B2B-first: restaurant/wholesale outreach before consumer
  | 'balanced'            // Parallel DTC + B2B outreach
  | 'soft_launch'         // Limited quantity, invite-only or waitlist-first
  | 'allocation_first'    // Secure allocations before setting public pricing

// ── Per-product planning output ───────────────────────────────────────────────

export interface AllocationPlan {
  productId:   string
  wineName:    string
  company:     string
  releaseStatus: string
  region:      string | null
  wineStyle:   string | null

  // Signal snapshot used for this plan
  signalScore:        number
  inventory:          number
  waitlistCount:      number
  tradeInterestCount: number
  dominantDriver:     'consumer' | 'trade' | 'balanced'

  // Plan outputs
  allocationSizing: AllocationSizing
  releaseTiming:    ReleaseTiming
  rolloutMode:      RolloutMode

  // Confidence in the plan itself (not the recommendation confidence from Phase 10)
  planConfidence: 'high' | 'medium' | 'low'

  /** One-sentence rationale for the allocation sizing suggestion */
  allocationRationale: string
  /** One-sentence rationale for the release timing suggestion */
  timingRationale: string
  /** One-sentence rationale for the rollout mode suggestion */
  rolloutRationale: string

  // Calibration-adjusted notes (present when historical context exists)
  calibrationContext: string | null

  // Learning context from effectiveness rollups (present when rollup data exists)
  learningContext: string | null
}

export interface AllocationPlanSummary {
  totalAnalysed:       number
  accelerateCandidates: number  // releaseTiming === 'accelerate'
  increaseAllocationCandidates: number // allocationSizing IN (modest/significant)
  holdFlatCount:       number
  reduceCandidates:    number
  tradeFirstCandidates: number  // releaseTiming === 'release_trade_first'
  consumerFirstCandidates: number
  portfolioHealthNote: string   // one sentence synthesising the portfolio planning state
}

export interface AllocationPlanningOutput {
  plans:   AllocationPlan[]
  summary: AllocationPlanSummary
}

// ── Thresholds ────────────────────────────────────────────────────────────────

const T = {
  // Signal thresholds
  HIGH_SIGNAL:           5.0,
  MEDIUM_SIGNAL:         2.0,
  MINIMUM_SIGNAL:        1.0,
  ACCELERATE_SIGNAL:     1.5,
  ACCELERATE_WAITLIST:   2,

  // Trade dominance
  TRADE_DOMINANT:       0.65,
  CONSUMER_DOMINANT:    0.65,

  // Allocation pressure
  LOW_STOCK_FLOOR:      10,   // units — below this, allocation is urgent
  COMFORTABLE_STOCK:    50,   // units — above this, hold flat unless signal is very strong
  VELOCITY_THRESHOLD:   0.3,  // velocityScore threshold — recent purchases are active

  // Calibration quality gates
  CALIBRATION_MIN_POINTS: 5,  // below this, calibration context is not meaningful
  HIGH_CORRECT_RATE:       60, // % — high-confidence recs are reliable above this

  // Effectiveness quality gate per region/style
  ROLLUP_MIN_SAMPLES:   3,
} as const

// ── Dominant driver ───────────────────────────────────────────────────────────

function dominantDriver(sig: ProductSignals): 'consumer' | 'trade' | 'balanced' {
  const tradeW    = sig.weightedTradeScore
  const consumerW = sig.weightedWaitlistScore + sig.weightedPurchaseScore
  const total     = tradeW + consumerW
  if (total === 0) return 'balanced'
  const tr = tradeW / total
  if (tr >= T.TRADE_DOMINANT)              return 'trade'
  if (tr <= 1 - T.CONSUMER_DOMINANT)      return 'consumer'
  return 'balanced'
}

// ── Allocation sizing rules ───────────────────────────────────────────────────

function deriveAllocationSizing(
  sig:    ProductSignals,
  driver: 'consumer' | 'trade' | 'balanced',
  rollupContext: EffectivenessRollupOutput | null,
): { sizing: AllocationSizing; rationale: string } {
  const { signalScore, inventory, velocityScore, releaseStatus } = sig

  // Cannot increase allocation on SOLD_OUT — stock already exhausted
  if (releaseStatus === 'SOLD_OUT') {
    return {
      sizing:    'significant_increase',
      rationale: `Wine is sold out — securing additional allocation is the immediate priority`,
    }
  }

  // UPCOMING — allocation planning is pre-release, size based on pre-launch signal
  if (releaseStatus === 'UPCOMING') {
    if (signalScore >= T.ACCELERATE_SIGNAL && sig.waitlistCount >= T.ACCELERATE_WAITLIST) {
      return {
        sizing:    'significant_increase',
        rationale: `${sig.waitlistCount} pre-release sign-ups with signal score ${signalScore} — secure full planned allocation before launch`,
      }
    }
    if (signalScore >= T.MINIMUM_SIGNAL) {
      return {
        sizing:    'modest_increase',
        rationale: `Early signal score ${signalScore} — secure a modest initial allocation; scale up post-launch if demand confirms`,
      }
    }
    return {
      sizing:    'hold_flat',
      rationale: `No pre-release signal yet — hold planned allocation flat until interest builds`,
    }
  }

  // LIVE products
  if (signalScore >= T.HIGH_SIGNAL && inventory <= T.LOW_STOCK_FLOOR) {
    return {
      sizing:    'significant_increase',
      rationale: `Signal score ${signalScore} with only ${inventory} units remaining — demand significantly outpacing supply`,
    }
  }

  if (signalScore >= T.MEDIUM_SIGNAL && inventory <= T.COMFORTABLE_STOCK) {
    // Check effectiveness rollups — if this action type has a strong historical track record, boost suggestion
    const actionTypePerf = rollupContext?.actionTypePerformance.find((r) => r.key === 'INCREASE_ALLOCATION')
    const rollupBoost = actionTypePerf && actionTypePerf.totalCount >= T.ROLLUP_MIN_SAMPLES && actionTypePerf.positiveRate >= 60

    if (rollupBoost) {
      return {
        sizing:    'significant_increase',
        rationale: `Signal score ${signalScore} + historical INCREASE_ALLOCATION success rate ${actionTypePerf!.positiveRate}% supports an assertive allocation request`,
      }
    }
    return {
      sizing:    'modest_increase',
      rationale: `Signal score ${signalScore} with ${inventory} units remaining — modest allocation increase advisable to avoid stockout risk`,
    }
  }

  if (signalScore < T.MINIMUM_SIGNAL && inventory > T.COMFORTABLE_STOCK && velocityScore < T.VELOCITY_THRESHOLD * 100) {
    return {
      sizing:    'reduce_exposure',
      rationale: `Signal score ${signalScore} with ${inventory} units and low velocity ${velocityScore}% — consider reducing forward orders or running a clearance promotion`,
    }
  }

  if (driver === 'trade' && sig.tradeInterestCount >= 2 && inventory <= T.COMFORTABLE_STOCK) {
    return {
      sizing:    'modest_increase',
      rationale: `${sig.tradeInterestCount} trade inquiries indicate on-premise placement interest — moderate allocation increase for B2B pipeline`,
    }
  }

  return {
    sizing:    'maintain',
    rationale: `Signal score ${signalScore} with ${inventory} units — current allocation level is appropriate`,
  }
}

// ── Release timing rules ──────────────────────────────────────────────────────

function deriveReleaseTiming(
  sig:    ProductSignals,
  driver: 'consumer' | 'trade' | 'balanced',
): { timing: ReleaseTiming; rationale: string } {
  const { releaseStatus, signalScore, waitlistCount, tradeInterestCount, inventory } = sig

  if (releaseStatus !== 'UPCOMING') {
    // For already-live products, timing is staging or no-action
    if (inventory <= T.LOW_STOCK_FLOOR && signalScore >= T.MEDIUM_SIGNAL) {
      return {
        timing:   'stage_two_waves',
        rationale: `Very low stock (${inventory} units) with strong demand — stagger releases to maintain scarcity premium`,
      }
    }
    return {
      timing:   'no_action',
      rationale: `Wine is already live — release timing decision not applicable`,
    }
  }

  // UPCOMING wines — evaluate pre-release readiness
  if (signalScore >= T.HIGH_SIGNAL || (signalScore >= T.ACCELERATE_SIGNAL && waitlistCount >= T.ACCELERATE_WAITLIST)) {
    if (driver === 'trade' && tradeInterestCount >= 2) {
      return {
        timing:   'release_trade_first',
        rationale: `${tradeInterestCount} trade inquiries are the primary demand driver — lead with B2B placement before public launch`,
      }
    }
    if (driver === 'consumer') {
      return {
        timing:   'release_consumer_first',
        rationale: `${waitlistCount} waitlist sign-ups indicate DTC demand is ready — priority public launch before B2B outreach`,
      }
    }
    return {
      timing:   'accelerate',
      rationale: `Signal score ${signalScore} with ${waitlistCount} sign-ups — balanced demand supports moving to LIVE`,
    }
  }

  if (signalScore >= T.MINIMUM_SIGNAL && waitlistCount >= 1) {
    return {
      timing:   'stage_two_waves',
      rationale: `Early signal building (score ${signalScore}) — stage a small initial release to test market response before full launch`,
    }
  }

  return {
    timing:   'hold_until_signal',
    rationale: `Insufficient pre-release signal (score ${signalScore}, ${waitlistCount} sign-ups) — allow more time for interest to build`,
  }
}

// ── Rollout mode rules ────────────────────────────────────────────────────────

function deriveRolloutMode(
  sig:    ProductSignals,
  driver: 'consumer' | 'trade' | 'balanced',
  timing: ReleaseTiming,
): { mode: RolloutMode; rationale: string } {
  const { isLimitedAllocation, inventory, waitlistCount, tradeInterestCount } = sig

  if (isLimitedAllocation && inventory <= T.LOW_STOCK_FLOOR) {
    return {
      mode:     'allocation_first',
      rationale: `Limited-allocation wine with ${inventory} units — secure allocations before listing publicly`,
    }
  }

  if (timing === 'release_trade_first' || driver === 'trade') {
    return {
      mode:     'trade_led',
      rationale: `Trade signals dominate (${tradeInterestCount} inquiries) — lead with restaurant/wholesale outreach before consumer announcement`,
    }
  }

  if (timing === 'release_consumer_first' || driver === 'consumer') {
    return {
      mode:     'consumer_led',
      rationale: `Consumer demand is the primary driver (${waitlistCount} waitlist) — prioritise DTC launch with waitlist notification`,
    }
  }

  if (timing === 'stage_two_waves') {
    return {
      mode:     'soft_launch',
      rationale: `Staged release strategy — soft launch to existing interested parties first before broader promotion`,
    }
  }

  if (waitlistCount > 0 && tradeInterestCount > 0) {
    return {
      mode:     'balanced',
      rationale: `Mixed consumer and trade signals — parallel DTC and B2B outreach appropriate`,
    }
  }

  return {
    mode:     'consumer_led',
    rationale: `Default to consumer-led launch; no strong trade signal to warrant B2B priority`,
  }
}

// ── Calibration context ───────────────────────────────────────────────────────

function deriveCalibrationContext(
  sizing:      AllocationSizing,
  calibration: CalibrationOutput | null,
): string | null {
  if (!calibration) return null
  if (calibration.totalPoints < T.CALIBRATION_MIN_POINTS) return null

  const highBucket = calibration.confidenceBuckets.find((b) => b.bucket === 'high')
  const biasAdv    = calibration.biasCalibration.advantage

  const parts: string[] = []

  if (highBucket && highBucket.totalOutcome >= T.CALIBRATION_MIN_POINTS) {
    if (highBucket.positiveRate >= T.HIGH_CORRECT_RATE) {
      parts.push(`High-confidence recommendations have been correct ${highBucket.positiveRate}% of the time historically`)
    } else {
      parts.push(`High-confidence recommendations have resolved positively only ${highBucket.positiveRate}% of the time — treat assertive suggestions cautiously`)
    }
  }

  if (calibration.biasCalibration.withBias.total >= T.CALIBRATION_MIN_POINTS) {
    if (biasAdv > 2) {
      parts.push(`bias-adjusted suggestions are outperforming unbiased by +${biasAdv}pp`)
    } else if (biasAdv < -2) {
      parts.push(`bias-adjusted suggestions are underperforming by ${biasAdv}pp — consider relaxing bias governance`)
    }
  }

  return parts.length > 0 ? parts.join('; ') + '.' : null
}

// ── Effectiveness (learning) context ─────────────────────────────────────────

function deriveLearningContext(
  sig:     ProductSignals,
  rollups: EffectivenessRollupOutput | null,
): string | null {
  if (!rollups) return null

  const parts: string[] = []

  // Region performance
  if (sig.region) {
    const regionPerf = rollups.regionPerformance.find((r) => r.key === sig.region)
    if (regionPerf && regionPerf.totalCount >= T.ROLLUP_MIN_SAMPLES) {
      if (regionPerf.positiveRate >= 65) {
        parts.push(`${regionPerf.label} region has a ${regionPerf.positiveRate}% historic positive response rate`)
      } else if (regionPerf.positiveRate < 35 && regionPerf.totalCount >= T.ROLLUP_MIN_SAMPLES) {
        parts.push(`${regionPerf.label} region has underperformed historically (${regionPerf.positiveRate}% positive)`)
      }
    }
  }

  // Style performance
  if (sig.wineStyle) {
    const stylePerf = rollups.stylePerformance.find((r) => r.key === sig.wineStyle)
    if (stylePerf && stylePerf.totalCount >= T.ROLLUP_MIN_SAMPLES) {
      if (stylePerf.positiveRate >= 65) {
        parts.push(`${stylePerf.label} style responds well to allocation actions (${stylePerf.positiveRate}% positive)`)
      }
    }
  }

  return parts.length > 0 ? parts.join('; ') + '.' : null
}

// ── Plan confidence ───────────────────────────────────────────────────────────

function derivePlanConfidence(
  sig:     ProductSignals,
  sizing:  AllocationSizing,
  timing:  ReleaseTiming,
  rollups: EffectivenessRollupOutput | null,
): 'high' | 'medium' | 'low' {
  const { signalScore, waitlistCount, tradeInterestCount } = sig

  let score = 0

  // Strong signal = higher plan confidence
  if (signalScore >= T.HIGH_SIGNAL)   score += 2
  else if (signalScore >= T.MEDIUM_SIGNAL) score += 1

  // Multiple channels corroborate
  if (waitlistCount > 0 && tradeInterestCount > 0) score += 1

  // Historical data corroborates
  if (rollups) {
    const ps = rollups.portfolioSummary
    if (ps.totalMeasured >= 5 && ps.positiveRate >= 55) score += 1
  }

  // Reduce confidence for uncertain timings
  if (timing === 'hold_until_signal' || timing === 'no_action') score = Math.min(score, 1)

  if (score >= 3) return 'high'
  if (score >= 1) return 'medium'
  return 'low'
}

// ── Summary ───────────────────────────────────────────────────────────────────

function derivePortfolioHealthNote(plans: AllocationPlan[]): string {
  const total = plans.length
  if (total === 0) return 'No products with sufficient signals for planning.'

  const accelerate = plans.filter((p) => p.releaseTiming === 'accelerate').length
  const increase   = plans.filter((p) => ['modest_increase', 'significant_increase'].includes(p.allocationSizing)).length
  const reduce     = plans.filter((p) => p.allocationSizing === 'reduce_exposure').length
  const tradeLed   = plans.filter((p) => p.dominantDriver === 'trade').length

  const parts: string[] = []
  if (accelerate > 0) parts.push(`${accelerate} wine${accelerate !== 1 ? 's' : ''} ready to accelerate`)
  if (increase > 0)   parts.push(`${increase} product${increase !== 1 ? 's' : ''} warranting allocation increase`)
  if (reduce > 0)     parts.push(`${reduce} underperformer${reduce !== 1 ? 's' : ''} to review`)
  if (tradeLed > 0)   parts.push(`${tradeLed} trade-led product${tradeLed !== 1 ? 's' : ''} requiring B2B outreach`)

  if (parts.length === 0) return `${total} product${total !== 1 ? 's' : ''} analysed — portfolio is stable, maintain current allocations.`
  return `${total} products analysed: ${parts.join(', ')}.`
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Primary entry point. Takes a DemandSnapshot plus optional historical context
 * and returns per-product allocation plans with a portfolio-level summary.
 *
 * @param snapshot   - current demand snapshot (from buildDemandSnapshot)
 * @param rollups    - portfolio effectiveness rollups (null if not yet available)
 * @param calibration - calibration data (null if not yet available)
 */
export function deriveAllocationPlanning(
  snapshot:    DemandSnapshot,
  rollups:     EffectivenessRollupOutput | null,
  calibration: CalibrationOutput | null,
): AllocationPlanningOutput {
  const plans: AllocationPlan[] = []

  for (const sig of snapshot.products) {
    const driver  = dominantDriver(sig)
    const { sizing, rationale: allocationRationale } = deriveAllocationSizing(sig, driver, rollups)
    const { timing, rationale: timingRationale }     = deriveReleaseTiming(sig, driver)
    const { mode,   rationale: rolloutRationale }    = deriveRolloutMode(sig, driver, timing)
    const planConfidence = derivePlanConfidence(sig, sizing, timing, rollups)
    const calibrationContext = deriveCalibrationContext(sizing, calibration)
    const learningContext    = deriveLearningContext(sig, rollups)

    plans.push({
      productId:           sig.productId,
      wineName:            sig.productName,
      company:             sig.company,
      releaseStatus:       sig.releaseStatus,
      region:              sig.region,
      wineStyle:           sig.wineStyle,
      signalScore:         sig.signalScore,
      inventory:           sig.inventory,
      waitlistCount:       sig.waitlistCount,
      tradeInterestCount:  sig.tradeInterestCount,
      dominantDriver:      driver,
      allocationSizing:    sizing,
      releaseTiming:       timing,
      rolloutMode:         mode,
      planConfidence,
      allocationRationale,
      timingRationale,
      rolloutRationale,
      calibrationContext,
      learningContext,
    })
  }

  // Sort: high plan confidence first, then by signal score descending
  plans.sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 }
    const diff = confOrder[a.planConfidence] - confOrder[b.planConfidence]
    if (diff !== 0) return diff
    return b.signalScore - a.signalScore
  })

  const summary: AllocationPlanSummary = {
    totalAnalysed:                plans.length,
    accelerateCandidates:         plans.filter((p) => p.releaseTiming === 'accelerate').length,
    increaseAllocationCandidates: plans.filter((p) => ['modest_increase', 'significant_increase'].includes(p.allocationSizing)).length,
    holdFlatCount:                plans.filter((p) => p.allocationSizing === 'hold_flat').length,
    reduceCandidates:             plans.filter((p) => p.allocationSizing === 'reduce_exposure').length,
    tradeFirstCandidates:         plans.filter((p) => p.releaseTiming === 'release_trade_first').length,
    consumerFirstCandidates:      plans.filter((p) => p.releaseTiming === 'release_consumer_first').length,
    portfolioHealthNote:          derivePortfolioHealthNote(plans),
  }

  return { plans, summary }
}
