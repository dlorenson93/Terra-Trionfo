/**
 * recommendationBiasEngine.ts
 *
 * Phase 9.6 / Phase 10 foundation — lightweight confidence-weight adjustment layer.
 *
 * This module takes the bias hints derived from historical effectiveness data
 * and produces per-action-type weight multipliers that the recommendation
 * engine can apply to confidence scores before surfacing recommendations.
 *
 * DESIGN PRINCIPLES:
 * - Does NOT override engine logic or skip rule evaluation
 * - Does NOT introduce probabilistic ML — purely deterministic
 * - Maximum multiplier is ×1.30; minimum is ×0.75 (non-destructive guardrails)
 * - If insufficient data exists, returns neutral multiplier (×1.00)
 * - Bias application is gated by isBiasSafeToApply() from deriveBiasDataSufficiency
 * - This module is pure — no DB access, no side effects
 *
 * Never expose to client components.
 */

import type { LearningSignals } from './deriveLearningSignals'
import { isBiasSafeToApply }    from './deriveBiasDataSufficiency'

// ── Types ─────────────────────────────────────────────────────────────────────

/** A resolved set of confidence weight multipliers for each action type. */
export interface BiasWeights {
  /** Per-action-type confidence multiplier. Default: 1.0. Range: 0.75–1.30 */
  actionType:   Record<string, number>

  /** Per-region confidence multiplier (reserved for Phase 10 expansion). */
  region:       Record<string, number>

  /**
   * Global portfolio health modifier.
   * Slightly boosts or dampens all scores when the portfolio is trending
   * strongly positive or negative overall.
   * Range: 0.90–1.10
   */
  globalModifier: number

  /** Metadata about this bias snapshot. */
  meta: {
    dataPointsUsed:    number
    biasApplied:       boolean   // false if below minimum sample threshold
    computedAt:        string    // ISO timestamp
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_SAMPLES_FOR_BIAS = 3   // Below this threshold, return neutral weights
const MAX_MULTIPLIER       = 1.30
const MIN_MULTIPLIER       = 0.75
const MIN_GLOBAL_MOD       = 0.90
const MAX_GLOBAL_MOD       = 1.10

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Convert a bias hint [−0.5, +0.5] into a multiplier [0.75, 1.30].
 *
 * Mapping:
 *   +0.5 → MAX_MULTIPLIER (1.30)
 *    0.0 → 1.00 (neutral)
 *   −0.5 → MIN_MULTIPLIER (0.75)
 *
 * Linear interpolation between anchors.
 */
function hintToMultiplier(hint: number): number {
  if (hint >= 0) {
    return clamp(1.0 + hint * 0.6, 1.0, MAX_MULTIPLIER)
  } else {
    return clamp(1.0 + hint * 0.5, MIN_MULTIPLIER, 1.0)
  }
}

/**
 * Compute the global portfolio modifier from the portfolio positive rate.
 * Strong positive portfolio (>75% rate) → slight boost (+0.05)
 * Struggling portfolio (<40% rate)      → slight dampener (−0.05)
 * Otherwise neutral (1.00)
 */
function deriveGlobalModifier(portfolioInsights: string[]): number {
  // Parse positive rate from the generated insight string
  const rateMatch = portfolioInsights[0]?.match(/^(\d+)%/)
  if (!rateMatch) return 1.0
  const rate = parseInt(rateMatch[1], 10)
  if (rate >= 75) return clamp(1.0 + (rate - 75) / 500, 1.0, MAX_GLOBAL_MOD)
  if (rate <  40) return clamp(1.0 - (40 - rate) / 400, MIN_GLOBAL_MOD, 1.0)
  return 1.0
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Derive recommendation confidence bias weights from historical learning signals.
 *
 * @param signals  Output of deriveLearningSignals()
 * @param totalMeasured  Number of products with measured effectiveness data
 * @returns BiasWeights ready for Phase 10 confidence-score adjustment
 *
 * Usage example (Phase 10 integration):
 * ```ts
 * const adjustedConfidence = baseConfidence * (biasWeights.actionType[actionType] ?? 1.0)
 *                                            * biasWeights.globalModifier
 * ```
 */
export function deriveRecommendationBias(
  signals:       LearningSignals,
  totalMeasured: number,
): BiasWeights {
  const biasApplied = totalMeasured >= MIN_SAMPLES_FOR_BIAS

  // If not enough data, return perfectly neutral weights
  if (!biasApplied) {
    return {
      actionType:     {},
      region:         {},
      globalModifier: 1.0,
      meta: {
        dataPointsUsed: totalMeasured,
        biasApplied:    false,
        computedAt:     new Date().toISOString(),
      },
    }
  }

  // Action-type weights from bias hints
  const actionTypeWeights: Record<string, number> = {}
  for (const [key, hint] of Object.entries(signals.actionTypeBiasHints)) {
    actionTypeWeights[key] = parseFloat(hintToMultiplier(hint).toFixed(3))
  }

  // Region weights (placeholder — Phase 10 will extend this)
  // Currently no region-level bias hints exist; reserved for expansion.
  const regionWeights: Record<string, number> = {}

  const globalModifier = parseFloat(deriveGlobalModifier(signals.portfolioInsights).toFixed(3))

  return {
    actionType:     actionTypeWeights,
    region:         regionWeights,
    globalModifier,
    meta: {
      dataPointsUsed: totalMeasured,
      biasApplied:    true,
      computedAt:     new Date().toISOString(),
    },
  }
}

// ── Safe application export ────────────────────────────────────────────────────

/**
 * Apply bias weights to a base confidence value (0–100).
 *
 * This is the ONLY function that should be used to apply bias to a confidence
 * score. It internally calls isBiasSafeToApply() as the safety gate.
 *
 * Returns the original confidence unchanged if bias is not safe to apply.
 * Clamps result to [0, 100].
 *
 * @param baseConfidence  Original confidence score (0–100)
 * @param actionType      The action type key to look up in weights
 * @param weights         BiasWeights produced by deriveRecommendationBias()
 * @param governance      { biasEnabled, biasMode } from BiasGovernance DB row
 * @param totalMeasured   Number of products with measured effectiveness data
 */
export function applyBiasToConfidence(
  baseConfidence: number,
  actionType:     string,
  weights:        BiasWeights,
  governance:     { biasEnabled: boolean; biasMode: string },
  totalMeasured:  number,
): number {
  if (!isBiasSafeToApply(totalMeasured, governance.biasEnabled, governance.biasMode)) {
    return baseConfidence
  }
  const multiplier = (weights.actionType[actionType] ?? 1.0) * weights.globalModifier
  return Math.min(100, Math.max(0, Math.round(baseConfidence * multiplier)))
}

// ── Phase 10 integration guide ────────────────────────────────────────────────
//
// In the recommendation generation route (e.g. /api/admin/intelligence/run/[productId]):
//
//   import { deriveRecommendationBias, applyBiasToConfidence } from '@/lib/recommendationBiasEngine'
//   import { deriveLearningSignals }    from '@/lib/deriveLearningSignals'
//   import { computeEffectivenessRollups } from '@/lib/effectivenessRollups'
//
//   // 1. Fetch measured products (cached or live)
//   // 2. Fetch BiasGovernance singleton from DB
//   // 3. const rollups        = computeEffectivenessRollups(measuredProducts)
//   // 4. const signals        = deriveLearningSignals(rollups)
//   // 5. const weights        = deriveRecommendationBias(signals, rollups.portfolioSummary.totalMeasured)
//   // 6. const adjConfidence  = applyBiasToConfidence(baseConfidence, actionType, weights, governance, totalMeasured)
//
