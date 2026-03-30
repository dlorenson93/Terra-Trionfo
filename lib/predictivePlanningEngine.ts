/**
 * lib/predictivePlanningEngine.ts
 *
 * Phase 16 — Predictive Planning Confidence
 *
 * Pure engine. No DB access. Given current allocation plans, historical
 * decision quality rollups, and effectiveness rollups, produces per-plan
 * predictive enrichment that answers:
 *
 *   - How likely is this plan to succeed, given similar historical outcomes?
 *   - What historical evidence supports or cautions against it?
 *   - Should the plan confidence be raised, held, or lowered?
 *
 * MINIMUM-DATA SAFEGUARD:
 * If fewer than MIN_OUTCOME_SAMPLES measured outcomes exist for any relevant
 * dimension, the engine returns 'insufficient_data' rather than extrapolating
 * from noise.
 *
 * Advisory only — never triggers any action. Admin still decides.
 */

import type { AllocationPlan }          from './allocationPlanningEngine'
import type { DecisionQualityOutput }   from './decisionQualityRollups'
import type { EffectivenessRollupOutput } from './effectivenessRollups'

const MIN_OUTCOME_SAMPLES = 3

// ── Output types ──────────────────────────────────────────────────────────────

export type PredictedLikelihood =
  | 'strong'            // Weighted positive rate >= 65%
  | 'moderate'          // 45–64%
  | 'mixed'             // 25–44%
  | 'limited'           // < 25%
  | 'insufficient_data' // Fewer than MIN_OUTCOME_SAMPLES outcomes across all relevant dimensions

export type EvidenceStrength =
  | 'strong'    // 10+ measured outcomes across matching dimensions
  | 'moderate'  // 4–9
  | 'limited'   // MIN_OUTCOME_SAMPLES – 3
  | 'none'      // Fewer than MIN_OUTCOME_SAMPLES

export type ConfidenceAdjustment =
  | 'raise'        // Historical evidence supports increasing plan confidence
  | 'hold'         // Evidence is neutral or plan confidence already appropriate
  | 'lower'        // Historical evidence suggests reducing plan confidence
  | 'insufficient' // Not enough data to recommend an adjustment

export interface PredictivePlanEnrichment {
  productId:                  string
  predictedSuccessLikelihood: PredictedLikelihood
  likelihoodNote:             string       // 1–2 sentence human-readable summary
  historicalEvidence:         EvidenceStrength
  sampleSize:                 number       // Total measured outcomes used as evidence
  supportingFactors:          string[]     // Up to 3 positive historical signals
  cautionFlags:               string[]     // Up to 3 caution signals
  confidenceAdjustment:       ConfidenceAdjustment
}

export interface PredictivePlanningOutput {
  enrichments: Record<string, PredictivePlanEnrichment>
  generatedAt: string
  dataNote:    string
}

// ── Internal helpers ──────────────────────────────────────────────────────────

interface WeightedSignal {
  rate:   number
  count:  number
  weight: number
  label:  string
  type:   'region' | 'style' | 'action' | 'portfolio'
}

/**
 * Map from a plan's allocation sizing and timing to the effectiveness action type
 * vocabulary used by effectivenessRollups.
 */
function planToActionType(plan: AllocationPlan): string | null {
  if (plan.releaseTiming === 'accelerate')          return 'ACCELERATE_RELEASE'
  if (plan.releaseTiming === 'hold_until_signal')   return 'HOLD_RELEASE'
  if (plan.allocationSizing === 'significant_increase') return 'INCREASE_ALLOCATION'
  if (plan.allocationSizing === 'modest_increase')      return 'INCREASE_ALLOCATION'
  if (plan.allocationSizing === 'reduce_exposure')      return 'REDUCE_EXPOSURE'
  return null
}

function humanActionLabel(actionType: string): string {
  return actionType.replace(/_/g, ' ').toLowerCase()
}

// ── Per-plan enrichment ───────────────────────────────────────────────────────

function enrichOnePlan(
  plan: AllocationPlan,
  dq:   DecisionQualityOutput | null,
  er:   EffectivenessRollupOutput | null,
): PredictivePlanEnrichment {
  const signals: WeightedSignal[] = []
  let totalSamples = 0

  // ── 1. Decision quality — regional signal (most direct: recent decision-level data) ──
  const dqRegion = dq?.regionBreakdown.find(r => r.key === plan.region)
  if (dqRegion && dqRegion.withOutcome >= MIN_OUTCOME_SAMPLES) {
    signals.push({
      rate:  dqRegion.positiveRate,
      count: dqRegion.withOutcome,
      weight: 2.0,
      label: `${plan.region} (decision history)`,
      type: 'region',
    })
    totalSamples += dqRegion.withOutcome
  }

  // ── 2. Decision quality — style signal ───────────────────────────────────────
  const dqStyle = dq?.styleBreakdown.find(s => s.key === plan.wineStyle)
  if (dqStyle && dqStyle.withOutcome >= MIN_OUTCOME_SAMPLES) {
    signals.push({
      rate:  dqStyle.positiveRate,
      count: dqStyle.withOutcome,
      weight: 1.5,
      label: `${plan.wineStyle} (decision history)`,
      type: 'style',
    })
    totalSamples += dqStyle.withOutcome
  }

  // ── 3. Effectiveness — regional signal ───────────────────────────────────────
  const erRegion = er?.regionPerformance.find(r => r.key === plan.region)
  if (erRegion && erRegion.totalCount >= MIN_OUTCOME_SAMPLES) {
    signals.push({
      rate:  erRegion.positiveRate,
      count: erRegion.totalCount,
      weight: 1.0,
      label: `${plan.region} (effectiveness)`,
      type: 'region',
    })
    totalSamples += erRegion.totalCount
  }

  // ── 4. Effectiveness — style signal ──────────────────────────────────────────
  const erStyle = er?.stylePerformance.find(s => s.key === plan.wineStyle)
  if (erStyle && erStyle.totalCount >= MIN_OUTCOME_SAMPLES) {
    signals.push({
      rate:  erStyle.positiveRate,
      count: erStyle.totalCount,
      weight: 1.0,
      label: `${plan.wineStyle} (effectiveness)`,
      type: 'style',
    })
    totalSamples += erStyle.totalCount
  }

  // ── 5. Effectiveness — action type signal ─────────────────────────────────────
  const actionType = planToActionType(plan)
  const erAction = actionType
    ? er?.actionTypePerformance.find(a => a.key === actionType)
    : undefined
  if (erAction && erAction.totalCount >= MIN_OUTCOME_SAMPLES) {
    signals.push({
      rate:  erAction.positiveRate,
      count: erAction.totalCount,
      weight: 1.5,
      label: humanActionLabel(actionType!),
      type: 'action',
    })
    totalSamples += erAction.totalCount
  }

  // ── 6. Portfolio-level fallback (weak signal — only if no dimension matches) ─
  if (signals.length === 0) {
    const dqPortfolio = dq?.processHealth
    if (dqPortfolio && dqPortfolio.measuredCount >= MIN_OUTCOME_SAMPLES) {
      signals.push({
        rate:  dqPortfolio.overallPositiveRate,
        count: dqPortfolio.measuredCount,
        weight: 0.5,
        label: 'portfolio overall',
        type: 'portfolio',
      })
      totalSamples += dqPortfolio.measuredCount
    }
    const erPortfolio = er?.portfolioSummary
    if (erPortfolio && erPortfolio.totalMeasured >= MIN_OUTCOME_SAMPLES) {
      signals.push({
        rate:  erPortfolio.positiveRate,
        count: erPortfolio.totalMeasured,
        weight: 0.5,
        label: 'portfolio (effectiveness)',
        type: 'portfolio',
      })
      // Don't double-count portfolio samples — take max
      totalSamples = Math.max(totalSamples, erPortfolio.totalMeasured)
    }
  }

  // ── Compute weighted positive rate ────────────────────────────────────────────
  let weightedPositiveRate: number | null = null
  if (signals.length > 0) {
    const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0)
    weightedPositiveRate = signals.reduce((sum, s) => sum + s.rate * s.weight, 0) / totalWeight
  }

  // ── Likelihood ────────────────────────────────────────────────────────────────
  const predictedSuccessLikelihood: PredictedLikelihood =
    weightedPositiveRate === null           ? 'insufficient_data' :
    weightedPositiveRate >= 65              ? 'strong' :
    weightedPositiveRate >= 45              ? 'moderate' :
    weightedPositiveRate >= 25              ? 'mixed' :
                                              'limited'

  // ── Evidence strength ─────────────────────────────────────────────────────────
  const historicalEvidence: EvidenceStrength =
    totalSamples >= 10               ? 'strong' :
    totalSamples >= 4                ? 'moderate' :
    totalSamples >= MIN_OUTCOME_SAMPLES ? 'limited' :
                                         'none'

  // ── Likelihood note ───────────────────────────────────────────────────────────
  const ratePct = weightedPositiveRate !== null ? Math.round(weightedPositiveRate) : null
  const dominantSignal = signals.length > 0
    ? signals.reduce((best, s) => (s.weight * s.count > best.weight * best.count ? s : best))
    : null

  let likelihoodNote: string
  if (predictedSuccessLikelihood === 'insufficient_data') {
    likelihoodNote = `Insufficient portfolio evidence to predict outcome — fewer than ${MIN_OUTCOME_SAMPLES} measured outcomes in relevant dimensions.`
  } else if (dominantSignal) {
    const dimLabel =
      dominantSignal.type === 'region'    ? `the ${plan.region ?? 'same region'}` :
      dominantSignal.type === 'style'     ? `${plan.wineStyle ?? 'this style'} wines` :
      dominantSignal.type === 'action'    ? `similar release actions` :
                                            'this portfolio'
    if (predictedSuccessLikelihood === 'strong') {
      likelihoodNote = `Similar plans for ${dimLabel} have yielded ${ratePct}% positive outcomes — historically a strong move.`
    } else if (predictedSuccessLikelihood === 'moderate') {
      likelihoodNote = `Moderate historical success for ${dimLabel} (${ratePct}% positive) — solid but not guaranteed.`
    } else if (predictedSuccessLikelihood === 'mixed') {
      likelihoodNote = `Mixed historical performance for ${dimLabel} (${ratePct}% positive) — proceed with scrutiny.`
    } else {
      likelihoodNote = `Low historical success rate for ${dimLabel} (${ratePct}% positive) — caution advised before committing.`
    }
  } else {
    likelihoodNote = 'No historical comparison data available for this plan at this time.'
  }

  // ── Supporting factors ────────────────────────────────────────────────────────
  const supportingFactors: string[] = []

  if (dqRegion && dqRegion.withOutcome >= MIN_OUTCOME_SAMPLES && dqRegion.positiveRate >= 55) {
    supportingFactors.push(
      `Strong decision history in ${plan.region}: ${dqRegion.positiveRate}% positive (n=${dqRegion.withOutcome})`
    )
  }
  if (dqStyle && dqStyle.withOutcome >= MIN_OUTCOME_SAMPLES && dqStyle.positiveRate >= 55) {
    supportingFactors.push(
      `${plan.wineStyle} wines perform well in this portfolio (${dqStyle.positiveRate}% positive, n=${dqStyle.withOutcome})`
    )
  }
  if (erAction && erAction.totalCount >= MIN_OUTCOME_SAMPLES && erAction.positiveRate >= 55) {
    const al = humanActionLabel(actionType!)
    supportingFactors.push(
      `"${al}" actions succeed ${erAction.positiveRate}% of the time in this portfolio (n=${erAction.totalCount})`
    )
  }
  if (
    dq &&
    dq.recommendationQuality.accepted.withOutcome >= MIN_OUTCOME_SAMPLES &&
    dq.recommendationQuality.accepted.positiveRate >= 55
  ) {
    supportingFactors.push(
      `Accepted recommendations yield ${dq.recommendationQuality.accepted.positiveRate}% positive outcomes in this portfolio`
    )
  }
  if (
    dq &&
    (dq.adherenceQuality.bestAdherencePattern === 'matched_recommendation' ||
     dq.adherenceQuality.bestAdherencePattern === 'matched_decision') &&
    supportingFactors.length < 3
  ) {
    supportingFactors.push(
      `Following the plan (recommended or decided) produces the best historical outcomes in this portfolio`
    )
  }

  const uniqueFactors = [...new Set(supportingFactors)].slice(0, 3)

  // ── Caution flags ─────────────────────────────────────────────────────────────
  const cautionFlags: string[] = []

  if (dqRegion && dqRegion.withOutcome >= MIN_OUTCOME_SAMPLES && dqRegion.positiveRate < 35) {
    cautionFlags.push(
      `Historically weak outcomes in ${plan.region}: only ${dqRegion.positiveRate}% positive (n=${dqRegion.withOutcome})`
    )
  }
  if (dqStyle && dqStyle.withOutcome >= MIN_OUTCOME_SAMPLES && dqStyle.positiveRate < 35) {
    cautionFlags.push(
      `${plan.wineStyle ?? 'This style'} has underperformed in this portfolio (${dqStyle.positiveRate}% positive)`
    )
  }
  if (erAction && erAction.totalCount >= MIN_OUTCOME_SAMPLES && erAction.negativeRate >= 40) {
    const al = humanActionLabel(actionType!)
    cautionFlags.push(
      `"${al}" actions have produced negative outcomes ${erAction.negativeRate}% of the time in this portfolio`
    )
  }
  if (
    dq &&
    dq.recommendationQuality.overrideAdvantage > 10 &&
    dq.recommendationQuality.overridden.withOutcome >= MIN_OUTCOME_SAMPLES
  ) {
    cautionFlags.push(
      `Human overrides outperform recommendations by ${dq.recommendationQuality.overrideAdvantage}pp — evaluate before accepting outright`
    )
  }
  if (
    dq &&
    dq.processHealth.executionCoverageRate < 40 &&
    dq.processHealth.decidedCount >= 3
  ) {
    cautionFlags.push(
      `Low execution tracking (${dq.processHealth.executionCoverageRate}%) — predictive signal may be less reliable`
    )
  }
  if (plan.planConfidence === 'low') {
    cautionFlags.push(
      `Low current signal confidence — consider deferring until demand signals strengthen`
    )
  }

  const uniqueCautions = [...new Set(cautionFlags)].slice(0, 3)

  // ── Confidence adjustment ─────────────────────────────────────────────────────
  let confidenceAdjustment: ConfidenceAdjustment
  if (historicalEvidence === 'none' || totalSamples < MIN_OUTCOME_SAMPLES) {
    confidenceAdjustment = 'insufficient'
  } else if (
    (predictedSuccessLikelihood === 'strong' || predictedSuccessLikelihood === 'moderate') &&
    (historicalEvidence === 'strong' || historicalEvidence === 'moderate') &&
    plan.planConfidence !== 'high'
  ) {
    confidenceAdjustment = 'raise'
  } else if (
    (predictedSuccessLikelihood === 'limited' || predictedSuccessLikelihood === 'mixed') &&
    (historicalEvidence === 'strong' || historicalEvidence === 'moderate') &&
    plan.planConfidence !== 'low'
  ) {
    confidenceAdjustment = 'lower'
  } else {
    confidenceAdjustment = 'hold'
  }

  return {
    productId:                  plan.productId,
    predictedSuccessLikelihood,
    likelihoodNote,
    historicalEvidence,
    sampleSize:                 totalSamples,
    supportingFactors:          uniqueFactors,
    cautionFlags:               uniqueCautions,
    confidenceAdjustment,
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computePredictivePlanEnrichments(
  plans:               AllocationPlan[],
  decisionQuality:     DecisionQualityOutput | null,
  effectivenessRollups: EffectivenessRollupOutput | null,
  generatedAt:         string = new Date().toISOString(),
): PredictivePlanningOutput {
  const enrichments: Record<string, PredictivePlanEnrichment> = {}

  for (const plan of plans) {
    enrichments[plan.productId] = enrichOnePlan(plan, decisionQuality, effectivenessRollups)
  }

  const plansWithEvidence = Object.values(enrichments).filter(
    e => e.historicalEvidence !== 'none',
  ).length

  const dataNote =
    plansWithEvidence > 0
      ? `Predictive enrichment available for ${plansWithEvidence} of ${plans.length} plan${plans.length !== 1 ? 's' : ''}.`
      : `Insufficient historical outcome data — predictions will improve as executions are recorded and measured.`

  return { enrichments, generatedAt, dataNote }
}
