/**
 * deriveBiasDataSufficiency.ts
 *
 * Pure functions for evaluating whether the portfolio has enough measured
 * recommendation outcomes to trust the bias weights computed by the
 * recommendationBiasEngine.
 *
 * This module is pure — no DB access, no side effects.
 * Consumed by:
 *   - app/api/admin/effectiveness-rollups/route.ts  (persist sufficiency status)
 *   - app/api/admin/bias-governance/route.ts        (return in governance payload)
 *   - lib/recommendationBiasEngine.ts              (guard before applying weights)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type BiasDataSufficiencyStatus = 'INSUFFICIENT' | 'MARGINAL' | 'SUFFICIENT' | 'STRONG'

export type BiasMode = 'OFF' | 'OBSERVE_ONLY' | 'APPLY_TO_CONFIDENCE'

// ── Thresholds ────────────────────────────────────────────────────────────────

/**
 * Minimum measured product counts per sufficiency tier.
 * These are conservative — erring on the side of requiring more data
 * before allowing bias to influence recommendations.
 *
 * INSUFFICIENT: 0–2   → never apply
 * MARGINAL:     3–9   → OBSERVE_ONLY at most
 * SUFFICIENT:  10–24  → APPLY_TO_CONFIDENCE allowed with caution
 * STRONG:      25+    → full confidence
 */
export const BIAS_SUFFICIENCY_THRESHOLDS = {
  MARGINAL:   3,
  SUFFICIENT: 10,
  STRONG:     25,
} as const

// ── Core derivation ───────────────────────────────────────────────────────────

/** Derive data sufficiency status from total measured outcome count. */
export function deriveBiasDataSufficiency(totalMeasured: number): BiasDataSufficiencyStatus {
  if (totalMeasured >= BIAS_SUFFICIENCY_THRESHOLDS.STRONG)     return 'STRONG'
  if (totalMeasured >= BIAS_SUFFICIENCY_THRESHOLDS.SUFFICIENT) return 'SUFFICIENT'
  if (totalMeasured >= BIAS_SUFFICIENCY_THRESHOLDS.MARGINAL)   return 'MARGINAL'
  return 'INSUFFICIENT'
}

// ── Safety guard ──────────────────────────────────────────────────────────────

/**
 * Returns true only if ALL conditions are met for safe bias application:
 *   1. Admin has enabled bias (biasEnabled = true)
 *   2. Mode is APPLY_TO_CONFIDENCE (not OFF or OBSERVE_ONLY)
 *   3. Data volume is SUFFICIENT or STRONG (>= 10 measured outcomes)
 *
 * This is the single authoritative gate. Any code that wants to apply
 * bias weights MUST call this first.
 */
export function isBiasSafeToApply(
  totalMeasured: number,
  biasEnabled:   boolean,
  biasMode:      string,
): boolean {
  if (!biasEnabled)                         return false
  if (biasMode !== 'APPLY_TO_CONFIDENCE')   return false
  if (totalMeasured < BIAS_SUFFICIENCY_THRESHOLDS.SUFFICIENT) return false
  return true
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const SUFFICIENCY_LABEL: Record<BiasDataSufficiencyStatus, string> = {
  INSUFFICIENT: 'Insufficient Data',
  MARGINAL:     'Marginal',
  SUFFICIENT:   'Sufficient',
  STRONG:       'Strong Signal',
}

export const SUFFICIENCY_BADGE_CLASS: Record<BiasDataSufficiencyStatus, string> = {
  INSUFFICIENT: 'bg-gray-100 text-gray-600 border border-gray-200',
  MARGINAL:     'bg-amber-100 text-amber-800 border border-amber-200',
  SUFFICIENT:   'bg-blue-100 text-blue-800 border border-blue-200',
  STRONG:       'bg-emerald-100 text-emerald-800 border border-emerald-200',
}

export const SUFFICIENCY_DESCRIPTION: Record<BiasDataSufficiencyStatus, string> = {
  INSUFFICIENT: 'Fewer than 3 measured outcomes — cannot derive reliable patterns.',
  MARGINAL:     '3–9 outcomes available. Patterns are forming but not yet reliable.',
  SUFFICIENT:   '10–24 outcomes. Bias can be applied cautiously.',
  STRONG:       '25+ outcomes. Patterns are reliable enough for full confidence weighting.',
}

export const BIAS_MODE_LABEL: Record<BiasMode, string> = {
  OFF:                 'Off',
  OBSERVE_ONLY:        'Observe Only',
  APPLY_TO_CONFIDENCE: 'Apply to Confidence',
}

export const BIAS_MODE_DESCRIPTION: Record<BiasMode, string> = {
  OFF:                 'Bias weights are computed and shown but never applied to recommendations.',
  OBSERVE_ONLY:        'Bias is monitored and displayed. Not applied to any outputs yet.',
  APPLY_TO_CONFIDENCE: 'Bias multipliers are applied to recommendation confidence scores at generation time.',
}

export const BIAS_MODE_BADGE_CLASS: Record<BiasMode, string> = {
  OFF:                 'bg-gray-100 text-gray-600 border border-gray-200',
  OBSERVE_ONLY:        'bg-amber-100 text-amber-800 border border-amber-200',
  APPLY_TO_CONFIDENCE: 'bg-violet-100 text-violet-800 border border-violet-200',
}
