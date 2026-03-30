/**
 * lib/scenarioPlanningEngine.ts
 *
 * Phase 17 — Scenario Planning & Strategy Simulation
 *
 * Pure engine. No DB access.
 *
 * For each product in the current allocation plan set, generates up to 2
 * alternative plan scenarios by varying the most impactful decision axes:
 *
 *   - Release timing  (accelerate vs hold vs stage)
 *   - Allocation size (significant vs modest vs flat)
 *   - Rollout mode    (consumer-led vs trade-led vs balanced)
 *
 * Each scenario (recommended + alternatives) is scored by the predictive
 * planning engine and ranked. The admin can then compare strategies for a
 * single wine before deciding.
 *
 * CONSTRAINTS:
 * - Max 2 alternatives per product (keeps the UI compact)
 * - Alternatives must differ meaningfully from the recommendation in at least
 *   one decision axis — no duplicate scenarios
 * - Advisory only — nothing is auto-executed or auto-submitted
 *
 * Uses `enrichOnePlan` from predictivePlanningEngine.ts.
 */

import type { AllocationPlan }            from './allocationPlanningEngine'
import type { AllocationSizing, ReleaseTiming, RolloutMode } from './allocationPlanningEngine'
import type { DecisionQualityOutput }      from './decisionQualityRollups'
import type { EffectivenessRollupOutput }  from './effectivenessRollups'
import type { PredictivePlanEnrichment }   from './predictivePlanningEngine'
import { enrichOnePlan }                   from './predictivePlanningEngine'

// ── Output types ──────────────────────────────────────────────────────────────

export interface PlanScenario {
  label:            string              // e.g. "Recommended" / "Hold the line" / "Conservative alloc."
  allocationSizing: AllocationSizing
  releaseTiming:    ReleaseTiming
  rolloutMode:      RolloutMode
  enrichment:       PredictivePlanEnrichment
  likelihoodRank:   number              // 0=insufficient → 4=strong (for comparison)
}

export interface ScenarioComparison {
  productId:         string
  wineName:          string
  recommended:       PlanScenario
  alternatives:      PlanScenario[]     // 1–2 alternatives
  bestFitLabel:      string             // label of scenario with highest likelihoodRank
  confidenceSpread:  number             // likelihoodRank difference: best - worst
  spreadNote:        string             // 1-sentence interpretation of the spread
}

export interface ScenarioPlanningOutput {
  comparisons:  ScenarioComparison[]
  generatedAt:  string
  portfolioNote: string
}

// ── Likelihood rank ───────────────────────────────────────────────────────────

const LIKELIHOOD_RANK: Record<string, number> = {
  strong:            4,
  moderate:          3,
  mixed:             2,
  limited:           1,
  insufficient_data: 0,
}

// ── Human-readable labels for sizing / timing / rollout ───────────────────────

const SIZING_LABELS: Record<string, string> = {
  hold_flat:            'Hold flat',
  modest_increase:      'Modest increase',
  significant_increase: 'Significant increase',
  reduce_exposure:      'Reduce exposure',
  maintain:             'Maintain',
}

const TIMING_LABELS: Record<string, string> = {
  accelerate:              'Accelerate',
  hold_until_signal:       'Hold for signal',
  stage_two_waves:         'Stage 2 waves',
  release_trade_first:     'Trade first',
  release_consumer_first:  'Consumer first',
  no_action:               'No action',
}

const ROLLOUT_LABELS: Record<string, string> = {
  consumer_led:       'Consumer-led',
  trade_led:          'Trade-led',
  balanced:           'Balanced',
  soft_launch:        'Soft launch',
  allocation_first:   'Allocation first',
}

// ── Alternative generation ────────────────────────────────────────────────────

interface VariantSpec {
  label:            string
  allocationSizing: AllocationSizing
  releaseTiming:    ReleaseTiming
  rolloutMode:      RolloutMode
}

// Timing counterpart — the most meaningful opposite move
const TIMING_COUNTERPART: Partial<Record<ReleaseTiming, ReleaseTiming>> = {
  accelerate:             'hold_until_signal',
  hold_until_signal:      'accelerate',
  stage_two_waves:        'accelerate',
  release_trade_first:    'release_consumer_first',
  release_consumer_first: 'release_trade_first',
}

// Allocation counterpart — the next step up or down
const SIZING_COUNTERPART: Partial<Record<AllocationSizing, AllocationSizing>> = {
  significant_increase: 'modest_increase',
  modest_increase:      'hold_flat',
  hold_flat:            'modest_increase',
  reduce_exposure:      'hold_flat',
  maintain:             'modest_increase',
}

// Rollout counterpart — primary flip
const ROLLOUT_COUNTERPART: Partial<Record<RolloutMode, RolloutMode>> = {
  consumer_led:  'trade_led',
  trade_led:     'consumer_led',
  balanced:      'consumer_led',
  soft_launch:   'balanced',
  allocation_first: 'trade_led',
}

function scenarioLabel(sizing: AllocationSizing, timing: ReleaseTiming, rollout: RolloutMode): string {
  if (timing === 'accelerate')          return `Accelerate${sizing !== 'hold_flat' ? ' & grow' : ''}`
  if (timing === 'hold_until_signal')   return 'Hold for signal'
  if (timing === 'stage_two_waves')     return 'Stage two waves'
  if (timing === 'release_trade_first' || rollout === 'trade_led') return 'Trade-first approach'
  if (timing === 'release_consumer_first' || rollout === 'consumer_led') return 'Consumer-first'
  if (sizing === 'significant_increase') return 'Aggressive allocation'
  if (sizing === 'modest_increase')     return 'Modest allocation'
  if (sizing === 'hold_flat')           return 'Hold the line'
  if (sizing === 'reduce_exposure')     return 'Reduce exposure'
  return `${TIMING_LABELS[timing] ?? timing} / ${SIZING_LABELS[sizing] ?? sizing}`
}

function generateAlternatives(plan: AllocationPlan): VariantSpec[] {
  const alts: VariantSpec[] = []

  // ── Alt 1: vary timing ───────────────────────────────────────────────────────
  const altTiming = TIMING_COUNTERPART[plan.releaseTiming]
  if (altTiming) {
    const sizing = plan.allocationSizing
    const rollout = plan.rolloutMode
    alts.push({
      label:            scenarioLabel(sizing, altTiming, rollout),
      allocationSizing: sizing,
      releaseTiming:    altTiming,
      rolloutMode:      rollout,
    })
  }

  // ── Alt 2: vary allocation sizing (and maybe rollout) ────────────────────────
  const altSizing = SIZING_COUNTERPART[plan.allocationSizing]
  if (altSizing) {
    // If timing is the same as alt 1, also flip the rollout to make this alt distinct
    let rollout = plan.rolloutMode
    const altRollout = ROLLOUT_COUNTERPART[rollout]
    if (altTiming && altRollout) {
      rollout = altRollout
    }
    const spec: VariantSpec = {
      label:            scenarioLabel(altSizing, plan.releaseTiming, rollout),
      allocationSizing: altSizing,
      releaseTiming:    plan.releaseTiming,
      rolloutMode:      rollout as RolloutMode,
    }
    // Deduplicate against alt 1 (unlikely but possible for some combos)
    const isDuplicate = alts.some(
      a =>
        a.allocationSizing === spec.allocationSizing &&
        a.releaseTiming    === spec.releaseTiming &&
        a.rolloutMode      === spec.rolloutMode,
    )
    if (!isDuplicate) alts.push(spec)
  }

  // Fallback: if we only have 0 alts (rare edge case), add a balanced/maintain scenario
  if (alts.length === 0) {
    alts.push({
      label:            'Balanced approach',
      allocationSizing: 'maintain',
      releaseTiming:    'no_action',
      rolloutMode:      'balanced',
    })
  }

  return alts.slice(0, 2)
}

// ── Scenario builder ──────────────────────────────────────────────────────────

function buildScenario(
  plan:       AllocationPlan,
  label:      string,
  sizing:     AllocationSizing,
  timing:     ReleaseTiming,
  rollout:    RolloutMode,
  dq:         DecisionQualityOutput | null,
  er:         EffectivenessRollupOutput | null,
): PlanScenario {
  // Build a synthetic plan variant for scoring — same product context, different axes
  const variantPlan: AllocationPlan = {
    ...plan,
    allocationSizing: sizing,
    releaseTiming:    timing,
    rolloutMode:      rollout,
    // Keep planConfidence neutral for alternatives so the predictive engine
    // evaluates the historical evidence, not a confidence inherited from the
    // recommended plan
    planConfidence:   'medium',
  }

  const enrichment   = enrichOnePlan(variantPlan, dq, er)
  const likelihoodRank = LIKELIHOOD_RANK[enrichment.predictedSuccessLikelihood] ?? 0

  return {
    label,
    allocationSizing: sizing,
    releaseTiming:    timing,
    rolloutMode:      rollout,
    enrichment,
    likelihoodRank,
  }
}

// ── Spread note ───────────────────────────────────────────────────────────────

function spreadNote(spread: number, bestLabel: string): string {
  if (spread === 0) return 'All scenarios show similar predicted likelihood — the decision is driven by operational preference.'
  if (spread === 1) return `Scenarios are closely matched — "${bestLabel}" has a slight historical edge.`
  if (spread === 2) return `Moderate divergence — "${bestLabel}" shows meaningfully better historical outcomes.`
  return `Strong divergence — "${bestLabel}" is clearly supported by the stronger historical evidence.`
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeScenarioPlanning(
  plans:               AllocationPlan[],
  decisionQuality:     DecisionQualityOutput | null,
  effectivenessRollups: EffectivenessRollupOutput | null,
  generatedAt:         string = new Date().toISOString(),
): ScenarioPlanningOutput {
  const comparisons: ScenarioComparison[] = []

  for (const plan of plans) {
    // Score the recommended plan
    const recommended = buildScenario(
      plan,
      'Recommended',
      plan.allocationSizing,
      plan.releaseTiming,
      plan.rolloutMode,
      decisionQuality,
      effectivenessRollups,
    )

    // Generate and score alternatives
    const altSpecs = generateAlternatives(plan)
    const alternatives: PlanScenario[] = altSpecs.map(spec =>
      buildScenario(
        plan, spec.label, spec.allocationSizing, spec.releaseTiming,
        spec.rolloutMode, decisionQuality, effectivenessRollups,
      )
    )

    // Rank all scenarios
    const allScenarios = [recommended, ...alternatives]
    const best  = allScenarios.reduce((b, s) => s.likelihoodRank > b.likelihoodRank ? s : b)
    const worst = allScenarios.reduce((w, s) => s.likelihoodRank < w.likelihoodRank ? s : w)

    comparisons.push({
      productId:        plan.productId,
      wineName:         plan.wineName,
      recommended,
      alternatives,
      bestFitLabel:     best.label,
      confidenceSpread: best.likelihoodRank - worst.likelihoodRank,
      spreadNote:       spreadNote(best.likelihoodRank - worst.likelihoodRank, best.label),
    })
  }

  // Portfolio-level observation note
  const strongDivergence = comparisons.filter(c => c.confidenceSpread >= 2).length
  const altBetter        = comparisons.filter(c => c.bestFitLabel !== 'Recommended').length
  let portfolioNote: string
  if (comparisons.length === 0) {
    portfolioNote = 'No products with sufficient signal for scenario planning.'
  } else if (altBetter > comparisons.length / 2) {
    portfolioNote = `${altBetter} of ${comparisons.length} products have an alternative scenario with stronger predicted outcomes than the recommendation — review before accepting.`
  } else if (strongDivergence > 0) {
    portfolioNote = `${strongDivergence} product${strongDivergence !== 1 ? 's show' : ' shows'} strong divergence between scenarios — these decisions carry the most strategic consequence.`
  } else {
    portfolioNote = `Scenarios show similar predicted outcomes across ${comparisons.length} product${comparisons.length !== 1 ? 's' : ''} — decisions are operationally driven.`
  }

  return { comparisons, generatedAt, portfolioNote }
}

// ── Label helpers (re-exported for admin UI use) ──────────────────────────────

export { SIZING_LABELS as SCENARIO_SIZING_LABELS, TIMING_LABELS as SCENARIO_TIMING_LABELS, ROLLOUT_LABELS as SCENARIO_ROLLOUT_LABELS }
