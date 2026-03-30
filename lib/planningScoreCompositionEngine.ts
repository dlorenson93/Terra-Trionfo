/**
 * lib/planningScoreCompositionEngine.ts
 *
 * Phase 20 — Recommendation / Planning Score Composition Transparency
 *
 * Pure engine. No DB access.
 *
 * Takes all contributing signals for a single allocation plan and composes
 * them into an explicit, auditable score breakdown:
 *
 *   1. Base confidence   — from planConfidence (high/medium/low → numeric)
 *   2. Bias adjustment   — from portfolio calibration (bias advantage signal)
 *   3. Predictive nudge  — from predictedSuccessLikelihood (Phase 16)
 *   4. Pattern delta     — from pattern influence engine (Phase 19)
 *   5. Final composite   — sum of above, clamped to [0.05, 0.99]
 *
 * Returns structured pieces, not a single opaque number.
 * Each component has its own label, value, and contribution note so the
 * admin can read the breakdown transparently.
 *
 * GOVERNANCE:
 * - Pattern and bias components remain bounded (neither can dominate)
 * - The composition is always shown with its governance note
 * - This engine never triggers any action — it is purely observability
 *
 * ADMIN-ONLY. Never expose to consumers or vendors.
 */

import type { AllocationPlan }           from './allocationPlanningEngine'
import type { PredictivePlanEnrichment } from './predictivePlanningEngine'
import type { PatternInfluenceResult }   from './strategyPatternInfluenceEngine'
import type { CalibrationOutput }        from './calibrationRollups'

// ── Output types ──────────────────────────────────────────────────────────────

export type CompositeLabel = 'high' | 'medium' | 'low' | 'uncertain'

export interface ScoreContribution {
  /** Short human label for this component */
  label:      string
  /** Numeric delta contribution (can be negative) */
  value:      number
  /** e.g. "+0.04" or "-0.06" */
  formatted:  string
  /** One-phrase explanation of where this value came from */
  sourceNote: string
}

export interface PlanningScoreComposition {
  // ── Raw component values ────────────────────────────────────────────────────
  baseConfidenceScore:   number   // 0.40 / 0.60 / 0.80
  biasAdjustment:        number   // negative = bias dragging down, positive = lifting
  predictiveNudge:       number   // step from predictive likelihood tier
  patternInfluenceDelta: number   // direct from Phase 19 engine (bounded ±0.08)

  // ── Composite result ────────────────────────────────────────────────────────
  finalCompositeScore: number     // clamped [0.05, 0.99]
  compositeLabel:      CompositeLabel

  // ── Structured breakdown for admin display ─────────────────────────────────
  contributions: ScoreContribution[]

  // ── Plain-language explanation ──────────────────────────────────────────────
  compositionExplanation: string

  // ── Governance note ─────────────────────────────────────────────────────────
  governanceNote: string

  // ── Source labels ───────────────────────────────────────────────────────────
  predictiveLikelihood:   string   // e.g. "strong" / "moderate" / "insufficient_data"
  biasSource:             string   // e.g. "portfolio calibration" / "not available"
}

export interface ScoreCompositionOutput {
  compositions: Record<string, PlanningScoreComposition>
  generatedAt:  string
}

// ── Internal constants ────────────────────────────────────────────────────────

/** Map plan confidence to a 0–1 base numeric score */
const BASE_SCORE: Record<string, number> = {
  high:   0.80,
  medium: 0.60,
  low:    0.40,
}

/**
 * Predictive likelihood → nudge delta.
 * This is an additive overlay on top of the base plan confidence.
 * Bounded at ±0.08 and symmetric around "moderate" (neutral tier).
 */
const PREDICTIVE_NUDGE: Record<string, number> = {
  strong:            +0.08,
  moderate:          +0.04,
  mixed:              0.00,
  limited:           -0.04,
  insufficient_data:  0.00,  // No data → no influence
}

/** Composite score → qualitative label */
function toCompositeLabel(score: number): CompositeLabel {
  if (score >= 0.72) return 'high'
  if (score >= 0.50) return 'medium'
  if (score >= 0.30) return 'low'
  return 'uncertain'
}

function fmt(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}`
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * composeScoreForPlan
 *
 * Builds a full auditable score composition for a single allocation plan.
 *
 * @param plan        - The allocation plan (carries planConfidence)
 * @param enrichment  - Predictive enrichment (Phase 16), may be null
 * @param pattern     - Pattern influence result (Phase 19), may be null
 * @param calibration - Portfolio calibration output (Phase 11), may be null
 */
export function composeScoreForPlan(
  plan:        AllocationPlan,
  enrichment:  PredictivePlanEnrichment | null,
  pattern:     PatternInfluenceResult  | null,
  calibration: CalibrationOutput | null,
): PlanningScoreComposition {
  // ── 1. Base confidence ─────────────────────────────────────────────────────
  const baseConfidenceScore   = BASE_SCORE[plan.planConfidence] ?? 0.60
  const baseConfidenceLabel   = plan.planConfidence

  // ── 2. Bias adjustment ─────────────────────────────────────────────────────
  // Derived from portfolio calibration: if bias is helping, apply a small
  // positive adjustment; if hurting, a small negative one.
  // Never exceeds ±0.06.
  let biasAdjustment = 0
  let biasSource     = 'not available'

  if (calibration) {
    const { biasCalibration } = calibration
    // advantage = withBias.positiveRate − withoutBias.positiveRate (in %)
    // Scale to a ±0.06 bounded contribution: 10pp advantage → +0.02, 30pp → +0.06
    const advantage = biasCalibration.advantage ?? 0
    biasAdjustment  = clamp((advantage / 100) * 0.20, -0.06, 0.06)
    biasSource = biasCalibration.withBias.total >= 3
      ? 'portfolio calibration'
      : 'insufficient calibration data'
    // Zero out if not enough data
    if (biasCalibration.withBias.total < 3) biasAdjustment = 0
  }

  // ── 3. Predictive nudge ─────────────────────────────────────────────────────
  const likelihood     = enrichment?.predictedSuccessLikelihood ?? 'insufficient_data'
  const predictiveNudge = PREDICTIVE_NUDGE[likelihood] ?? 0

  // ── 4. Pattern influence delta ─────────────────────────────────────────────
  const patternInfluenceDelta = (
    pattern && pattern.patternInfluenceDirection !== 'insufficient'
  ) ? pattern.influenceDelta : 0

  // ── 5. Final composite ─────────────────────────────────────────────────────
  const rawComposite   = baseConfidenceScore + biasAdjustment + predictiveNudge + patternInfluenceDelta
  const finalCompositeScore = clamp(rawComposite, 0.05, 0.99)
  const compositeLabel = toCompositeLabel(finalCompositeScore)

  // ── 6. Structured contributions ────────────────────────────────────────────
  const contributions: ScoreContribution[] = [
    {
      label:      'Base confidence',
      value:      baseConfidenceScore,
      formatted:  baseConfidenceScore.toFixed(2),
      sourceNote: `Plan confidence: ${baseConfidenceLabel}`,
    },
    {
      label:      'Bias adjustment',
      value:      biasAdjustment,
      formatted:  biasAdjustment !== 0 ? fmt(biasAdjustment) : '0.00',
      sourceNote: biasAdjustment === 0
        ? `${biasSource} — no material adjustment`
        : biasAdjustment > 0
          ? `Bias improving portfolio quality (${biasSource})`
          : `Bias degrading portfolio quality — calibration caution (${biasSource})`,
    },
    {
      label:      'Predictive signal',
      value:      predictiveNudge,
      formatted:  predictiveNudge !== 0 ? fmt(predictiveNudge) : '0.00',
      sourceNote: likelihood === 'insufficient_data'
        ? 'No historical outcomes to compare'
        : `${likelihood} predicted likelihood from historical evidence`,
    },
    {
      label:      'Pattern influence',
      value:      patternInfluenceDelta,
      formatted:  patternInfluenceDelta !== 0 ? fmt(patternInfluenceDelta) : '0.00',
      sourceNote: !pattern || pattern.patternInfluenceDirection === 'insufficient'
        ? 'No qualifying patterns matched'
        : pattern.patternInfluenceDirection === 'positive'
          ? `${pattern.supportingPatternCount} winning pattern(s) matched`
          : pattern.patternInfluenceDirection === 'negative'
            ? `${pattern.riskPatternCount} risk pattern(s) matched`
            : 'Winning and risk patterns balanced out',
    },
  ]

  // ── 7. Plain-language explanation ──────────────────────────────────────────
  const dominantsource =
    Math.abs(predictiveNudge) >= Math.abs(patternInfluenceDelta)
      ? 'predictive signal'
      : 'pattern evidence'

  let compositionExplanation: string
  if (finalCompositeScore >= 0.72) {
    compositionExplanation = `Composite confidence is ${compositeLabel} (${finalCompositeScore.toFixed(2)}). The base plan confidence is reinforced by ${dominantsource}. Strong historical backing for this approach.`
  } else if (finalCompositeScore >= 0.50) {
    compositionExplanation = `Composite confidence is ${compositeLabel} (${finalCompositeScore.toFixed(2)}). Moderate overall signal — ${dominantsource} provides partial support with some uncertainty remaining.`
  } else if (finalCompositeScore >= 0.30) {
    compositionExplanation = `Composite confidence is ${compositeLabel} (${finalCompositeScore.toFixed(2)}). ${dominantsource === 'predictive signal' ? 'Predictive signals drag confidence below base' : 'Risk patterns outweigh supporting evidence'}. Admin should scrutinise before proceeding.`
  } else {
    compositionExplanation = `Composite confidence is uncertain (${finalCompositeScore.toFixed(2)}). Multiple layers reduce confidence below a reliable threshold. Consider deferring or overriding with explicit rationale.`
  }

  // ── 8. Governance note ─────────────────────────────────────────────────────
  const componentCount = [biasAdjustment, predictiveNudge, patternInfluenceDelta].filter(v => v !== 0).length
  const governanceNote = componentCount === 0
    ? `Only base confidence applied — no supplemental signals available. Score = base only.`
    : `${componentCount} supplemental component(s) applied. Bias ≤ ±0.06, Pattern ≤ ±0.08, Predictive ≤ ±0.08. All bounded.`

  return {
    baseConfidenceScore,
    biasAdjustment,
    predictiveNudge,
    patternInfluenceDelta,
    finalCompositeScore,
    compositeLabel,
    contributions,
    compositionExplanation,
    governanceNote,
    predictiveLikelihood: likelihood,
    biasSource,
  }
}

/**
 * computeScoreCompositions
 *
 * Batch version — maps across all plans to produce a `Record<productId, PlanningScoreComposition>`.
 */
export function computeScoreCompositions(
  plans:        AllocationPlan[],
  enrichments:  Record<string, PredictivePlanEnrichment>,
  influences:   Record<string, PatternInfluenceResult>,
  calibration:  CalibrationOutput | null,
  generatedAt:  string = new Date().toISOString(),
): ScoreCompositionOutput {
  const compositions: Record<string, PlanningScoreComposition> = {}
  for (const plan of plans) {
    compositions[plan.productId] = composeScoreForPlan(
      plan,
      enrichments[plan.productId] ?? null,
      influences[plan.productId]  ?? null,
      calibration,
    )
  }
  return { compositions, generatedAt }
}
