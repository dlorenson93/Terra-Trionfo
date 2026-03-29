/**
 * deriveEffectivenessDelta
 *
 * Compares a pre-action signal state against a post-action signal state and
 * returns a structured effectiveness assessment.
 *
 * Design principles:
 *  - Score is 0–100. Higher = better commercial health.
 *  - Delta is the difference (post − pre). Positive = improvement.
 *  - Thresholds are intentionally conservative to avoid false positives.
 *  - effectivenessReason is sentence-form, readable by a non-technical admin.
 */

export type EffectivenessDelta =
  | 'POSITIVE_SHIFT'
  | 'NO_MEANINGFUL_CHANGE'
  | 'NEGATIVE_SHIFT'
  | 'MIXED_RESULT'

export interface EffectivenessResult {
  preScore:            number
  postScore:           number
  delta:               number          // post − pre
  effectivenessDelta:  EffectivenessDelta
  effectivenessReason: string
}

// ── Signal score weights ────────────────────────────────────────────────────

/** Base score derived from releaseMonitorStatus (0–70 points). */
const MONITOR_BASE_SCORE: Record<string, number> = {
  HIGH_DEMAND:         70,
  ALLOCATION_PRESSURE: 55, // high demand but constrained — mixed health
  UPCOMING_INTEREST:   50,
  STABLE:              45,
  NEEDS_REVIEW:        30,
  UNDERPERFORMING:     10,
}

/** Additive modifier from exposureTier (−10 to +20 points). */
const TIER_MODIFIER: Record<string, number> = {
  PRIORITY: 20,
  LIMITED:  15,
  STANDARD:  5,
  LOW:      -10,
}

/**
 * Derives a 0–100 signal score for a product's current state.
 * Returns 0 when no signal data is available (NEVER_RUN / null).
 */
export function deriveSignalScore(
  monitorStatus: string | null | undefined,
  exposureTier:  string | null | undefined,
): number {
  if (!monitorStatus) return 0
  const base = MONITOR_BASE_SCORE[monitorStatus] ?? 20
  const mod  = exposureTier ? (TIER_MODIFIER[exposureTier] ?? 0) : 0
  return Math.max(0, Math.min(100, base + mod))
}

// ── Delta thresholds ────────────────────────────────────────────────────────

/** Minimum absolute score improvement to call POSITIVE_SHIFT. */
const POSITIVE_THRESHOLD = 15
/** Maximum absolute score drop before calling NEGATIVE_SHIFT. */
const NEGATIVE_THRESHOLD = -10
/** Noise band: changes within ±5 points are treated as noise. */
const NOISE_BAND = 5

// ── Main function ───────────────────────────────────────────────────────────

export function deriveEffectivenessDelta(params: {
  preMonitorStatus:  string | null | undefined
  preExposureTier:   string | null | undefined
  postMonitorStatus: string | null | undefined
  postExposureTier:  string | null | undefined
}): EffectivenessResult {
  const { preMonitorStatus, preExposureTier, postMonitorStatus, postExposureTier } = params

  const preScore  = deriveSignalScore(preMonitorStatus,  preExposureTier)
  const postScore = deriveSignalScore(postMonitorStatus, postExposureTier)
  const delta     = postScore - preScore

  // ── Classify ──────────────────────────────────────────────────────────────

  let effectivenessDelta: EffectivenessDelta

  // No pre-action data — cannot meaningfully compare
  if (!preMonitorStatus) {
    effectivenessDelta = 'NO_MEANINGFUL_CHANGE'
    return {
      preScore, postScore, delta, effectivenessDelta,
      effectivenessReason: 'No pre-action signal data available to compare against.',
    }
  }

  // No post-action data yet
  if (!postMonitorStatus) {
    effectivenessDelta = 'NO_MEANINGFUL_CHANGE'
    return {
      preScore, postScore, delta, effectivenessDelta,
      effectivenessReason: 'Post-action signal data not yet available.',
    }
  }

  // Check for mixed result: monitor improved but tier worsened or vice versa
  const monitorImproved = (MONITOR_BASE_SCORE[postMonitorStatus] ?? 20) >
                          (MONITOR_BASE_SCORE[preMonitorStatus]  ?? 20)
  const tierWorsened    = preExposureTier && postExposureTier &&
                          (TIER_MODIFIER[postExposureTier] ?? 0) <
                          (TIER_MODIFIER[preExposureTier]  ?? 0)
  const tierImproved    = preExposureTier && postExposureTier &&
                          (TIER_MODIFIER[postExposureTier] ?? 0) >
                          (TIER_MODIFIER[preExposureTier]  ?? 0)
  const monitorWorsened = (MONITOR_BASE_SCORE[postMonitorStatus] ?? 20) <
                          (MONITOR_BASE_SCORE[preMonitorStatus]  ?? 20)

  if ((monitorImproved && tierWorsened) || (tierImproved && monitorWorsened)) {
    effectivenessDelta = 'MIXED_RESULT'
  } else if (delta >= POSITIVE_THRESHOLD) {
    effectivenessDelta = 'POSITIVE_SHIFT'
  } else if (delta <= NEGATIVE_THRESHOLD) {
    effectivenessDelta = 'NEGATIVE_SHIFT'
  } else if (Math.abs(delta) <= NOISE_BAND) {
    effectivenessDelta = 'NO_MEANINGFUL_CHANGE'
  } else if (delta > 0) {
    // Positive but below threshold — marginal improvement, call it mixed
    effectivenessDelta = 'MIXED_RESULT'
  } else {
    effectivenessDelta = 'NO_MEANINGFUL_CHANGE'
  }

  // ── Build reason ──────────────────────────────────────────────────────────

  const fmt = (s: string) => s.replace(/_/g, ' ').toLowerCase()
  const scoreLine = `Signal score moved from ${preScore} → ${postScore} (${delta >= 0 ? '+' : ''}${delta} pts).`
  const statusLine = preMonitorStatus === postMonitorStatus
    ? `Monitor status unchanged at ${fmt(postMonitorStatus)}.`
    : `Monitor status shifted from ${fmt(preMonitorStatus)} to ${fmt(postMonitorStatus)}.`

  let conclusion = ''
  switch (effectivenessDelta) {
    case 'POSITIVE_SHIFT':
      conclusion = 'Action appears to have improved commercial health.'
      break
    case 'NEGATIVE_SHIFT':
      conclusion = 'Signals declined after action — follow-up recommended.'
      break
    case 'MIXED_RESULT':
      conclusion = 'Demand and exposure signals moved in different directions.'
      break
    case 'NO_MEANINGFUL_CHANGE':
      conclusion = 'No significant change detected within the measurement window.'
      break
  }

  const effectivenessReason = `${scoreLine} ${statusLine} ${conclusion}`

  return { preScore, postScore, delta, effectivenessDelta, effectivenessReason }
}

// ── Display helpers ──────────────────────────────────────────────────────────

export const EFFECTIVENESS_LABEL: Record<EffectivenessDelta, string> = {
  POSITIVE_SHIFT:       'Positive Shift',
  NO_MEANINGFUL_CHANGE: 'No Change',
  NEGATIVE_SHIFT:       'Negative Shift',
  MIXED_RESULT:         'Mixed Result',
}

export const EFFECTIVENESS_BADGE_CLASS: Record<EffectivenessDelta, string> = {
  POSITIVE_SHIFT:       'bg-emerald-50 text-emerald-700 border border-emerald-200',
  NO_MEANINGFUL_CHANGE: 'bg-gray-50 text-gray-500 border border-gray-200',
  NEGATIVE_SHIFT:       'bg-red-50 text-red-700 border border-red-200',
  MIXED_RESULT:         'bg-amber-50 text-amber-700 border border-amber-200',
}

export const EFFECTIVENESS_ICON: Record<EffectivenessDelta, string> = {
  POSITIVE_SHIFT:       '↑',
  NO_MEANINGFUL_CHANGE: '→',
  NEGATIVE_SHIFT:       '↓',
  MIXED_RESULT:         '⇅',
}
