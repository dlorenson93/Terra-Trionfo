/**
 * lib/strategyPatternEngine.ts
 *
 * Phase 18 — Portfolio Strategy Memory & Pattern Library
 *
 * Pure engine. No DB access.
 *
 * Looks across the full history of decisions + outcomes to identify
 * recurring strategy patterns — specific combinations of dimension values
 * (region, style, price tier, timing, rollout, allocation) that repeatedly
 * produce positive or negative outcomes.
 *
 * PATTERN VOCABULARY (cross-dimensional combos):
 *   Region  × RolloutMode        — "trade-first in Piemonte works / doesn't work"
 *   Style   × ReleaseTiming      — "Nebbiolo with accelerate timing performs well"
 *   Style   × RolloutMode        — "Alpine Whites with consumer-led works"
 *   PriceTier × AllocationSizing — "premium wines with significant increase underperforms"
 *   PriceTier × ReleaseTiming    — "entry-tier with hold timing stalls"
 *   Region  × AllocationSizing   — "Piemonte modest increase works"
 *   ActionType portfolio-wide    — picked up from effectiveness rollups
 *
 * MINIMUM EVIDENCE GUARD:
 *   MIN_PATTERN_SAMPLES = 3 — below this, combinations are not reported
 *
 * OUTPUTS:
 *   winningPatterns — positiveRate >= WIN_THRESHOLD (65%)
 *   riskPatterns    — positiveRate <= RISK_THRESHOLD (25%)
 *   portfolioInsight — 1-sentence synthesis
 *
 * Advisory only. Never auto-applies patterns.
 */

import type { DecisionRow }              from './decisionQualityRollups'
import type { EffectivenessRollupOutput } from './effectivenessRollups'

const MIN_PATTERN_SAMPLES = 3
const WIN_THRESHOLD  = 65
const RISK_THRESHOLD = 25

// ── Output types ──────────────────────────────────────────────────────────────

export type PatternCategory = 'winning' | 'risk'

export type PatternConfidence = 'strong' | 'moderate' | 'limited'

export interface StrategyPattern {
  id:           string          // stable slug for dedup / UI key
  category:     PatternCategory
  pattern:      string          // human-readable sentence
  evidence:     string          // "n=6, 83% positive"
  sampleSize:   number
  positiveRate: number
  confidence:   PatternConfidence
  // Dimension tags — used for matching against scenario context
  region?:      string
  style?:       string
  priceTier?:   string
  rolloutMode?: string
  timing?:      string
  actionType?:  string
}

export interface PatternLibraryOutput {
  winningPatterns:    StrategyPattern[]
  riskPatterns:       StrategyPattern[]
  portfolioInsight:   string
  totalPatternsFound: number
  generatedAt:        string
  dataNote?:          string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  if (d === 0) return 0
  return Math.round((n / d) * 100)
}

function confidence(sampleSize: number): PatternConfidence {
  if (sampleSize >= 8) return 'strong'
  if (sampleSize >= 5) return 'moderate'
  return 'limited'
}

function evid(sampleSize: number, positiveRate: number): string {
  return `n=${sampleSize}, ${positiveRate}% positive`
}

function slug(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join('_').toLowerCase().replace(/\W+/g, '_')
}

// Human-readable label helpers
const ROLLOUT_HUMAN: Record<string, string> = {
  consumer_led:     'consumer-first rollout',
  trade_led:        'trade-first rollout',
  balanced:         'balanced rollout',
  soft_launch:      'soft launch',
  allocation_first: 'allocation-first approach',
}
const TIMING_HUMAN: Record<string, string> = {
  accelerate:             'accelerated release',
  hold_until_signal:      'holding until signal strengthens',
  stage_two_waves:        'staged two-wave release',
  release_trade_first:    'trade-first release',
  release_consumer_first: 'consumer-first release',
  no_action:              'no timing action',
}
const SIZING_HUMAN: Record<string, string> = {
  hold_flat:            'holding allocation flat',
  modest_increase:      'modest allocation increase',
  significant_increase: 'significant allocation increase',
  reduce_exposure:      'reducing exposure',
  maintain:             'maintaining current allocation',
}
const ACTION_HUMAN: Record<string, string> = {
  ACCELERATE_RELEASE:      'Accelerating release',
  HOLD_RELEASE:            'Holding release',
  INCREASE_ALLOCATION:     'Increasing allocation',
  REDUCE_EXPOSURE:         'Reducing exposure',
  INCREASE_MERCHANDISING:  'Increasing merchandising',
  MAINTAIN:                'Maintaining',
}

// ── Cross-dimensional grouping ────────────────────────────────────────────────

interface GroupResult {
  key:          string
  count:        number
  measured:     number
  positiveCount: number
  dimensions:   Omit<StrategyPattern, 'id' | 'category' | 'pattern' | 'evidence' | 'sampleSize' | 'positiveRate' | 'confidence'>
}

function groupRows(
  rows:    DecisionRow[],
  keyFn:   (r: DecisionRow) => string | null,
  dimFn:   (r: DecisionRow) => Omit<StrategyPattern, 'id' | 'category' | 'pattern' | 'evidence' | 'sampleSize' | 'positiveRate' | 'confidence'> | null,
): GroupResult[] {
  const map = new Map<string, { count: number; measured: number; positiveCount: number; dims: any }>()

  for (const r of rows) {
    const key = keyFn(r)
    if (!key) continue
    const existing = map.get(key)
    if (existing) {
      existing.count++
      if (r.effectivenessDelta) {
        existing.measured++
        if (r.effectivenessDelta === 'POSITIVE_SHIFT') existing.positiveCount++
      }
    } else {
      const dims = dimFn(r)
      if (!dims) continue
      map.set(key, {
        count: 1,
        measured: r.effectivenessDelta ? 1 : 0,
        positiveCount: r.effectivenessDelta === 'POSITIVE_SHIFT' ? 1 : 0,
        dims,
      })
    }
  }

  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      count:         v.count,
      measured:      v.measured,
      positiveCount: v.positiveCount,
      dimensions:    v.dims,
    }))
    .filter(g => g.measured >= MIN_PATTERN_SAMPLES)
}

// ── Pattern builders ──────────────────────────────────────────────────────────

function toPattern(
  g:        GroupResult,
  makeText: (dims: any, positiveRate: number) => string,
  category: PatternCategory,
): StrategyPattern {
  const positiveRate = pct(g.positiveCount, g.measured)
  return {
    id:          slug(g.key),
    category,
    pattern:     makeText(g.dimensions, positiveRate),
    evidence:    evid(g.measured, positiveRate),
    sampleSize:  g.measured,
    positiveRate,
    confidence:  confidence(g.measured),
    ...g.dimensions,
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

export function computeStrategyPatterns(
  rows:        DecisionRow[],
  er:          EffectivenessRollupOutput | null,
  generatedAt: string = new Date().toISOString(),
): PatternLibraryOutput {
  if (rows.length === 0 && !er) {
    return {
      winningPatterns:    [],
      riskPatterns:       [],
      portfolioInsight:   'No historical decision data available yet. Patterns will emerge as executions are recorded and measured.',
      totalPatternsFound: 0,
      generatedAt,
      dataNote: 'Insufficient data',
    }
  }

  const all: StrategyPattern[] = []

  // ── 1. Region × RolloutMode ──────────────────────────────────────────────────
  {
    // Use executed rollout mode if available, fall back to selected, then recommended
    const groups = groupRows(
      rows,
      r => (r.region && r.executedRolloutMode)
        ? `${r.region}__${r.executedRolloutMode}`
        : (r.region && r.selectedRolloutMode)
          ? `${r.region}__${r.selectedRolloutMode}`
          : null,
      r => {
        const rollout = r.executedRolloutMode ?? r.selectedRolloutMode
        if (!r.region || !rollout) return null
        return { region: r.region, rolloutMode: rollout }
      },
    )
    for (const g of groups) {
      const rate = pct(g.positiveCount, g.measured)
      const category: PatternCategory | null = rate >= WIN_THRESHOLD ? 'winning' : rate <= RISK_THRESHOLD ? 'risk' : null
      if (!category) continue
      all.push(toPattern(
        g,
        (d, r) => category === 'winning'
          ? `${d.region} wines with ${ROLLOUT_HUMAN[d.rolloutMode] ?? d.rolloutMode} have performed strongly (${r}% positive)`
          : `${d.region} wines with ${ROLLOUT_HUMAN[d.rolloutMode] ?? d.rolloutMode} have underperformed — consider a different rollout approach`,
        category,
      ))
    }
  }

  // ── 2. Style × ReleaseTiming ─────────────────────────────────────────────────
  {
    const groups = groupRows(
      rows,
      r => {
        const timing = r.executedReleaseTiming ?? r.selectedReleaseTiming
        return (r.wineStyle && timing) ? `${r.wineStyle}__${timing}` : null
      },
      r => {
        const timing = r.executedReleaseTiming ?? r.selectedReleaseTiming
        if (!r.wineStyle || !timing) return null
        return { style: r.wineStyle, timing }
      },
    )
    for (const g of groups) {
      const rate = pct(g.positiveCount, g.measured)
      const category: PatternCategory | null = rate >= WIN_THRESHOLD ? 'winning' : rate <= RISK_THRESHOLD ? 'risk' : null
      if (!category) continue
      all.push(toPattern(
        g,
        (d, r) => category === 'winning'
          ? `${d.style} wines tend to perform well with ${TIMING_HUMAN[d.timing] ?? d.timing} (${r}% positive)`
          : `${d.style} wines have struggled when ${TIMING_HUMAN[d.timing] ?? d.timing} — reconsider timing for this style`,
        category,
      ))
    }
  }

  // ── 3. Style × RolloutMode ───────────────────────────────────────────────────
  {
    const groups = groupRows(
      rows,
      r => {
        const rollout = r.executedRolloutMode ?? r.selectedRolloutMode
        return (r.wineStyle && rollout) ? `${r.wineStyle}__${rollout}` : null
      },
      r => {
        const rollout = r.executedRolloutMode ?? r.selectedRolloutMode
        if (!r.wineStyle || !rollout) return null
        return { style: r.wineStyle, rolloutMode: rollout }
      },
    )
    for (const g of groups) {
      const rate = pct(g.positiveCount, g.measured)
      const category: PatternCategory | null = rate >= WIN_THRESHOLD ? 'winning' : rate <= RISK_THRESHOLD ? 'risk' : null
      if (!category) continue
      all.push(toPattern(
        g,
        (d, r) => category === 'winning'
          ? `${d.style} releases with ${ROLLOUT_HUMAN[d.rolloutMode] ?? d.rolloutMode} consistently outperform (${r}% positive)`
          : `${d.style} wines with ${ROLLOUT_HUMAN[d.rolloutMode] ?? d.rolloutMode} have a poor track record — try a different channel emphasis`,
        category,
      ))
    }
  }

  // ── 4. PriceTier × AllocationSizing ─────────────────────────────────────────
  {
    const groups = groupRows(
      rows,
      r => {
        const sizing = r.executedAllocationSizing ?? r.selectedAllocationSizing
        return (r.priceTier && sizing) ? `${r.priceTier}__${sizing}` : null
      },
      r => {
        const sizing = r.executedAllocationSizing ?? r.selectedAllocationSizing
        if (!r.priceTier || !sizing) return null
        return { priceTier: r.priceTier, actionType: sizing }
      },
    )
    for (const g of groups) {
      const rate = pct(g.positiveCount, g.measured)
      const category: PatternCategory | null = rate >= WIN_THRESHOLD ? 'winning' : rate <= RISK_THRESHOLD ? 'risk' : null
      if (!category) continue
      const tierLabel = g.dimensions.priceTier
      const sizingKey = (g.dimensions as any).actionType
      all.push(toPattern(
        g,
        (d, r) => category === 'winning'
          ? `${tierLabel}-tier wines with ${SIZING_HUMAN[sizingKey] ?? sizingKey} have a strong track record (${r}% positive)`
          : `${tierLabel}-tier wines with ${SIZING_HUMAN[sizingKey] ?? sizingKey} have frequently underperformed — be cautious`,
        category,
      ))
    }
  }

  // ── 5. Region × AllocationSizing ────────────────────────────────────────────
  {
    const groups = groupRows(
      rows,
      r => {
        const sizing = r.executedAllocationSizing ?? r.selectedAllocationSizing
        return (r.region && sizing) ? `${r.region}__sizing__${sizing}` : null
      },
      r => {
        const sizing = r.executedAllocationSizing ?? r.selectedAllocationSizing
        if (!r.region || !sizing) return null
        return { region: r.region, actionType: sizing }
      },
    )
    for (const g of groups) {
      const rate = pct(g.positiveCount, g.measured)
      const category: PatternCategory | null = rate >= WIN_THRESHOLD ? 'winning' : rate <= RISK_THRESHOLD ? 'risk' : null
      if (!category) continue
      const sizingKey = (g.dimensions as any).actionType
      all.push(toPattern(
        g,
        (d, r) => category === 'winning'
          ? `${d.region} — ${SIZING_HUMAN[sizingKey] ?? sizingKey} has been a reliable move (${r}% positive)`
          : `${d.region} — ${SIZING_HUMAN[sizingKey] ?? sizingKey} has repeatedly underperformed in this region`,
        category,
      ))
    }
  }

  // ── 6. Effectiveness rollup — action type portfolio-wide ─────────────────────
  if (er) {
    for (const a of er.actionTypePerformance) {
      if (a.totalCount < MIN_PATTERN_SAMPLES) continue
      const rate = a.positiveRate
      const category: PatternCategory | null = rate >= WIN_THRESHOLD ? 'winning' : rate <= RISK_THRESHOLD ? 'risk' : null
      if (!category) continue
      all.push({
        id:          slug('action', a.key),
        category,
        pattern:     category === 'winning'
          ? `${ACTION_HUMAN[a.key] ?? a.key} actions have a strong track record across this portfolio (${Math.round(rate)}% positive)`
          : `${ACTION_HUMAN[a.key] ?? a.key} actions have frequently underperformed portfolio-wide — apply extra scrutiny`,
        evidence:    evid(a.totalCount, Math.round(rate)),
        sampleSize:  a.totalCount,
        positiveRate: Math.round(rate),
        confidence:  confidence(a.totalCount),
        actionType:  a.key,
      })
    }

    // Region-level effectiveness
    for (const r of er.regionPerformance) {
      if (r.totalCount < MIN_PATTERN_SAMPLES) continue
      const rate = r.positiveRate
      const category: PatternCategory | null = rate >= WIN_THRESHOLD ? 'winning' : rate <= RISK_THRESHOLD ? 'risk' : null
      if (!category) continue
      all.push({
        id:          slug('region_eff', r.key),
        category,
        pattern:     category === 'winning'
          ? `Wines from ${r.key} have the strongest portfolio track record (${Math.round(rate)}% positive effectiveness)`
          : `Wines from ${r.key} have underperformed on effectiveness measures — evaluate positioning`,
        evidence:    evid(r.totalCount, Math.round(rate)),
        sampleSize:  r.totalCount,
        positiveRate: Math.round(rate),
        confidence:  confidence(r.totalCount),
        region:      r.key,
      })
    }

    // Style-level effectiveness
    for (const s of er.stylePerformance) {
      if (s.totalCount < MIN_PATTERN_SAMPLES) continue
      const rate = s.positiveRate
      const category: PatternCategory | null = rate >= WIN_THRESHOLD ? 'winning' : rate <= RISK_THRESHOLD ? 'risk' : null
      if (!category) continue
      all.push({
        id:          slug('style_eff', s.key),
        category,
        pattern:     category === 'winning'
          ? `${s.key} wines have consistently strong effectiveness outcomes in this portfolio (${Math.round(rate)}% positive)`
          : `${s.key} wines have a concerning effectiveness track record — reconsider strategy for this style`,
        evidence:    evid(s.totalCount, Math.round(rate)),
        sampleSize:  s.totalCount,
        positiveRate: Math.round(rate),
        confidence:  confidence(s.totalCount),
        style:       s.key,
      })
    }
  }

  // ── Dedup by id ───────────────────────────────────────────────────────────────
  const seen = new Set<string>()
  const unique = all.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  const winning = unique
    .filter(p => p.category === 'winning')
    .sort((a, b) => b.positiveRate - a.positiveRate || b.sampleSize - a.sampleSize)

  const risk = unique
    .filter(p => p.category === 'risk')
    .sort((a, b) => a.positiveRate - b.positiveRate || b.sampleSize - a.sampleSize)

  // ── Portfolio insight ─────────────────────────────────────────────────────────
  let portfolioInsight: string
  if (unique.length === 0) {
    portfolioInsight = 'Insufficient data to derive recurring patterns. Record more executions and measurements to build the pattern library.'
  } else if (winning.length > risk.length * 2) {
    portfolioInsight = `The portfolio has ${winning.length} established winning patterns — exploit these strategic moves with confidence.`
  } else if (risk.length > winning.length) {
    portfolioInsight = `${risk.length} risk patterns detected — more strategic moves are underperforming than working well. Review current strategy emphasis.`
  } else {
    portfolioInsight = `${winning.length} winning and ${risk.length} risk patterns identified — use winning patterns to guide decisions and avoid confirmed risk moves.`
  }

  return {
    winningPatterns:    winning,
    riskPatterns:       risk,
    portfolioInsight,
    totalPatternsFound: unique.length,
    generatedAt,
  }
}

// ── Pattern matching helper (for UI scenario card augmentation) ───────────────

/**
 * Given a product's region/style/priceTier and a scenario's rolloutMode/timing,
 * returns any patterns from the library that are relevant to this combination.
 * Used by the admin UI to annotate scenario cards with relevant patterns.
 */
export function findRelevantPatterns(
  patterns:   StrategyPattern[],
  opts: {
    region?:      string | null
    style?:       string | null
    priceTier?:   string | null
    rolloutMode?: string
    timing?:      string
    actionType?:  string
  },
): StrategyPattern[] {
  return patterns.filter(p => {
    // Must match at least one specific dimension
    const regionMatch     = opts.region     && p.region     && p.region     === opts.region
    const styleMatch      = opts.style      && p.style      && p.style      === opts.style
    const tierMatch       = opts.priceTier  && p.priceTier  && p.priceTier  === opts.priceTier
    const rolloutMatch    = opts.rolloutMode && p.rolloutMode && p.rolloutMode === opts.rolloutMode
    const timingMatch     = opts.timing      && p.timing     && p.timing      === opts.timing
    const actionMatch     = opts.actionType  && p.actionType && p.actionType  === opts.actionType
    return !!(regionMatch || styleMatch || tierMatch || rolloutMatch || timingMatch || actionMatch)
  }).slice(0, 2) // max 2 per scenario card to keep UI lean
}
