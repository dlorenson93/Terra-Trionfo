/**
 * lib/planningAttributionRollups.ts
 *
 * Phase 21 — Planning Outcome Attribution & Model Trust Analytics
 *
 * Pure engine. No DB access.
 *
 * Given decisions that carry a composition snapshot AND a measured outcome,
 * answers retrospectively:
 *
 *   1. Tier accuracy       — when composite scored "high", were outcomes positive?
 *   2. Contributor accuracy — did bias / predictive / pattern each help or hurt?
 *   3. Model trust summary — which layers are proving reliable vs noisy?
 *
 * MINIMUM DATA GUARD:
 *   Attribution is only computed for rows that have BOTH:
 *   - a composition snapshot (compositeFinalScore is not null)
 *   - a measured outcome   (effectivenessDelta is not null)
 *
 * Advisory only. Admin decides how to interpret these signals.
 * ADMIN-ONLY. Never expose to consumers or vendors.
 */

const MIN_ATTRIBUTION_SAMPLES = 3

// ── Input type ────────────────────────────────────────────────────────────────

export interface AttributionRow {
  id:                     string
  productId:              string
  decisionStatus:         string

  // Composition snapshot (Phase 21) — may be null on legacy rows
  compositeBaseConfidence?:  number | null
  compositeBiasAdjustment?:  number | null
  compositePredictiveNudge?: number | null
  compositePatternDelta?:    number | null
  compositeFinalScore?:      number | null
  compositeLabel?:           string | null

  // Outcome — null means not yet measured
  effectivenessDelta?: string | null
  planAdherence?:      string | null
}

// ── Output types ──────────────────────────────────────────────────────────────

export type ContributorName = 'bias' | 'predictive' | 'pattern'

/** How reliable is a contributor in the observed data? */
export type ContributorReliability =
  | 'helpful'       // Positive when active, negative when dragging — as expected
  | 'noisy'         // Applied but no clear directional correlation observed
  | 'harmful'       // Active but outcomes inversely correlated — worth reviewing
  | 'insufficient'  // Fewer than MIN_ATTRIBUTION_SAMPLES rows in any bucket

export interface TierAccuracy {
  tier:          string     // 'high' | 'medium' | 'low' | 'uncertain'
  count:         number     // decisions with this composite tier + measured outcome
  positiveCount: number
  positiveRate:  number     // 0–100
  /** Is this tier performing above/below expectation? */
  calibrationNote: string
}

export interface ContributorAccuracy {
  contributor:           ContributorName
  /** Positive rate when this contributor applied a positive delta */
  rateWhenActive:        number    // 0–100
  sampleWhenActive:      number
  /** Positive rate when this contributor applied zero delta */
  rateWhenNeutral:       number    // 0–100
  sampleWhenNeutral:     number
  /** Positive rate when this contributor applied a negative delta */
  rateWhenNegative:      number    // 0–100
  sampleWhenNegative:    number
  /** Net advantage: rateWhenActive - rateWhenNegative */
  netAdvantage:          number
  reliability:           ContributorReliability
  reliabilityNote:       string
}

export interface AttributionSummary {
  totalWithSnapshot:   number
  totalWithOutcome:    number
  overallPositiveRate: number
  /** % of high-score decisions that resolved positively */
  highTierPositiveRate: number | null
  /** % of low/uncertain decisions that resolved positively */
  lowTierPositiveRate: number | null
  /** Is composite score directionally useful? */
  compositeCalibrationNote: string
}

export interface PlanningAttributionOutput {
  tierAccuracy:       TierAccuracy[]
  contributorAccuracy: ContributorAccuracy[]
  summary:            AttributionSummary
  modelTrustNote:     string
  totalAttributedRows: number
  generatedAt:        string
  dataNote?:          string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPositive(delta: string | null | undefined): boolean {
  return delta === 'POSITIVE_SHIFT'
}

function pct(n: number, d: number): number {
  if (d === 0) return 0
  return Math.round((n / d) * 100)
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeAttributionRollups(
  rows:        AttributionRow[],
  generatedAt: string = new Date().toISOString(),
): PlanningAttributionOutput {

  // Filter to rows with both a composition snapshot and a measured outcome
  const attributed = rows.filter(
    r => r.compositeFinalScore != null && r.effectivenessDelta != null,
  )

  if (attributed.length === 0) {
    return {
      tierAccuracy:        [],
      contributorAccuracy: [],
      summary: {
        totalWithSnapshot:        rows.filter(r => r.compositeFinalScore != null).length,
        totalWithOutcome:         0,
        overallPositiveRate:      0,
        highTierPositiveRate:     null,
        lowTierPositiveRate:      null,
        compositeCalibrationNote: 'No decisions with both a composition snapshot and a measured outcome yet.',
      },
      modelTrustNote:       'Attribution data will populate as more scored decisions are measured.',
      totalAttributedRows:  0,
      generatedAt,
      dataNote: 'Insufficient data — no fully attributed rows.',
    }
  }

  const totalWithSnapshot = rows.filter(r => r.compositeFinalScore != null).length

  // ── 1. Tier accuracy ────────────────────────────────────────────────────────
  const TIERS = ['high', 'medium', 'low', 'uncertain'] as const

  const tierAccuracy: TierAccuracy[] = TIERS.map(tier => {
    const tierRows = attributed.filter(r => r.compositeLabel === tier)
    const count    = tierRows.length
    const pos      = tierRows.filter(r => isPositive(r.effectivenessDelta)).length
    const rate     = pct(pos, count)

    let calibrationNote: string
    if (count < MIN_ATTRIBUTION_SAMPLES) {
      calibrationNote = `Fewer than ${MIN_ATTRIBUTION_SAMPLES} attributed decisions — not yet reliable.`
    } else if (tier === 'high' && rate >= 60) {
      calibrationNote = `High-tier scores are correlating well with positive outcomes (${rate}%).`
    } else if (tier === 'high' && rate < 40) {
      calibrationNote = `High-tier scores are not translating to positive outcomes (${rate}%) — composite may be over-optimistic.`
    } else if (tier === 'low' && rate <= 40) {
      calibrationNote = `Low-tier caution is well-placed (${rate}% positive) — composite is directionally appropriate.`
    } else if (tier === 'low' && rate >= 60) {
      calibrationNote = `Low-tier decisions are resolving positively (${rate}%) — composite may be too conservative.`
    } else {
      calibrationNote = `${rate}% positive outcomes for ${tier}-tier composite score.`
    }

    return { tier, count, positiveCount: pos, positiveRate: rate, calibrationNote }
  }).filter(t => t.count > 0)

  // ── 2. Contributor accuracy ─────────────────────────────────────────────────

  type ContributorSpec = {
    name:    ContributorName
    getDelta: (r: AttributionRow) => number | null | undefined
  }

  const CONTRIBUTORS: ContributorSpec[] = [
    { name: 'bias',       getDelta: r => r.compositeBiasAdjustment  },
    { name: 'predictive', getDelta: r => r.compositePredictiveNudge },
    { name: 'pattern',    getDelta: r => r.compositePatternDelta     },
  ]

  const contributorAccuracy: ContributorAccuracy[] = CONTRIBUTORS.map(({ name, getDelta }) => {
    const withDelta = attributed.filter(r => getDelta(r) != null)

    const active   = withDelta.filter(r => (getDelta(r) ?? 0) >  0.005)
    const neutral  = withDelta.filter(r => Math.abs(getDelta(r) ?? 0) <= 0.005)
    const negative = withDelta.filter(r => (getDelta(r) ?? 0) < -0.005)

    const rateWhenActive   = pct(active.filter(r => isPositive(r.effectivenessDelta)).length,   active.length)
    const rateWhenNeutral  = pct(neutral.filter(r => isPositive(r.effectivenessDelta)).length,  neutral.length)
    const rateWhenNegative = pct(negative.filter(r => isPositive(r.effectivenessDelta)).length, negative.length)
    const netAdvantage     = active.length >= MIN_ATTRIBUTION_SAMPLES && negative.length >= MIN_ATTRIBUTION_SAMPLES
      ? rateWhenActive - rateWhenNegative
      : 0

    let reliability: ContributorReliability
    if (
      active.length < MIN_ATTRIBUTION_SAMPLES ||
      (negative.length < MIN_ATTRIBUTION_SAMPLES && neutral.length < MIN_ATTRIBUTION_SAMPLES)
    ) {
      reliability = 'insufficient'
    } else if (netAdvantage >= 15) {
      reliability = 'helpful'
    } else if (netAdvantage <= -15) {
      reliability = 'harmful'
    } else {
      reliability = 'noisy'
    }

    const reliabilityNote: string =
      reliability === 'helpful'
        ? `${name} is directionally helpful: ${rateWhenActive}% positive when positive vs ${rateWhenNegative}% when negative (n=${active.length + negative.length}).`
        : reliability === 'harmful'
          ? `${name} appears inversely correlated: ${rateWhenActive}% positive when positive, ${rateWhenNegative}% when negative — worth reviewing.`
          : reliability === 'noisy'
            ? `${name} shows no clear directional correlation (net advantage: ${netAdvantage > 0 ? '+' : ''}${netAdvantage}pp, n=${active.length + negative.length}).`
            : `Insufficient attributed samples with both an active and negative ${name} bucket (min ${MIN_ATTRIBUTION_SAMPLES} each required).`

    return {
      contributor:       name,
      rateWhenActive,    sampleWhenActive:   active.length,
      rateWhenNeutral,   sampleWhenNeutral:  neutral.length,
      rateWhenNegative,  sampleWhenNegative: negative.length,
      netAdvantage,
      reliability,
      reliabilityNote,
    }
  })

  // ── 3. Summary ──────────────────────────────────────────────────────────────
  const overallPos     = attributed.filter(r => isPositive(r.effectivenessDelta)).length
  const overallPosRate = pct(overallPos, attributed.length)

  const highRows    = attributed.filter(r => r.compositeLabel === 'high')
  const lowRows     = attributed.filter(r => r.compositeLabel === 'low' || r.compositeLabel === 'uncertain')
  const highRate    = highRows.length >= MIN_ATTRIBUTION_SAMPLES ? pct(highRows.filter(r => isPositive(r.effectivenessDelta)).length, highRows.length) : null
  const lowRate     = lowRows.length  >= MIN_ATTRIBUTION_SAMPLES ? pct(lowRows.filter(r => isPositive(r.effectivenessDelta)).length,  lowRows.length)  : null

  let compositeCalibrationNote: string
  if (highRate !== null && lowRate !== null) {
    const spread = highRate - lowRate
    if (spread >= 20) {
      compositeCalibrationNote = `Composite score is well-calibrated: high-tier shows ${highRate}% vs low/uncertain ${lowRate}% (${spread}pp spread).`
    } else if (spread >= 5) {
      compositeCalibrationNote = `Composite score is directionally helpful but spread is modest (${highRate}% vs ${lowRate}%, ${spread}pp).`
    } else {
      compositeCalibrationNote = `Composite score spread is low (${highRate}% vs ${lowRate}%, ${spread}pp) — composition layers may not be adding clear discriminative value yet.`
    }
  } else {
    compositeCalibrationNote = 'Insufficient data in at least one composite tier for spread analysis.'
  }

  // ── 4. Model trust note ─────────────────────────────────────────────────────
  const helpful  = contributorAccuracy.filter(c => c.reliability === 'helpful')
  const harmful  = contributorAccuracy.filter(c => c.reliability === 'harmful')
  const noisy    = contributorAccuracy.filter(c => c.reliability === 'noisy')

  let modelTrustNote: string
  if (attributed.length < MIN_ATTRIBUTION_SAMPLES * 2) {
    modelTrustNote = 'Accumulating attribution data — more actioned and measured decisions needed for reliable trust signals.'
  } else if (helpful.length >= 2) {
    modelTrustNote = `${helpful.length} contributor(s) (${helpful.map(c => c.contributor).join(', ')}) show directionally helpful correlations. Model trust is building.`
  } else if (harmful.length > 0) {
    modelTrustNote = `⚠ ${harmful.map(c => c.contributor).join(', ')} show inverse correlations — review whether this contributor's weights need recalibration.`
  } else if (noisy.length === 3) {
    modelTrustNote = 'All contributors appear noisy at this sample size — continue accumulating decisions before drawing conclusions.'
  } else {
    modelTrustNote = `Mixed reliability across contributors — ${helpful.length} helpful, ${noisy.length} noisy, ${harmful.length} potentially harmful. Continue monitoring.`
  }

  return {
    tierAccuracy,
    contributorAccuracy,
    summary: {
      totalWithSnapshot:        totalWithSnapshot,
      totalWithOutcome:         attributed.length,
      overallPositiveRate:      overallPosRate,
      highTierPositiveRate:     highRate,
      lowTierPositiveRate:      lowRate,
      compositeCalibrationNote,
    },
    modelTrustNote,
    totalAttributedRows: attributed.length,
    generatedAt,
  }
}
