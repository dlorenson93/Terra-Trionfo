/**
 * deriveLearningSignals.ts
 *
 * Derives human-readable portfolio learning signals from effectiveness rollup
 * output. These signals describe which strategies, regions, and styles are
 * showing the strongest and weakest response to admin actions.
 *
 * Input:  EffectivenessRollupOutput (from effectivenessRollups.ts)
 * Output: LearningSignals — summary insights for admin display and
 *         consumption by the recommendationBiasEngine.
 *
 * This module is pure — no DB access, no side effects.
 * Never expose to consumers.
 */

import type { EffectivenessRollupOutput, DimensionRollup } from './effectivenessRollups'

// ── Output types ──────────────────────────────────────────────────────────────

export interface DimensionSignal {
  key:          string
  label:        string
  positiveRate: number
  averageDelta: number
  sampleCount:  number
  insight:      string   // sentence-form explanation for admin display
}

export interface LearningSignals {
  // Per-dimension best/worst
  strongestActionType:     DimensionSignal | null
  weakestActionType:       DimensionSignal | null
  strongestRegionResponse: DimensionSignal | null
  weakestRegionResponse:   DimensionSignal | null
  mostResponsiveStyle:     DimensionSignal | null
  leastResponsiveStyle:    DimensionSignal | null
  mostResponsivePriceTier: DimensionSignal | null

  // Portfolio-level learning sentences
  portfolioInsights: string[]

  // Bias-engine inputs — confidence adjustment direction per action type
  // Positive value → actions of this type tend to work; boost confidence
  // Negative value → actions tend to underperform; reduce confidence
  actionTypeBiasHints: Record<string, number>  // actionTypeKey → −1.0 to +1.0

  // Computed at
  computedAt: string   // ISO timestamp
}

// ── Reliability threshold ────────────────────────────────────────────────────

/** Minimum samples before treating a dimension's rate as reliable. */
const MIN_SAMPLES = 2

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDimensionSignal(r: DimensionRollup, insightFn: (r: DimensionRollup) => string): DimensionSignal {
  return {
    key:          r.key,
    label:        r.label,
    positiveRate: r.positiveRate,
    averageDelta: r.averageDelta,
    sampleCount:  r.totalCount,
    insight:      insightFn(r),
  }
}

function bestByPositiveRate(items: DimensionRollup[]): DimensionRollup | null {
  const reliable = items.filter(i => i.totalCount >= MIN_SAMPLES)
  if (!reliable.length) return null
  return reliable.reduce((best, cur) => cur.positiveRate > best.positiveRate ? cur : best)
}

function worstByPositiveRate(items: DimensionRollup[]): DimensionRollup | null {
  const reliable = items.filter(i => i.totalCount >= MIN_SAMPLES)
  if (!reliable.length) return null
  return reliable.reduce((worst, cur) => cur.positiveRate < worst.positiveRate ? cur : worst)
}

// ── Insight sentence builders ─────────────────────────────────────────────────

function actionInsight(r: DimensionRollup, pole: 'strong' | 'weak'): string {
  const rate  = r.positiveRate.toFixed(0)
  const delta = r.averageDelta >= 0 ? `+${r.averageDelta}` : `${r.averageDelta}`
  if (pole === 'strong') {
    return `"${r.label}" actions produced a positive shift ${rate}% of the time (avg ${delta} pts), making it the strongest-performing action type in this portfolio.`
  }
  return `"${r.label}" actions produced a positive shift only ${rate}% of the time (avg ${delta} pts). Consider whether this action type is well-matched to current product conditions.`
}

function regionInsight(r: DimensionRollup, pole: 'strong' | 'weak'): string {
  const rate  = r.positiveRate.toFixed(0)
  const delta = r.averageDelta >= 0 ? `+${r.averageDelta}` : `${r.averageDelta}`
  if (pole === 'strong') {
    return `${r.label} wines showed the strongest response to admin actions — ${rate}% positive shift (avg ${delta} pts). Prioritise action velocity here.`
  }
  return `${r.label} wines showed limited response to admin actions — ${rate}% positive shift (avg ${delta} pts). Signals may need time or more targeted interventions.`
}

function styleInsight(r: DimensionRollup, pole: 'strong' | 'weak'): string {
  const rate  = r.positiveRate.toFixed(0)
  const delta = r.averageDelta >= 0 ? `+${r.averageDelta}` : `${r.averageDelta}`
  if (pole === 'strong') {
    return `${r.label} wines responded most effectively — ${rate}% positive shift (avg ${delta} pts). Consider surfacing more ${r.label} to build momentum.`
  }
  return `${r.label} wines showed the least signal improvement — ${rate}% positive shift (avg ${delta} pts). May require demand-building investment before actions yield results.`
}

function priceTierInsight(r: DimensionRollup): string {
  const rate  = r.positiveRate.toFixed(0)
  return `${r.label} wines had a ${rate}% positive response rate — with ${r.totalCount} measured action${r.totalCount !== 1 ? 's' : ''}.`
}

// ── Bias hint derivation ──────────────────────────────────────────────────────

/**
 * Returns a bias hint in range [−1.0, +1.0] for each action type.
 * +1.0 = very strong performance → boost confidence
 * −1.0 = very poor performance  → reduce confidence
 *  0.0 = neutral / insufficient data
 *
 * Formula: normalize positiveRate around 50% midpoint, scaled to ±1.
 */
function deriveActionTypeBiasHints(
  actionTypePerformance: DimensionRollup[],
): Record<string, number> {
  const hints: Record<string, number> = {}
  for (const r of actionTypePerformance) {
    if (r.totalCount < MIN_SAMPLES) {
      hints[r.key] = 0
      continue
    }
    // positiveRate 0–100 → bias −1 to +1
    const raw   = (r.positiveRate - 50) / 50   // −1 to +1
    // Dampen — max real-world bias ±0.5 to avoid overcorrection
    hints[r.key] = Math.max(-0.5, Math.min(0.5, parseFloat(raw.toFixed(2))))
  }
  return hints
}

// ── Portfolio-level insights ──────────────────────────────────────────────────

function buildPortfolioInsights(rollups: EffectivenessRollupOutput): string[] {
  const s     = rollups.portfolioSummary
  const lines: string[] = []

  if (s.totalMeasured === 0) {
    lines.push('No effectiveness data available yet. Run the follow-up check after actions have been taken.')
    return lines
  }

  lines.push(`${s.positiveRate}% of actioned recommendations produced a positive signal shift across ${s.totalMeasured} measured product${s.totalMeasured !== 1 ? 's' : ''}.`)

  if (s.topPerformingActionType) {
    lines.push(`"${s.topPerformingActionType}" is the highest-performing action type in this portfolio.`)
  }
  if (s.worstPerformingActionType && s.worstPerformingActionType !== s.topPerformingActionType) {
    lines.push(`"${s.worstPerformingActionType}" has the lowest positive shift rate — review whether it's being applied in the right contexts.`)
  }
  if (s.topPerformingRegion) {
    lines.push(`${s.topPerformingRegion} wines are showing the strongest signal response to admin actions.`)
  }
  if (s.topPerformingStyle) {
    lines.push(`${s.topPerformingStyle} is the most responsive style segment — actions here are translating into measurable commercial improvement.`)
  }
  if (s.negativeRate > 20) {
    lines.push(`⚠ ${s.negativeRate}% of actioned products showed a negative shift. Consider reviewing whether timing or action type was correct.`)
  }
  if (s.avgDelta > 0) {
    lines.push(`Average signal score improvement after action: +${s.avgDelta} pts.`)
  }

  return lines
}

// ── Main export ───────────────────────────────────────────────────────────────

export function deriveLearningSignals(rollups: EffectivenessRollupOutput): LearningSignals {
  const { actionTypePerformance, regionPerformance, stylePerformance, priceTierPerformance } = rollups

  const bestAction  = bestByPositiveRate(actionTypePerformance)
  const worstAction = worstByPositiveRate(actionTypePerformance)
  const bestRegion  = bestByPositiveRate(regionPerformance)
  const worstRegion = worstByPositiveRate(regionPerformance)
  const bestStyle   = bestByPositiveRate(stylePerformance)
  const worstStyle  = worstByPositiveRate(stylePerformance)
  const bestPrice   = bestByPositiveRate(priceTierPerformance)

  return {
    strongestActionType:     bestAction  ? toDimensionSignal(bestAction,  r => actionInsight(r, 'strong')) : null,
    weakestActionType:       worstAction ? toDimensionSignal(worstAction, r => actionInsight(r, 'weak'))   : null,
    strongestRegionResponse: bestRegion  ? toDimensionSignal(bestRegion,  r => regionInsight(r, 'strong')) : null,
    weakestRegionResponse:   worstRegion ? toDimensionSignal(worstRegion, r => regionInsight(r, 'weak'))   : null,
    mostResponsiveStyle:     bestStyle   ? toDimensionSignal(bestStyle,   r => styleInsight(r, 'strong'))  : null,
    leastResponsiveStyle:    worstStyle  ? toDimensionSignal(worstStyle,  r => styleInsight(r, 'weak'))    : null,
    mostResponsivePriceTier: bestPrice   ? toDimensionSignal(bestPrice,   r => priceTierInsight(r))        : null,
    portfolioInsights:       buildPortfolioInsights(rollups),
    actionTypeBiasHints:     deriveActionTypeBiasHints(actionTypePerformance),
    computedAt:              new Date().toISOString(),
  }
}
