/**
 * lib/planAdherenceEngine.ts
 *
 * Phase 14 — Execution Tracking & Plan Adherence
 *
 * Pure function — no DB access.
 *
 * Derives a single planAdherence label by comparing:
 *   recommended (what the engine said)
 *   selected    (what the admin decided to do — accepted or overridden)
 *   executed    (what was actually done)
 *   executionStatus ('EXECUTED' | 'PARTIAL' | 'DEVIATED' | 'NOT_EXECUTED')
 *
 * ADHERENCE LABELS:
 *   matched_recommendation  — executed == recommended exactly; decision was ACCEPTED
 *   matched_decision        — executed == selected (override was faithfully executed)
 *   recommendation_restored — admin overrode recommendation, but execution reverted
 *                             back to the original recommended values
 *   deviated_from_decision  — executed differs from both recommended and selected
 *   partially_executed      — executionStatus is PARTIAL (some steps done, not all)
 *   not_executed            — plan was never carried out
 */

export type PlanAdherenceLabel =
  | 'matched_recommendation'
  | 'matched_decision'
  | 'recommendation_restored'
  | 'deviated_from_decision'
  | 'partially_executed'
  | 'not_executed'
  | 'pending'

export interface AdherenceInput {
  decisionStatus: string  // 'ACCEPTED' | 'OVERRIDDEN' | 'DEFERRED'
  executionStatus: string // 'EXECUTED' | 'PARTIAL' | 'DEVIATED' | 'NOT_EXECUTED' | 'PENDING'

  recommendedAllocationSizing: string
  recommendedReleaseTiming:    string
  recommendedRolloutMode:      string

  // Null when decisionStatus is DEFERRED
  selectedAllocationSizing: string | null
  selectedReleaseTiming:    string | null
  selectedRolloutMode:      string | null

  // Null when executionStatus is NOT_EXECUTED or PENDING
  executedAllocationSizing: string | null
  executedReleaseTiming:    string | null
  executedRolloutMode:      string | null
}

function tripleMatch(a: string | null, b: string | null, c: string | null): boolean {
  return a !== null && b !== null && c !== null && a === b && b === c
}

function pairMatch(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && a === b
}

export function derivePlanAdherence(input: AdherenceInput): PlanAdherenceLabel {
  const {
    executionStatus,
    decisionStatus,
    recommendedAllocationSizing: rA,
    recommendedReleaseTiming:    rT,
    recommendedRolloutMode:      rR,
    selectedAllocationSizing:    sA,
    selectedReleaseTiming:       sT,
    selectedRolloutMode:         sR,
    executedAllocationSizing:    eA,
    executedReleaseTiming:       eT,
    executedRolloutMode:         eR,
  } = input

  if (executionStatus === 'PENDING')      return 'pending'
  if (executionStatus === 'NOT_EXECUTED') return 'not_executed'
  if (executionStatus === 'PARTIAL')      return 'partially_executed'

  // At this point we have executed values (EXECUTED or DEVIATED)
  const executedMatchesRecommended = (
    pairMatch(eA, rA) && pairMatch(eT, rT) && pairMatch(eR, rR)
  )

  // "plan" = what was selected, or fall back to recommended if ACCEPTED
  const planA = sA ?? rA
  const planT = sT ?? rT
  const planR = sR ?? rR

  const executedMatchesPlan = (
    pairMatch(eA, planA) && pairMatch(eT, planT) && pairMatch(eR, planR)
  )

  if (executedMatchesRecommended && (decisionStatus === 'ACCEPTED' || !sA)) {
    return 'matched_recommendation'
  }

  if (executedMatchesPlan && !executedMatchesRecommended) {
    // Admin chose to override, and executed their override faithfully
    return 'matched_decision'
  }

  if (!executedMatchesPlan && executedMatchesRecommended && decisionStatus === 'OVERRIDDEN') {
    // Admin overrode but execution ended up matching original recommendation anyway
    return 'recommendation_restored'
  }

  return 'deviated_from_decision'
}

// ── Human-readable labels for display ────────────────────────────────────────

export const ADHERENCE_LABEL: Record<PlanAdherenceLabel, string> = {
  matched_recommendation:  'Followed recommendation',
  matched_decision:        'Followed override',
  recommendation_restored: 'Recommendation restored',
  deviated_from_decision:  'Deviated from plan',
  partially_executed:      'Partially executed',
  not_executed:            'Not executed',
  pending:                 'Not yet executed',
}

export const ADHERENCE_COLOR: Record<PlanAdherenceLabel, string> = {
  matched_recommendation:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  matched_decision:        'bg-sky-50 text-sky-700 border border-sky-200',
  recommendation_restored: 'bg-violet-50 text-violet-700 border border-violet-200',
  deviated_from_decision:  'bg-red-50 text-red-700 border border-red-200',
  partially_executed:      'bg-amber-50 text-amber-700 border border-amber-200',
  not_executed:            'bg-gray-50 text-gray-500 border border-gray-200',
  pending:                 'bg-parchment-50 text-olive-400 border border-olive-200',
}
