/**
 * lib/strategyExecutionLearningEngine.ts
 *
 * Phase 22 — Strategy Execution Learning Loop & Playbook Candidate Engine
 *
 * Pure engine. No DB access.
 *
 * Sits ABOVE all prior intelligence layers and synthesises repeatable strategic
 * memory from measured, fully-executed historical decisions.
 *
 * What this is NOT:
 *   - Does NOT duplicate strategyPatternEngine.ts  (single-dim pattern library)
 *   - Does NOT duplicate planningAttributionRollups.ts  (composition contributor trust)
 *   - Does NOT duplicate effectivenessRollups.ts  (product-level action rollups)
 *
 * What this adds:
 *   1. Requires full lifecycle completeness: decided → executed → adherence → measured
 *   2. Analyses six multi-dimensional combination families
 *   3. Conservative promotion thresholds — evidence-gated, conservative
 *   4. Risk playbook identification for persistent under-performing patterns
 *   5. Portfolio-level learning summary with generated narrative observations
 *   6. Coverage metrics so admin can understand data breadth
 *
 * Advisory only. ADMIN-ONLY. No autonomous behavior.
 */

const MIN_LEARNING_SAMPLES         = 3
const STRONG_CANDIDATE_THRESHOLD   = 70   // positiveRate >= 70% → strong candidate
const MODERATE_CANDIDATE_THRESHOLD = 60   // positiveRate >= 60% → watch/moderate
const RISK_WARNING_THRESHOLD       = 25   // positiveRate <= 25% → warning
const RISK_WATCH_THRESHOLD         = 35   // positiveRate <= 35% → watch

// ── Input ─────────────────────────────────────────────────────────────────────

export interface LearningRow {
  id:       string
  productId: string

  // From Product
  recommendationActionType: string | null   // RecommendationActionType enum value
  region:    string | null
  wineStyle: string | null
  priceTier: string | null                  // derived: 'entry'|'mid'|'premium'|'ultra-premium'

  // From ProductPlanningDecision
  selectedAllocationSizing: string | null
  selectedReleaseTiming:    string | null
  selectedRolloutMode:      string | null
  decisionStatus:           string          // ACCEPTED | OVERRIDDEN | DEFERRED

  // Execution
  executionStatus: string                   // EXECUTED | PARTIAL | DEVIATED | NOT_EXECUTED
  planAdherence:   string | null            // matched_recommendation | deviated_from_decision | etc.

  // Outcome (from Product.effectivenessDelta)
  effectivenessDelta: string | null         // POSITIVE_SHIFT | NO_MEANINGFUL_CHANGE | NEGATIVE_SHIFT | MIXED_RESULT
}

// ── Output types ──────────────────────────────────────────────────────────────

export type PlaybookConfidence = 'strong' | 'moderate' | 'limited'
export type PlaybookStatus     = 'candidate' | 'watch' | 'insufficient'
export type RiskStatus         = 'warning' | 'watch' | 'insufficient'

export interface PlaybookCandidate {
  id:               string
  family:           string           // 'A'|'B'|'C'|'D'|'E'|'F'
  title:            string
  description:      string
  region?:          string
  style?:           string
  priceTier?:       string
  rolloutMode?:     string
  releaseTiming?:   string
  allocationSizing?: string
  actionType?:      string
  adherencePattern?: string
  evidenceCount:    number
  positiveRate:     number           // 0–100
  avgDelta:         number           // −1.0 to +1.0
  confidence:       PlaybookConfidence
  playbookStatus:   PlaybookStatus
  supportingSignals: string[]
  governanceNote:   string
}

export interface RiskPlaybook {
  id:              string
  family:          string
  title:           string
  description:     string
  region?:         string
  style?:          string
  priceTier?:      string
  rolloutMode?:    string
  releaseTiming?:  string
  allocationSizing?: string
  actionType?:     string
  evidenceCount:   number
  positiveRate:    number
  negativeRate:    number
  avgDelta:        number
  confidence:      PlaybookConfidence
  riskStatus:      RiskStatus
  cautionSignals:  string[]
  governanceNote:  string
}

export interface ExecutionLearningSummary {
  strongestWinningCandidate:   PlaybookCandidate | null
  strongestRiskPlaybook:       RiskPlaybook | null
  strongestRegionMemory:       string | null
  strongestStyleMemory:        string | null
  bestAdherencePattern:        string | null
  executionPatternForPositive: string | null
  executionPatternForNegative: string | null
  portfolioObservations:       string[]     // 1–3 evidence-driven narrative sentences
}

export interface LearningCoverage {
  totalEligibleDecisions:    number
  totalWithFullLifecycle:    number
  playbookCandidateCount:    number
  riskPlaybookCount:         number
  dimensionsAnalyzed:        number
  dimensionsWithEvidence:    number
  dimensionsUnderpowered:    number
  coveragePercentage:        number        // 0–100
}

export interface StrategyExecutionLearningOutput {
  playbookCandidates:       PlaybookCandidate[]
  riskPlaybooks:            RiskPlaybook[]
  executionLearningSummary: ExecutionLearningSummary
  learningCoverage:         LearningCoverage
  generatedAt:              string
  dataNote?:                string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deltaScore(d: string | null | undefined): number {
  switch (d) {
    case 'POSITIVE_SHIFT':       return  1
    case 'NEGATIVE_SHIFT':       return -1
    case 'MIXED_RESULT':         return -0.25
    case 'NO_MEANINGFUL_CHANGE': return  0
    default:                     return  0
  }
}

function isPositive(d: string | null | undefined): boolean { return d === 'POSITIVE_SHIFT' }
function isNegative(d: string | null | undefined): boolean {
  return d === 'NEGATIVE_SHIFT' || d === 'MIXED_RESULT'
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
}

function pct(n: number, d: number): number {
  if (d === 0) return 0
  return Math.round((n / d) * 100)
}

function slugify(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

// ── Dimension label formatters ─────────────────────────────────────────────────

function fmtRollout(r: string): string {
  const m: Record<string, string> = {
    trade_first:        'trade-first rollout',
    consumer_first:     'consumer-first rollout',
    balanced:           'balanced rollout',
    direct_to_consumer: 'direct-to-consumer rollout',
  }
  return m[r] ?? r.replace(/_/g, ' ')
}

function fmtAlloc(a: string): string {
  const m: Record<string, string> = {
    significant_increase:  'significant allocation increase',
    modest_increase:       'modest allocation increase',
    maintain:              'maintained allocation',
    modest_reduction:      'modest allocation reduction',
    significant_reduction: 'significant allocation reduction',
  }
  return m[a] ?? a.replace(/_/g, ' ')
}

function fmtTiming(t: string): string {
  const m: Record<string, string> = {
    accelerate: 'accelerated release',
    hold:       'held release',
    maintain:   'standard timing',
    delay:      'delayed release',
  }
  return m[t] ?? t.replace(/_/g, ' ')
}

function fmtAction(a: string): string {
  const m: Record<string, string> = {
    ACCELERATE_RELEASE:     'accelerate release',
    HOLD_RELEASE:           'hold release',
    INCREASE_ALLOCATION:    'increase allocation',
    REDUCE_EXPOSURE:        'reduce exposure',
    INCREASE_MERCHANDISING: 'increase merchandising',
    MAINTAIN:               'maintain',
    NONE:                   'no action',
  }
  return m[a] ?? a.replace(/_/g, ' ').toLowerCase()
}

function fmtAdherence(a: string): string {
  const m: Record<string, string> = {
    matched_recommendation:  'recommendation followed',
    matched_decision:        'override decision followed',
    recommendation_restored: 'recommendation restored',
    deviated_from_decision:  'plan deviation',
    partially_executed:      'partial execution',
    not_executed:            'plan not executed',
  }
  return m[a] ?? a.replace(/_/g, ' ')
}

function fmtExecStatus(s: string): string {
  const m: Record<string, string> = {
    EXECUTED:     'fully executed',
    PARTIAL:      'partially executed',
    DEVIATED:     'execution deviated',
    NOT_EXECUTED: 'not executed',
  }
  return m[s] ?? s.toLowerCase()
}

// ── Classifiers ───────────────────────────────────────────────────────────────

function classifyConf(count: number, rate: number): PlaybookConfidence {
  if (count >= MIN_LEARNING_SAMPLES * 2 && rate >= STRONG_CANDIDATE_THRESHOLD) return 'strong'
  if (count >= MIN_LEARNING_SAMPLES     && rate >= MODERATE_CANDIDATE_THRESHOLD) return 'moderate'
  return 'limited'
}

function classifyRiskConf(count: number, rate: number): PlaybookConfidence {
  if (count >= MIN_LEARNING_SAMPLES * 2 && rate <= RISK_WARNING_THRESHOLD) return 'strong'
  if (count >= MIN_LEARNING_SAMPLES)                                        return 'moderate'
  return 'limited'
}

function classifyStatus(count: number, rate: number): PlaybookStatus {
  if (count < MIN_LEARNING_SAMPLES)              return 'insufficient'
  if (rate >= STRONG_CANDIDATE_THRESHOLD)         return 'candidate'
  if (rate >= MODERATE_CANDIDATE_THRESHOLD)       return 'watch'
  return 'watch'
}

function classifyRiskStatus(count: number, rate: number): RiskStatus {
  if (count < MIN_LEARNING_SAMPLES)       return 'insufficient'
  if (rate <= RISK_WARNING_THRESHOLD)     return 'warning'
  if (rate <= RISK_WATCH_THRESHOLD)       return 'watch'
  return 'watch'
}

function govNote(count: number, rate: number): string {
  if (count < MIN_LEARNING_SAMPLES) {
    return 'Insufficient evidence — below minimum sample requirement.'
  }
  if (count < MIN_LEARNING_SAMPLES * 2) {
    return `Evidence is building (n=${count}). Use as directional guidance only. Do not promote to default strategy without further measured outcomes.`
  }
  if (rate >= 80) {
    return `Strong repeat pattern across ${count} measured decisions. Reliable strategic guidance.`
  }
  return `This pattern has repeated across ${count} measured decisions. Treat as moderate-confidence guidance.`
}

function riskGovNote(count: number, rate: number): string {
  if (count < MIN_LEARNING_SAMPLES) {
    return 'Insufficient evidence to confirm as a reliable risk pattern.'
  }
  return `Repeated underperformance across ${count} decisions (${rate}% positive). Review before repeating this combination.`
}

// ── Group analysis ────────────────────────────────────────────────────────────

interface GroupStat {
  key:          string
  count:        number
  positive:     number
  negative:     number
  positiveRate: number
  negativeRate: number
  avgDelta:     number
  rows:         LearningRow[]
}

function analyzeGroups(rows: LearningRow[], keyFn: (r: LearningRow) => string | null): GroupStat[] {
  const groups = new Map<string, LearningRow[]>()
  for (const r of rows) {
    const k = keyFn(r)
    if (!k) continue
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(r)
  }
  return Array.from(groups.entries()).map(([key, rows_]) => {
    const count        = rows_.length
    const positive     = rows_.filter(r => isPositive(r.effectivenessDelta)).length
    const negative     = rows_.filter(r => isNegative(r.effectivenessDelta)).length
    const positiveRate = pct(positive, count)
    const negativeRate = pct(negative, count)
    const avgD         = avg(rows_.map(r => deltaScore(r.effectivenessDelta)))
    return { key, count, positive, negative, positiveRate, negativeRate, avgDelta: avgD, rows: rows_ }
  })
}

function statsSummary(s: GroupStat): string {
  return `${s.positiveRate}% positive rate (n=${s.count}), avg delta ${s.avgDelta > 0 ? '+' : ''}${s.avgDelta.toFixed(2)}`
}

// ── Family A: Region × RolloutMode × AllocationSizing ─────────────────────────

function familyA(rows: LearningRow[]): { candidates: PlaybookCandidate[], risks: RiskPlaybook[] } {
  const stats = analyzeGroups(rows, r =>
    r.region && r.selectedRolloutMode && r.selectedAllocationSizing
      ? `${r.region}|${r.selectedRolloutMode}|${r.selectedAllocationSizing}`
      : null,
  )
  const candidates: PlaybookCandidate[] = []
  const risks: RiskPlaybook[] = []

  for (const s of stats) {
    if (s.count < MIN_LEARNING_SAMPLES) continue
    const [region, rolloutMode, allocationSizing] = s.key.split('|')
    const attrs = { region, rolloutMode, allocationSizing }

    if (s.positiveRate >= MODERATE_CANDIDATE_THRESHOLD) {
      candidates.push({
        id: `A-${slugify(s.key)}`, family: 'A',
        title: `${region}: ${fmtRollout(rolloutMode)} with ${fmtAlloc(allocationSizing)}`,
        description: `In ${region}, ${fmtRollout(rolloutMode)} combined with ${fmtAlloc(allocationSizing)} produced ${s.positiveRate}% positive outcomes across ${s.count} measured decisions.`,
        ...attrs,
        evidenceCount: s.count, positiveRate: s.positiveRate, avgDelta: s.avgDelta,
        confidence: classifyConf(s.count, s.positiveRate),
        playbookStatus: classifyStatus(s.count, s.positiveRate),
        supportingSignals: [statsSummary(s)],
        governanceNote: govNote(s.count, s.positiveRate),
      })
    } else if (s.positiveRate <= RISK_WATCH_THRESHOLD) {
      risks.push({
        id: `risk-A-${slugify(s.key)}`, family: 'A',
        title: `${region}: ${fmtRollout(rolloutMode)} risk pattern`,
        description: `${region} wines with ${fmtRollout(rolloutMode)} and ${fmtAlloc(allocationSizing)} have underperformed — ${s.positiveRate}% positive, ${s.negativeRate}% negative/mixed across ${s.count} decisions.`,
        ...attrs,
        evidenceCount: s.count, positiveRate: s.positiveRate, negativeRate: s.negativeRate, avgDelta: s.avgDelta,
        confidence: classifyRiskConf(s.count, s.positiveRate),
        riskStatus: classifyRiskStatus(s.count, s.positiveRate),
        cautionSignals: [`Only ${s.positiveRate}% positive (n=${s.count})`, `${s.negativeRate}% negative or mixed`, statsSummary(s)],
        governanceNote: riskGovNote(s.count, s.positiveRate),
      })
    }
  }
  return { candidates, risks }
}

// ── Family B: Style × ReleaseTiming × RolloutMode ─────────────────────────────

function familyB(rows: LearningRow[]): { candidates: PlaybookCandidate[], risks: RiskPlaybook[] } {
  const stats = analyzeGroups(rows, r =>
    r.wineStyle && r.selectedReleaseTiming && r.selectedRolloutMode
      ? `${r.wineStyle}|${r.selectedReleaseTiming}|${r.selectedRolloutMode}`
      : null,
  )
  const candidates: PlaybookCandidate[] = []
  const risks: RiskPlaybook[] = []

  for (const s of stats) {
    if (s.count < MIN_LEARNING_SAMPLES) continue
    const [style, releaseTiming, rolloutMode] = s.key.split('|')
    const attrs = { style, releaseTiming, rolloutMode }

    if (s.positiveRate >= MODERATE_CANDIDATE_THRESHOLD) {
      candidates.push({
        id: `B-${slugify(s.key)}`, family: 'B',
        title: `${style}: ${fmtTiming(releaseTiming)} + ${fmtRollout(rolloutMode)}`,
        description: `${style} wines with ${fmtTiming(releaseTiming)} and ${fmtRollout(rolloutMode)} produced ${s.positiveRate}% positive outcomes (n=${s.count}).`,
        ...attrs,
        evidenceCount: s.count, positiveRate: s.positiveRate, avgDelta: s.avgDelta,
        confidence: classifyConf(s.count, s.positiveRate),
        playbookStatus: classifyStatus(s.count, s.positiveRate),
        supportingSignals: [statsSummary(s)],
        governanceNote: govNote(s.count, s.positiveRate),
      })
    } else if (s.positiveRate <= RISK_WATCH_THRESHOLD) {
      risks.push({
        id: `risk-B-${slugify(s.key)}`, family: 'B',
        title: `${style}: ${fmtTiming(releaseTiming)} risk pattern`,
        description: `${style} wines with ${fmtTiming(releaseTiming)} and ${fmtRollout(rolloutMode)} have underperformed (${s.positiveRate}% positive, n=${s.count}).`,
        ...attrs,
        evidenceCount: s.count, positiveRate: s.positiveRate, negativeRate: s.negativeRate, avgDelta: s.avgDelta,
        confidence: classifyRiskConf(s.count, s.positiveRate),
        riskStatus: classifyRiskStatus(s.count, s.positiveRate),
        cautionSignals: [`Only ${s.positiveRate}% positive (n=${s.count})`, `${s.negativeRate}% negative or mixed`],
        governanceNote: riskGovNote(s.count, s.positiveRate),
      })
    }
  }
  return { candidates, risks }
}

// ── Family C: PriceTier × ReleaseTiming × AllocationSizing ────────────────────

function familyC(rows: LearningRow[]): { candidates: PlaybookCandidate[], risks: RiskPlaybook[] } {
  const stats = analyzeGroups(rows, r =>
    r.priceTier && r.selectedReleaseTiming && r.selectedAllocationSizing
      ? `${r.priceTier}|${r.selectedReleaseTiming}|${r.selectedAllocationSizing}`
      : null,
  )
  const candidates: PlaybookCandidate[] = []
  const risks: RiskPlaybook[] = []

  for (const s of stats) {
    if (s.count < MIN_LEARNING_SAMPLES) continue
    const [priceTier, releaseTiming, allocationSizing] = s.key.split('|')
    const attrs = { priceTier, releaseTiming, allocationSizing }

    if (s.positiveRate >= MODERATE_CANDIDATE_THRESHOLD) {
      candidates.push({
        id: `C-${slugify(s.key)}`, family: 'C',
        title: `${priceTier}-tier: ${fmtTiming(releaseTiming)} with ${fmtAlloc(allocationSizing)}`,
        description: `${priceTier}-tier wines with ${fmtTiming(releaseTiming)} and ${fmtAlloc(allocationSizing)} produced ${s.positiveRate}% positive outcomes (n=${s.count}).`,
        ...attrs,
        evidenceCount: s.count, positiveRate: s.positiveRate, avgDelta: s.avgDelta,
        confidence: classifyConf(s.count, s.positiveRate),
        playbookStatus: classifyStatus(s.count, s.positiveRate),
        supportingSignals: [statsSummary(s)],
        governanceNote: govNote(s.count, s.positiveRate),
      })
    } else if (s.positiveRate <= RISK_WATCH_THRESHOLD) {
      risks.push({
        id: `risk-C-${slugify(s.key)}`, family: 'C',
        title: `${priceTier}-tier: ${fmtTiming(releaseTiming)} risk pattern`,
        description: `${priceTier}-tier wines with ${fmtTiming(releaseTiming)} and ${fmtAlloc(allocationSizing)} have underperformed (${s.positiveRate}% positive, n=${s.count}).`,
        ...attrs,
        evidenceCount: s.count, positiveRate: s.positiveRate, negativeRate: s.negativeRate, avgDelta: s.avgDelta,
        confidence: classifyRiskConf(s.count, s.positiveRate),
        riskStatus: classifyRiskStatus(s.count, s.positiveRate),
        cautionSignals: [`Only ${s.positiveRate}% positive (n=${s.count})`, `${s.negativeRate}% negative or mixed`],
        governanceNote: riskGovNote(s.count, s.positiveRate),
      })
    }
  }
  return { candidates, risks }
}

// ── Family D: RecommendationActionType × Adherence ────────────────────────────

function familyD(rows: LearningRow[]): { candidates: PlaybookCandidate[], risks: RiskPlaybook[] } {
  const stats = analyzeGroups(rows, r =>
    r.recommendationActionType && r.planAdherence
      ? `${r.recommendationActionType}|${r.planAdherence}`
      : null,
  )
  const candidates: PlaybookCandidate[] = []
  const risks: RiskPlaybook[] = []

  for (const s of stats) {
    if (s.count < MIN_LEARNING_SAMPLES) continue
    const [actionType, adherencePattern] = s.key.split('|')
    const attrs = { actionType, adherencePattern }

    if (s.positiveRate >= MODERATE_CANDIDATE_THRESHOLD) {
      candidates.push({
        id: `D-${slugify(s.key)}`, family: 'D',
        title: `${fmtAction(actionType)} → ${fmtAdherence(adherencePattern)}`,
        description: `When a ${fmtAction(actionType)} recommendation was met with ${fmtAdherence(adherencePattern)}, ${s.positiveRate}% of outcomes were positive (n=${s.count}).`,
        ...attrs,
        evidenceCount: s.count, positiveRate: s.positiveRate, avgDelta: s.avgDelta,
        confidence: classifyConf(s.count, s.positiveRate),
        playbookStatus: classifyStatus(s.count, s.positiveRate),
        supportingSignals: [statsSummary(s), `Adherence behaviour: ${fmtAdherence(adherencePattern)}`],
        governanceNote: govNote(s.count, s.positiveRate),
      })
    } else if (s.positiveRate <= RISK_WATCH_THRESHOLD) {
      risks.push({
        id: `risk-D-${slugify(s.key)}`, family: 'D',
        title: `${fmtAction(actionType)} with ${fmtAdherence(adherencePattern)} — weak outcomes`,
        description: `${fmtAction(actionType)} recommendations met with ${fmtAdherence(adherencePattern)} produced only ${s.positiveRate}% positive outcomes (n=${s.count}).`,
        ...attrs,
        evidenceCount: s.count, positiveRate: s.positiveRate, negativeRate: s.negativeRate, avgDelta: s.avgDelta,
        confidence: classifyRiskConf(s.count, s.positiveRate),
        riskStatus: classifyRiskStatus(s.count, s.positiveRate),
        cautionSignals: [`Only ${s.positiveRate}% positive (n=${s.count})`, `Adherence: ${fmtAdherence(adherencePattern)}`],
        governanceNote: riskGovNote(s.count, s.positiveRate),
      })
    }
  }
  return { candidates, risks }
}

// ── Family E: RecommendationActionType × ExecutionStatus ──────────────────────
// Captures whether execution quality per action type matters.

function familyE(rows: LearningRow[]): { candidates: PlaybookCandidate[], risks: RiskPlaybook[] } {
  const stats = analyzeGroups(rows, r =>
    r.recommendationActionType && r.executionStatus
      ? `${r.recommendationActionType}|${r.executionStatus}`
      : null,
  )
  const candidates: PlaybookCandidate[] = []
  const risks: RiskPlaybook[] = []

  for (const s of stats) {
    if (s.count < MIN_LEARNING_SAMPLES) continue
    const [actionType, executionStatus] = s.key.split('|')
    const attrs = { actionType }

    if (s.positiveRate >= MODERATE_CANDIDATE_THRESHOLD) {
      candidates.push({
        id: `E-${slugify(s.key)}`, family: 'E',
        title: `${fmtAction(actionType)} — ${fmtExecStatus(executionStatus)}`,
        description: `${fmtAction(actionType)} recommendations that were ${fmtExecStatus(executionStatus)} produced ${s.positiveRate}% positive outcomes (n=${s.count}).`,
        ...attrs,
        evidenceCount: s.count, positiveRate: s.positiveRate, avgDelta: s.avgDelta,
        confidence: classifyConf(s.count, s.positiveRate),
        playbookStatus: classifyStatus(s.count, s.positiveRate),
        supportingSignals: [statsSummary(s), `Execution status: ${fmtExecStatus(executionStatus)}`],
        governanceNote: govNote(s.count, s.positiveRate),
      })
    } else if (s.positiveRate <= RISK_WATCH_THRESHOLD) {
      risks.push({
        id: `risk-E-${slugify(s.key)}`, family: 'E',
        title: `${fmtAction(actionType)} — ${fmtExecStatus(executionStatus)} risk pattern`,
        description: `${fmtAction(actionType)} recommendations that were ${fmtExecStatus(executionStatus)} produced only ${s.positiveRate}% positive outcomes (n=${s.count}).`,
        ...attrs,
        evidenceCount: s.count, positiveRate: s.positiveRate, negativeRate: s.negativeRate, avgDelta: s.avgDelta,
        confidence: classifyRiskConf(s.count, s.positiveRate),
        riskStatus: classifyRiskStatus(s.count, s.positiveRate),
        cautionSignals: [`Only ${s.positiveRate}% positive (n=${s.count})`, `Execution: ${fmtExecStatus(executionStatus)}`],
        governanceNote: riskGovNote(s.count, s.positiveRate),
      })
    }
  }
  return { candidates, risks }
}

// ── Family F: ExecutionStatus × Outcome ──────────────────────────────────────
// Captures whether execution completeness/deviation affects outcomes portfolio-wide.

function familyF(rows: LearningRow[]): { candidates: PlaybookCandidate[], risks: RiskPlaybook[] } {
  const stats = analyzeGroups(rows, r =>
    r.executionStatus && r.executionStatus !== 'PENDING' ? r.executionStatus : null,
  )
  const candidates: PlaybookCandidate[] = []
  const risks: RiskPlaybook[] = []

  for (const s of stats) {
    if (s.count < MIN_LEARNING_SAMPLES) continue

    if (s.positiveRate >= MODERATE_CANDIDATE_THRESHOLD) {
      candidates.push({
        id: `F-${slugify(s.key)}`, family: 'F',
        title: `${fmtExecStatus(s.key)} — positive execution pattern`,
        description: `Decisions executed as ${fmtExecStatus(s.key)} produced ${s.positiveRate}% positive outcomes across the portfolio (n=${s.count}).`,
        evidenceCount: s.count, positiveRate: s.positiveRate, avgDelta: s.avgDelta,
        confidence: classifyConf(s.count, s.positiveRate),
        playbookStatus: classifyStatus(s.count, s.positiveRate),
        supportingSignals: [statsSummary(s)],
        governanceNote: govNote(s.count, s.positiveRate),
      })
    } else if (s.positiveRate <= RISK_WATCH_THRESHOLD) {
      risks.push({
        id: `risk-F-${slugify(s.key)}`, family: 'F',
        title: `${fmtExecStatus(s.key)} — weak outcome pattern`,
        description: `Decisions with ${fmtExecStatus(s.key)} execution produced only ${s.positiveRate}% positive outcomes (n=${s.count}).`,
        evidenceCount: s.count, positiveRate: s.positiveRate, negativeRate: s.negativeRate, avgDelta: s.avgDelta,
        confidence: classifyRiskConf(s.count, s.positiveRate),
        riskStatus: classifyRiskStatus(s.count, s.positiveRate),
        cautionSignals: [`Only ${s.positiveRate}% positive (n=${s.count})`, `${s.negativeRate}% negative or mixed`],
        governanceNote: riskGovNote(s.count, s.positiveRate),
      })
    }
  }
  return { candidates, risks }
}

// ── Learning summary builder ──────────────────────────────────────────────────

function buildLearningSummary(
  candidates: PlaybookCandidate[],
  risks:      RiskPlaybook[],
): ExecutionLearningSummary {
  const topCandidate = candidates
    .filter(c => c.playbookStatus === 'candidate')
    .sort((a, b) => b.positiveRate - a.positiveRate)[0] ?? null

  const topRisk = risks
    .filter(r => r.riskStatus === 'warning')
    .sort((a, b) => a.positiveRate - b.positiveRate)[0] ?? null

  // Region memory: best Family A candidate
  const topRegion = candidates
    .filter(c => c.family === 'A' && c.region)
    .sort((a, b) => b.positiveRate - a.positiveRate)[0]
  const strongestRegionMemory = topRegion
    ? `${topRegion.region}: "${topRegion.title}" — ${topRegion.positiveRate}% positive across ${topRegion.evidenceCount} decisions.`
    : null

  // Style memory: best Family B candidate
  const topStyle = candidates
    .filter(c => c.family === 'B' && c.style)
    .sort((a, b) => b.positiveRate - a.positiveRate)[0]
  const strongestStyleMemory = topStyle
    ? `${topStyle.style}: "${topStyle.title}" produced ${topStyle.positiveRate}% positive outcomes.`
    : null

  // Adherence pattern: best Family D candidate
  const topAdherence = candidates
    .filter(c => c.family === 'D')
    .sort((a, b) => b.positiveRate - a.positiveRate)[0]
  const bestAdherencePattern = topAdherence
    ? `${topAdherence.title} — ${topAdherence.positiveRate}% positive (n=${topAdherence.evidenceCount}).`
    : null

  // Execution patterns: Family F
  const topExecPos = candidates.filter(c => c.family === 'F').sort((a, b) => b.positiveRate - a.positiveRate)[0]
  const topExecNeg = risks.filter(r => r.family === 'F').sort((a, b) => a.positiveRate - b.positiveRate)[0]
  const executionPatternForPositive = topExecPos
    ? `${topExecPos.title}: ${topExecPos.positiveRate}% positive rate (n=${topExecPos.evidenceCount}).`
    : null
  const executionPatternForNegative = topExecNeg
    ? `${topExecNeg.title}: only ${topExecNeg.positiveRate}% positive (n=${topExecNeg.evidenceCount}).`
    : null

  // Portfolio observations: generated from real evidence
  const observations: string[] = []

  if (topCandidate) {
    observations.push(
      `"${topCandidate.title}" is the strongest repeat-winning pattern with ${topCandidate.positiveRate}% positive outcomes across ${topCandidate.evidenceCount} decisions.`,
    )
  }
  if (topRisk) {
    observations.push(
      `"${topRisk.title}" has repeatedly underperformed — only ${topRisk.positiveRate}% positive and ${topRisk.negativeRate}% negative or mixed outcomes (n=${topRisk.evidenceCount}).`,
    )
  }
  if (observations.length < 3 && topAdherence) {
    observations.push(
      `Adherence pattern "${topAdherence.title}" is associated with ${topAdherence.positiveRate}% positive outcomes, suggesting following this recommendation type is valuable.`,
    )
  }
  if (observations.length === 0) {
    observations.push(
      'Insufficient lifecycle data to generate portfolio-level observations. Playbook memory builds as planning decisions complete the full cycle: decided → executed → measured.',
    )
  }

  return {
    strongestWinningCandidate:   topCandidate,
    strongestRiskPlaybook:       topRisk,
    strongestRegionMemory,
    strongestStyleMemory,
    bestAdherencePattern,
    executionPatternForPositive,
    executionPatternForNegative,
    portfolioObservations: observations.slice(0, 3),
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeStrategyExecutionLearning(
  rows:        LearningRow[],
  generatedAt: string = new Date().toISOString(),
): StrategyExecutionLearningOutput {

  // Eligible = a planning decision was actually made (selected values exist)
  const eligible = rows.filter(r => r.selectedAllocationSizing != null && r.decisionStatus !== 'DEFERRED')

  // Full lifecycle = execution attempted + outcome measured + adherence derived
  const covered = eligible.filter(r =>
    r.executionStatus !== 'PENDING' &&
    r.effectivenessDelta != null    &&
    r.planAdherence != null,
  )

  if (covered.length === 0) {
    return {
      playbookCandidates: [],
      riskPlaybooks: [],
      executionLearningSummary: {
        strongestWinningCandidate: null,
        strongestRiskPlaybook: null,
        strongestRegionMemory: null,
        strongestStyleMemory: null,
        bestAdherencePattern: null,
        executionPatternForPositive: null,
        executionPatternForNegative: null,
        portfolioObservations: [
          'No fully-measured decisions available yet. Playbook memory will build as planning decisions are made, executed, and measured.',
        ],
      },
      learningCoverage: {
        totalEligibleDecisions: eligible.length,
        totalWithFullLifecycle: 0,
        playbookCandidateCount: 0,
        riskPlaybookCount: 0,
        dimensionsAnalyzed: 6,
        dimensionsWithEvidence: 0,
        dimensionsUnderpowered: 0,
        coveragePercentage: 0,
      },
      generatedAt,
      dataNote: 'No fully-executed and measured decisions found. Strategic memory requires decisions to complete the full lifecycle.',
    }
  }

  // Run six combination family analyses
  const resA = familyA(covered)
  const resB = familyB(covered)
  const resC = familyC(covered)
  const resD = familyD(covered)
  const resE = familyE(covered)
  const resF = familyF(covered)

  const allCandidates = [
    ...resA.candidates, ...resB.candidates, ...resC.candidates,
    ...resD.candidates, ...resE.candidates, ...resF.candidates,
  ].sort((a, b) => b.positiveRate - a.positiveRate)

  const allRisks = [
    ...resA.risks, ...resB.risks, ...resC.risks,
    ...resD.risks, ...resE.risks, ...resF.risks,
  ].sort((a, b) => a.positiveRate - b.positiveRate)

  // Coverage: count families that yielded any evidence rows
  const familiesWithEvidence = new Set(
    [...allCandidates.map(c => c.family), ...allRisks.map(r => r.family)],
  ).size

  const summary = buildLearningSummary(allCandidates, allRisks)

  return {
    playbookCandidates: allCandidates,
    riskPlaybooks: allRisks,
    executionLearningSummary: summary,
    learningCoverage: {
      totalEligibleDecisions:  eligible.length,
      totalWithFullLifecycle:  covered.length,
      playbookCandidateCount:  allCandidates.length,
      riskPlaybookCount:       allRisks.length,
      dimensionsAnalyzed:      6,
      dimensionsWithEvidence:  familiesWithEvidence,
      dimensionsUnderpowered:  Math.max(0, 6 - familiesWithEvidence),
      coveragePercentage:      pct(covered.length, eligible.length),
    },
    generatedAt,
  }
}
