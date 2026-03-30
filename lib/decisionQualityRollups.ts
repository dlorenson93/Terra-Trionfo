/**
 * lib/decisionQualityRollups.ts
 *
 * Phase 15 — Decision Quality & Adherence Analytics
 *
 * Pure aggregation — no DB access. Takes:
 *   decisions: ProductPlanningDecision rows joined with product region/style/tier
 *
 * Produces rollups that answer:
 *   1. Recommendation quality — accepted vs overridden outcome rates
 *   2. Override quality       — do overrides improve results?
 *   3. Execution quality      — full vs partial vs deviated vs not-executed outcomes
 *   4. Adherence quality      — which adherence labels correlate with positive shifts
 *   5. Dimensional breakdown  — region, wineStyle, adherence label
 *   6. Process health summary — "where is the chain breaking down?"
 *
 * OUTCOME MAPPING:
 * We cross-join planning decisions with effectivenessDelta from the product
 * (latest measured value). This is a heuristic proxy until a direct
 * decision→effectiveness join is established via Phase 16 outcome linkage.
 *
 * EffectivenessDelta values: POSITIVE_SHIFT | MIXED_RESULT | NO_MEANINGFUL_CHANGE | NEGATIVE_SHIFT
 */

export interface DecisionRow {
  id:                       string
  productId:                string

  // Decision
  decisionStatus:           string   // ACCEPTED | OVERRIDDEN | DEFERRED | PENDING
  recommendedAllocationSizing: string
  selectedAllocationSizing: string | null
  executedAllocationSizing: string | null

  recommendedReleaseTiming: string
  selectedReleaseTiming:    string | null
  executedReleaseTiming:    string | null

  recommendedRolloutMode:   string
  selectedRolloutMode:      string | null
  executedRolloutMode:      string | null

  recommendedPlanConfidence: string  // 'high' | 'medium' | 'low'

  // Execution
  executionStatus:  string  // PENDING | EXECUTED | PARTIAL | DEVIATED | NOT_EXECUTED
  planAdherence:    string | null

  // Outcome — from product
  effectivenessDelta: string | null  // POSITIVE_SHIFT | MIXED_RESULT | NO_MEANINGFUL_CHANGE | NEGATIVE_SHIFT

  // Dimensions — from product
  region:     string | null
  wineStyle:  string | null
  priceTier:  string | null  // derived by caller: 'entry' | 'mid' | 'premium' | 'ultra-premium'
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface QualityBucket {
  label:        string
  count:        number
  withOutcome:  number   // rows that have an effectivenessDelta (measured)
  positiveRate: number   // % of measured rows with POSITIVE_SHIFT
  mixedRate:    number
  negativeRate: number
  noChangeRate: number
}

export interface RecommendationQuality {
  accepted:   QualityBucket
  overridden: QualityBucket
  deferred:   QualityBucket
  overrideAdvantage: number  // overridden.positiveRate - accepted.positiveRate (pp)
  overrideAdvantageNote: string
}

export interface ExecutionQuality {
  executed:    QualityBucket
  partial:     QualityBucket
  deviated:    QualityBucket
  notExecuted: QualityBucket
  executionCompletionRate: number  // % of decided plans that were executed (full or partial)
  executionQualityNote: string
}

export interface AdherenceQuality {
  matchedRecommendation:  QualityBucket
  matchedDecision:        QualityBucket
  recommendationRestored: QualityBucket
  deviatedFromDecision:   QualityBucket
  partiallyExecuted:      QualityBucket
  notExecuted:            QualityBucket
  bestAdherencePattern:   string
  worstAdherencePattern:  string
}

export interface DimensionBreakdown {
  key:          string
  label:        string
  count:        number
  withOutcome:  number
  positiveRate: number
  acceptedRate: number    // what % of decisions in this dim were ACCEPTED
  executedRate: number    // what % of decided plans were fully executed
}

export interface ProcessHealthSummary {
  totalDecisions:        number
  decidedCount:          number     // ACCEPTED + OVERRIDDEN
  executedCount:         number     // EXECUTED + PARTIAL
  measuredCount:         number     // has effectivenessDelta
  decisionCoverageRate:  number     // decidedCount / totalDecisions
  executionCoverageRate: number     // executedCount / decidedCount  (0 if 0 decided)
  measurementCoverageRate: number   // measuredCount / executedCount  (0 if 0 executed)
  overallPositiveRate:   number
  breakdownNotes:        string[]   // 1–4 human-readable observations
}

export interface DecisionQualityOutput {
  recommendationQuality: RecommendationQuality
  executionQuality:      ExecutionQuality
  adherenceQuality:      AdherenceQuality
  regionBreakdown:       DimensionBreakdown[]
  styleBreakdown:        DimensionBreakdown[]
  processHealth:         ProcessHealthSummary
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPositive(delta: string | null)  { return delta === 'POSITIVE_SHIFT' }
function isMixed(delta: string | null)     { return delta === 'MIXED_RESULT' }
function isNegative(delta: string | null)  { return delta === 'NEGATIVE_SHIFT' }
function isNoChange(delta: string | null)  { return delta === 'NO_MEANINGFUL_CHANGE' }
function hasDelta(delta: string | null)    { return delta !== null }

function pct(n: number, d: number): number {
  if (d === 0) return 0
  return Math.round((n / d) * 1000) / 10  // one decimal
}

function buildBucket(label: string, rows: DecisionRow[]): QualityBucket {
  const measured = rows.filter(r => hasDelta(r.effectivenessDelta))
  return {
    label,
    count:        rows.length,
    withOutcome:  measured.length,
    positiveRate: pct(measured.filter(r => isPositive(r.effectivenessDelta)).length, measured.length),
    mixedRate:    pct(measured.filter(r => isMixed(r.effectivenessDelta)).length,    measured.length),
    negativeRate: pct(measured.filter(r => isNegative(r.effectivenessDelta)).length, measured.length),
    noChangeRate: pct(measured.filter(r => isNoChange(r.effectivenessDelta)).length, measured.length),
  }
}

function bestBucket(buckets: { label: string; withOutcome: number; positiveRate: number }[]): string {
  const eligible = buckets.filter(b => b.withOutcome >= 2)
  if (eligible.length === 0) return 'insufficient data'
  return eligible.reduce((best, b) => b.positiveRate > best.positiveRate ? b : best).label
}

function worstBucket(buckets: { label: string; withOutcome: number; positiveRate: number }[]): string {
  const eligible = buckets.filter(b => b.withOutcome >= 2)
  if (eligible.length === 0) return 'insufficient data'
  return eligible.reduce((worst, b) => b.positiveRate < worst.positiveRate ? b : worst).label
}

// ── Main function ─────────────────────────────────────────────────────────────

export function computeDecisionQualityRollups(rows: DecisionRow[]): DecisionQualityOutput {
  // ── Recommendation quality ──────────────────────────────────────────────────
  const accepted   = buildBucket('Accepted',   rows.filter(r => r.decisionStatus === 'ACCEPTED'))
  const overridden = buildBucket('Overridden', rows.filter(r => r.decisionStatus === 'OVERRIDDEN'))
  const deferred   = buildBucket('Deferred',   rows.filter(r => r.decisionStatus === 'DEFERRED'))

  const overrideAdvantage = overridden.withOutcome >= 2 && accepted.withOutcome >= 2
    ? Math.round((overridden.positiveRate - accepted.positiveRate) * 10) / 10
    : 0

  let overrideAdvantageNote: string
  if (accepted.withOutcome < 2 || overridden.withOutcome < 2) {
    overrideAdvantageNote = 'Insufficient data to compare accepted vs overridden outcomes.'
  } else if (overrideAdvantage > 10) {
    overrideAdvantageNote = `Human overrides are outperforming recommendations by ${overrideAdvantage}pp — the engine may be miscalibrated for this portfolio.`
  } else if (overrideAdvantage < -10) {
    overrideAdvantageNote = `Accepted recommendations outperform overrides by ${Math.abs(overrideAdvantage)}pp — the engine is directionally correct; trust it more.`
  } else {
    overrideAdvantageNote = `Overrides and accepted recommendations produce similar outcomes (${overrideAdvantage > 0 ? '+' : ''}${overrideAdvantage}pp difference).`
  }

  const recommendationQuality: RecommendationQuality = {
    accepted, overridden, deferred, overrideAdvantage, overrideAdvantageNote,
  }

  // ── Execution quality ───────────────────────────────────────────────────────
  const decided = rows.filter(r => r.decisionStatus === 'ACCEPTED' || r.decisionStatus === 'OVERRIDDEN')
  const executedFull  = buildBucket('Fully Executed',     rows.filter(r => r.executionStatus === 'EXECUTED'))
  const partialExec   = buildBucket('Partially Executed', rows.filter(r => r.executionStatus === 'PARTIAL'))
  const deviatedExec  = buildBucket('Deviated',          rows.filter(r => r.executionStatus === 'DEVIATED'))
  const notExecuted   = buildBucket('Not Executed',       rows.filter(r => r.executionStatus === 'NOT_EXECUTED'))

  const executedCount     = rows.filter(r => r.executionStatus === 'EXECUTED' || r.executionStatus === 'PARTIAL').length
  const executionCoverage = pct(executedCount, decided.length)

  let executionQualityNote: string
  if (decided.length < 3) {
    executionQualityNote = 'Not enough decisions recorded to assess execution quality.'
  } else if (executionCoverage < 30) {
    executionQualityNote = `Only ${executionCoverage}% of decisions have been marked as executed. Improve execution tracking to enable outcome comparison.`
  } else if (deviatedExec.count > executedFull.count) {
    executionQualityNote = `More plans deviated than were executed cleanly — execution discipline appears to be a weak link.`
  } else if (executedFull.positiveRate > deviatedExec.positiveRate + 15) {
    executionQualityNote = `Clean execution strongly outperforms deviated execution (+${Math.round(executedFull.positiveRate - deviatedExec.positiveRate)}pp) — process discipline matters.`
  } else {
    executionQualityNote = `Execution quality is tracking. ${executionCoverage}% of decided plans have been marked executed.`
  }

  const executionQuality: ExecutionQuality = {
    executed:    executedFull,
    partial:     partialExec,
    deviated:    deviatedExec,
    notExecuted,
    executionCompletionRate: executionCoverage,
    executionQualityNote,
  }

  // ── Adherence quality ───────────────────────────────────────────────────────
  const adhBuckets = {
    matchedRecommendation:  buildBucket('Matched recommendation', rows.filter(r => r.planAdherence === 'matched_recommendation')),
    matchedDecision:        buildBucket('Matched override',       rows.filter(r => r.planAdherence === 'matched_decision')),
    recommendationRestored: buildBucket('Recommendation restored',rows.filter(r => r.planAdherence === 'recommendation_restored')),
    deviatedFromDecision:   buildBucket('Deviated from plan',     rows.filter(r => r.planAdherence === 'deviated_from_decision')),
    partiallyExecuted:      buildBucket('Partially executed',     rows.filter(r => r.planAdherence === 'partially_executed')),
    notExecuted:            buildBucket('Not executed',           rows.filter(r => r.planAdherence === 'not_executed')),
  }

  const allAdhBuckets = Object.values(adhBuckets)
  const bestAdherencePattern  = bestBucket(allAdhBuckets)
  const worstAdherencePattern = worstBucket(allAdhBuckets)

  const adherenceQuality: AdherenceQuality = {
    ...adhBuckets, bestAdherencePattern, worstAdherencePattern,
  }

  // ── Dimensional breakdown ───────────────────────────────────────────────────
  function buildDimension(key: string, dimRows: DecisionRow[]): DimensionBreakdown {
    const measured = dimRows.filter(r => hasDelta(r.effectivenessDelta))
    return {
      key,
      label:        key,
      count:        dimRows.length,
      withOutcome:  measured.length,
      positiveRate: pct(measured.filter(r => isPositive(r.effectivenessDelta)).length, measured.length),
      acceptedRate: pct(dimRows.filter(r => r.decisionStatus === 'ACCEPTED').length, dimRows.length),
      executedRate: pct(
        dimRows.filter(r => r.executionStatus === 'EXECUTED' || r.executionStatus === 'PARTIAL').length,
        dimRows.filter(r => r.decisionStatus === 'ACCEPTED' || r.decisionStatus === 'OVERRIDDEN').length,
      ),
    }
  }

  function groupBy<T>(arr: T[], key: (item: T) => string | null): Map<string, T[]> {
    const map = new Map<string, T[]>()
    for (const item of arr) {
      const k = key(item) ?? 'Unknown'
      const existing = map.get(k) ?? []
      existing.push(item)
      map.set(k, existing)
    }
    return map
  }

  const regionGroups = groupBy(rows, r => r.region)
  const styleGroups  = groupBy(rows, r => r.wineStyle)

  const regionBreakdown: DimensionBreakdown[] = [...regionGroups.entries()]
    .map(([k, v]) => buildDimension(k, v))
    .filter(d => d.count >= 2)
    .sort((a, b) => b.count - a.count)

  const styleBreakdown: DimensionBreakdown[] = [...styleGroups.entries()]
    .map(([k, v]) => buildDimension(k, v))
    .filter(d => d.count >= 2)
    .sort((a, b) => b.count - a.count)

  // ── Process health ──────────────────────────────────────────────────────────
  const totalDecisions    = rows.length
  const decidedCount      = decided.length
  const executedCountFull = rows.filter(r => r.executionStatus === 'EXECUTED' || r.executionStatus === 'PARTIAL').length
  const measuredCount     = rows.filter(r => hasDelta(r.effectivenessDelta)).length
  const measured          = rows.filter(r => hasDelta(r.effectivenessDelta))

  const decisionCoverageRate    = pct(decidedCount,       totalDecisions)
  const executionCoverageRate   = pct(executedCountFull,  decidedCount)
  const measurementCoverageRate = pct(measuredCount,      executedCountFull)
  const overallPositiveRate     = pct(measured.filter(r => isPositive(r.effectivenessDelta)).length, measured.length)

  const breakdownNotes: string[] = []

  if (decisionCoverageRate < 50 && totalDecisions > 3) {
    breakdownNotes.push(`${100 - decisionCoverageRate}% of generated plans have no human decision recorded — the planning loop is incomplete.`)
  }
  if (executionCoverageRate < 40 && decidedCount >= 3) {
    breakdownNotes.push(`Only ${executionCoverageRate}% of decided plans are marked as executed — execution tracking needs attention.`)
  }
  if (measurementCoverageRate < 30 && executedCountFull >= 3) {
    breakdownNotes.push(`Only ${measurementCoverageRate}% of executed plans have outcome data — effectiveness measurement is the binding constraint.`)
  }
  if (overrideAdvantage > 15 && overridden.withOutcome >= 3) {
    breakdownNotes.push(`Human overrides are consistently outperforming the engine (+${overrideAdvantage}pp). Consider reviewing the planning engine's weighting for this portfolio.`)
  }
  if (overrideAdvantage < -15 && accepted.withOutcome >= 3) {
    breakdownNotes.push(`Accepted recommendations consistently outperform overrides. The engine is well-calibrated — reduce friction on acceptance.`)
  }
  if (notExecuted.count > executedFull.count && decidedCount >= 3) {
    breakdownNotes.push(`More plans are not executed than are executed. The bottleneck is operational execution, not recommendation quality.`)
  }
  if (breakdownNotes.length === 0) {
    if (measuredCount === 0) {
      breakdownNotes.push('No outcome data yet. Record executions and await effectiveness measurements to power this analytics layer.')
    } else {
      breakdownNotes.push(`Pipeline looks healthy. ${decidedCount} decisions made, ${executedCountFull} executed, ${measuredCount} measured.`)
    }
  }

  const processHealth: ProcessHealthSummary = {
    totalDecisions,
    decidedCount,
    executedCount:         executedCountFull,
    measuredCount,
    decisionCoverageRate,
    executionCoverageRate,
    measurementCoverageRate,
    overallPositiveRate,
    breakdownNotes,
  }

  return {
    recommendationQuality,
    executionQuality,
    adherenceQuality,
    regionBreakdown,
    styleBreakdown,
    processHealth,
  }
}
