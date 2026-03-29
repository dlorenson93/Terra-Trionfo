/**
 * calibrationRollups.ts
 *
 * Pure aggregation layer for recommendation calibration.
 *
 * Answers the question: "When the system said high-confidence, was it right
 * more often?" and "Does applying bias actually improve recommendation quality?"
 *
 * Input: ACTIONED recommendation history rows joined with each product's
 * eventual effectiveness outcome.
 *
 * Never queries the DB — all data is passed in from the API route.
 * Never expose to consumers or vendors.
 */

// ── Input type ────────────────────────────────────────────────────────────────

export interface CalibrationPoint {
  /** 0–100 numeric confidence before bias adjustment (null for legacy rows) */
  baseConfidenceScore:     number | null
  /** 0–100 numeric confidence after bias adjustment */
  adjustedConfidenceScore: number | null
  /** Whether a bias multiplier was applied at generation time */
  biasApplied:             boolean | null
  /** The effective multiplier (1.0 = no change) */
  biasMultiplier:          number | null
  /** Product's eventual effectiveness outcome (null if not yet measured) */
  productEffectivenessDelta: string | null
  /** Product's recommendation resolution status */
  productResolutionStatus:   string | null
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface ConfidenceBucket {
  /** Which qualitative tier this bucket covers */
  bucket: 'high' | 'medium' | 'low'
  /** Calibration points in this bucket with a known outcome */
  totalOutcome: number
  /** Points without an outcome yet (follow-up check not yet run) */
  pendingCount: number
  /** % that resulted in POSITIVE_SHIFT (strict — excludes MIXED) */
  positiveRate: number
  /** % that resulted in MIXED_RESULT */
  mixedRate: number
  /** % that resulted in NEGATIVE_SHIFT */
  negativeRate: number
  /** % that resulted in NO_MEANINGFUL_CHANGE */
  noChangeRate: number
  /** How many of these had bias applied */
  biasAppliedCount: number
  /** How many did NOT have bias applied (or bias was inactive) */
  biasNotAppliedCount: number
  /** Positive rate for bias-applied subset */
  biasAppliedPositiveRate: number
  /** Positive rate for non-bias-applied subset */
  biasNotAppliedPositiveRate: number
}

export interface BiasCalibrationSummary {
  withBias: {
    total:         number
    positiveCount: number
    /** 0–100, rounded to 1dp */
    positiveRate:  number
  }
  withoutBias: {
    total:         number
    positiveCount: number
    positiveRate:  number
  }
  /**
   * withBias.positiveRate − withoutBias.positiveRate.
   * Positive = bias improves quality.
   * Negative = bias is hurting quality — flag for governance review.
   */
  advantage: number
}

export interface CalibrationOutput {
  /** Total ACTIONED history rows that include a confidence snapshot */
  totalPoints: number
  /** Subset with a known effectivenessDelta (outcome measured) */
  pointsWithOutcome: number
  /** Subset still awaiting first follow-up check */
  pendingCount: number
  /** Per confidence tier breakdown */
  confidenceBuckets: ConfidenceBucket[]
  /** Bias-applied vs unbiased comparison */
  biasCalibration: BiasCalibrationSummary
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function bucketFromScore(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function isPositive(delta: string | null): boolean {
  return delta === 'POSITIVE_SHIFT'
}

function isMixed(delta: string | null): boolean {
  return delta === 'MIXED_RESULT'
}

function isNegative(delta: string | null): boolean {
  return delta === 'NEGATIVE_SHIFT'
}

function isNoChange(delta: string | null): boolean {
  return delta === 'NO_MEANINGFUL_CHANGE'
}

function hasOutcome(point: CalibrationPoint): boolean {
  return point.productEffectivenessDelta !== null
}

function rate(count: number, total: number): number {
  if (total === 0) return 0
  return Math.round((count / total) * 1000) / 10  // 1dp
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Compute calibration rollups from a list of ACTIONED history rows.
 * Points without a confidence snapshot (legacy rows) are excluded.
 *
 * @param points - array of CalibrationPoints from the API layer
 */
export function computeCalibrationRollups(points: CalibrationPoint[]): CalibrationOutput {
  // Filter to rows that have a confidence snapshot
  const snapshots = points.filter((p) => p.baseConfidenceScore !== null)

  const totalPoints      = snapshots.length
  const withOutcome      = snapshots.filter(hasOutcome)
  const pointsWithOutcome = withOutcome.length
  const pendingCount     = totalPoints - pointsWithOutcome

  // ── Per-bucket calibration ────────────────────────────────────────────────
  const BUCKETS: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low']

  const confidenceBuckets: ConfidenceBucket[] = BUCKETS.map((bucket) => {
    // Use adjustedConfidenceScore as the primary bucket key (what the system
    // actually communicated to the decision maker after bias). Fall back to
    // baseConfidenceScore for unbiased rows.
    const bucketPoints = snapshots.filter((p) => {
      const score = p.adjustedConfidenceScore ?? p.baseConfidenceScore!
      return bucketFromScore(score) === bucket
    })

    const pending = bucketPoints.filter((p) => !hasOutcome(p)).length
    const measured = bucketPoints.filter(hasOutcome)

    const positiveCount  = measured.filter((p) => isPositive(p.productEffectivenessDelta)).length
    const mixedCount     = measured.filter((p) => isMixed(p.productEffectivenessDelta)).length
    const negativeCount  = measured.filter((p) => isNegative(p.productEffectivenessDelta)).length
    const noChangeCount  = measured.filter((p) => isNoChange(p.productEffectivenessDelta)).length

    // Bias split within this bucket
    const biasApplied    = measured.filter((p) => p.biasApplied === true)
    const biasNotApplied = measured.filter((p) => p.biasApplied !== true)
    const biasAppliedPositive    = biasApplied.filter((p) => isPositive(p.productEffectivenessDelta)).length
    const biasNotAppliedPositive = biasNotApplied.filter((p) => isPositive(p.productEffectivenessDelta)).length

    return {
      bucket,
      totalOutcome:               measured.length,
      pendingCount:               pending,
      positiveRate:               rate(positiveCount,          measured.length),
      mixedRate:                  rate(mixedCount,             measured.length),
      negativeRate:               rate(negativeCount,          measured.length),
      noChangeRate:               rate(noChangeCount,          measured.length),
      biasAppliedCount:           biasApplied.length,
      biasNotAppliedCount:        biasNotApplied.length,
      biasAppliedPositiveRate:    rate(biasAppliedPositive,    biasApplied.length),
      biasNotAppliedPositiveRate: rate(biasNotAppliedPositive, biasNotApplied.length),
    }
  })

  // ── Bias vs unbiased calibration ──────────────────────────────────────────
  const measuredPoints = withOutcome

  const withBiasPoints    = measuredPoints.filter((p) => p.biasApplied === true)
  const withoutBiasPoints = measuredPoints.filter((p) => p.biasApplied !== true)

  const withBiasPositive    = withBiasPoints.filter((p) => isPositive(p.productEffectivenessDelta)).length
  const withoutBiasPositive = withoutBiasPoints.filter((p) => isPositive(p.productEffectivenessDelta)).length

  const withBiasRate    = rate(withBiasPositive,    withBiasPoints.length)
  const withoutBiasRate = rate(withoutBiasPositive, withoutBiasPoints.length)

  const biasCalibration: BiasCalibrationSummary = {
    withBias: {
      total:         withBiasPoints.length,
      positiveCount: withBiasPositive,
      positiveRate:  withBiasRate,
    },
    withoutBias: {
      total:         withoutBiasPoints.length,
      positiveCount: withoutBiasPositive,
      positiveRate:  withoutBiasRate,
    },
    advantage: Math.round((withBiasRate - withoutBiasRate) * 10) / 10,
  }

  return {
    totalPoints,
    pointsWithOutcome,
    pendingCount,
    confidenceBuckets,
    biasCalibration,
  }
}
