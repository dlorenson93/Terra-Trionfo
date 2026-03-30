/**
 * lib/strategyPatternInfluenceEngine.ts
 *
 * Phase 19 — Pattern Influence Engine
 *
 * Pure engine. No DB access.
 *
 * Given the compiled strategy pattern library and a plan/scenario context,
 * determines whether historical patterns provide meaningful support or risk
 * signals, and produces a bounded, interpretable influence result.
 *
 * DESIGN PRINCIPLES:
 *   - Additive only — supplements the primary confidence signal, never replaces it
 *   - Bounded — max ±0.08 equivalent influence delta
 *   - Transparent — every result includes a human-readable explanation
 *   - Conservative — requiresmoderate+ confidence patterns with ≥ MIN_INFLUENCE_SAMPLES
 *   - Governance-gated — returns 'insufficient' when evidence is thin or absent
 *
 * INFLUENCE WEIGHTS (per qualifying matching pattern):
 *   strong   confidence: ±0.04
 *   moderate confidence: ±0.02
 *   Max total delta: ±0.08 (clamped)
 *
 * Does NOT directly alter public-facing behaviour. Admin-intelligence only.
 * Advisory only — never triggers any auto-action.
 */

import { findRelevantPatterns }           from './strategyPatternEngine'
import type { PatternLibraryOutput }      from './strategyPatternEngine'

// ── Governance thresholds ─────────────────────────────────────────────────────

/** Patterns with fewer samples than this are informational only and excluded from influence */
const MIN_INFLUENCE_SAMPLES = 5

/** Per-pattern delta contributions (bounded additively) */
const DELTA_STRONG   = 0.04
const DELTA_MODERATE = 0.02

/** Maximum total influence in either direction */
const MAX_DELTA = 0.08

// ── Output types ──────────────────────────────────────────────────────────────

export type PatternInfluenceDirection =
  | 'positive'      // Net winning signal dominates — slight historical tailwind
  | 'negative'      // Net risk signal dominates — historical headwind present
  | 'neutral'       // Winning and risk signals roughly cancel — no net guidance
  | 'insufficient'  // No qualifying patterns found — influence withheld

export type PatternInfluenceStrength =
  | 'strong'    // |delta| >= 0.06  — multiple strong patterns converge
  | 'moderate'  // |delta| >= 0.03  — consistent single-direction evidence
  | 'slight'    // |delta| >= 0.01  — marginal signal
  | 'none'      // |delta| <  0.01  — effectively zero (neutral or insufficient)

export interface PatternContext {
  region?:      string | null
  style?:       string | null
  priceTier?:   string | null
  rolloutMode?: string | null
  timing?:      string | null
  actionType?:  string | null
}

export interface PatternInfluenceResult {
  supportingPatternCount:    number
  riskPatternCount:          number
  patternInfluenceDirection: PatternInfluenceDirection
  patternInfluenceStrength:  PatternInfluenceStrength
  /**
   * Bounded numeric influence delta — range [-0.08, +0.08].
   * For admin display cues only. Not to be used as raw arithmetic input
   * to primary confidence scores.
   */
  influenceDelta: number
  /** 1–2 sentence human-readable explanation of the influence result */
  explanation:    string
  /** Short governance note — why influence was applied or withheld */
  governanceNote: string
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function toStrength(absDelta: number): PatternInfluenceStrength {
  if (absDelta >= 0.06) return 'strong'
  if (absDelta >= 0.03) return 'moderate'
  if (absDelta >= 0.01) return 'slight'
  return 'none'
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * computePatternInfluence
 *
 * Given the pattern library and a plan/scenario context, matches qualifying
 * patterns, computes a bounded influence delta ([-0.08, +0.08]), and returns
 * a fully-described influence result for admin observability.
 *
 * Governance: only patterns with confidence !== 'limited' AND sampleSize >= MIN_INFLUENCE_SAMPLES
 * are considered. All others are informational / not applied.
 */
export function computePatternInfluence(
  library: PatternLibraryOutput | null,
  context: PatternContext,
): PatternInfluenceResult {
  const INSUFFICIENT: PatternInfluenceResult = {
    supportingPatternCount:    0,
    riskPatternCount:          0,
    patternInfluenceDirection: 'insufficient',
    patternInfluenceStrength:  'none',
    influenceDelta:            0,
    explanation:               'No relevant pattern evidence in this portfolio to supplement the plan assessment.',
    governanceNote:            'Pattern influence withheld — insufficient qualified patterns.',
  }

  if (!library || (library.winningPatterns.length === 0 && library.riskPatterns.length === 0)) {
    return INSUFFICIENT
  }

  // ── Governance filter — only moderate/strong confidence with ≥ MIN_INFLUENCE_SAMPLES ──
  const winningQualified = library.winningPatterns.filter(
    p => p.confidence !== 'limited' && p.sampleSize >= MIN_INFLUENCE_SAMPLES,
  )
  const riskQualified = library.riskPatterns.filter(
    p => p.confidence !== 'limited' && p.sampleSize >= MIN_INFLUENCE_SAMPLES,
  )

  if (winningQualified.length === 0 && riskQualified.length === 0) {
    return {
      ...INSUFFICIENT,
      governanceNote: `Pattern influence withheld — no patterns meet evidence threshold (moderate+ confidence, n≥${MIN_INFLUENCE_SAMPLES}).`,
    }
  }

  // ── Context matching ───────────────────────────────────────────────────────
  // Build the opts object — undefined for absent values so findRelevantPatterns
  // skips those dimension checks cleanly
  const ctxOpts = {
    region:      context.region     ?? undefined,
    style:       context.style      ?? undefined,
    priceTier:   context.priceTier  ?? undefined,
    rolloutMode: context.rolloutMode ?? undefined,
    timing:      context.timing     ?? undefined,
    actionType:  context.actionType ?? undefined,
  }

  // findRelevantPatterns applies a slice(0,2) guard — for influence we need all
  // matches across the full qualified list, so we filter individually
  const matchingWinning = winningQualified.filter(p => findRelevantPatterns([p], ctxOpts).length > 0)
  const matchingRisk    = riskQualified.filter(p => findRelevantPatterns([p], ctxOpts).length > 0)

  const supportingPatternCount = matchingWinning.length
  const riskPatternCount       = matchingRisk.length

  if (supportingPatternCount === 0 && riskPatternCount === 0) {
    return {
      ...INSUFFICIENT,
      governanceNote: 'Pattern influence withheld — no qualified patterns matched the plan context.',
    }
  }

  // ── Compute bounded delta ─────────────────────────────────────────────────
  let raw = 0
  for (const p of matchingWinning) {
    raw += p.confidence === 'strong' ? DELTA_STRONG : DELTA_MODERATE
  }
  for (const p of matchingRisk) {
    raw -= p.confidence === 'strong' ? DELTA_STRONG : DELTA_MODERATE
  }
  const influenceDelta = clamp(raw, -MAX_DELTA, MAX_DELTA)
  const absDelta       = Math.abs(influenceDelta)

  // ── Direction ────────────────────────────────────────────────────────────
  let patternInfluenceDirection: PatternInfluenceDirection
  if (supportingPatternCount > 0 && riskPatternCount === 0) {
    patternInfluenceDirection = 'positive'
  } else if (riskPatternCount > 0 && supportingPatternCount === 0) {
    patternInfluenceDirection = 'negative'
  } else if (influenceDelta > 0.005) {
    patternInfluenceDirection = 'positive'
  } else if (influenceDelta < -0.005) {
    patternInfluenceDirection = 'negative'
  } else {
    patternInfluenceDirection = 'neutral'
  }

  const patternInfluenceStrength: PatternInfluenceStrength = patternInfluenceDirection === 'neutral'
    ? 'none'
    : toStrength(absDelta)

  // ── Explanation ───────────────────────────────────────────────────────────
  let explanation: string
  if (patternInfluenceDirection === 'positive') {
    explanation = supportingPatternCount === 1
      ? `1 qualified winning pattern supports this strategy approach — slight historical tailwind.`
      : `${supportingPatternCount} qualified winning patterns support this strategy approach — consistent historical tailwind.`
    if (riskPatternCount > 0) {
      explanation += ` (${riskPatternCount} risk pattern${riskPatternCount > 1 ? 's' : ''} also present — net positive.)`
    }
  } else if (patternInfluenceDirection === 'negative') {
    explanation = riskPatternCount === 1
      ? `1 qualified risk pattern flags this strategy approach — historical headwind present.`
      : `${riskPatternCount} qualified risk patterns flag this strategy approach — consistent historical headwind.`
    if (supportingPatternCount > 0) {
      explanation += ` (${supportingPatternCount} winning pattern${supportingPatternCount > 1 ? 's' : ''} also present — net negative.)`
    }
  } else {
    explanation = `${supportingPatternCount} winning and ${riskPatternCount} risk patterns match — signals balance out. Pattern evidence is not conclusive for this context.`
  }

  const governanceNote = `Applied: ${supportingPatternCount + riskPatternCount} pattern(s) — moderate+ confidence, n≥${MIN_INFLUENCE_SAMPLES} each.`

  return {
    supportingPatternCount,
    riskPatternCount,
    patternInfluenceDirection,
    patternInfluenceStrength,
    influenceDelta,
    explanation,
    governanceNote,
  }
}
