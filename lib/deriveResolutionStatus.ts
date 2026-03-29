/**
 * deriveResolutionStatus
 *
 * Derives a RecommendationResolutionStatus from the current product signal
 * state. Intended to be called after a recommendation has been ACTIONED so
 * admins can see whether the underlying problem has actually improved.
 *
 * Rules (in priority order):
 *  1. Only applies when recommendationStatus === 'ACTIONED'.
 *  2. If actionedAt < ACTION_WINDOW_DAYS ago → UNRESOLVED (too soon).
 *  3. Signals that confirm resolution: HIGH_DEMAND, STABLE → RESOLVED.
 *  4. Signals that confirm persistence of problem: UNDERPERFORMING,
 *     ALLOCATION_PRESSURE + RED tier → REQUIRES_FOLLOW_UP.
 *  5. Positive tier movement without full resolution signals → IMPROVING.
 *  6. Default (mixed / insufficient data) → IMPROVING.
 */

export type RecommendationResolutionStatus =
  | 'UNRESOLVED'
  | 'IMPROVING'
  | 'RESOLVED'
  | 'REQUIRES_FOLLOW_UP'

/** Days after ACTIONED before we consider the outcome window open. */
const ACTION_WINDOW_DAYS = 14

export interface ResolutionInputs {
  recommendationStatus:         string | null | undefined
  lastRecommendationActionedAt: Date | string | null | undefined
  releaseMonitorStatus:         string | null | undefined
  exposureTier:                 string | null | undefined
}

export function deriveResolutionStatus(
  product: ResolutionInputs,
): RecommendationResolutionStatus | null {
  // Only track resolution for ACTIONED recommendations
  if (product.recommendationStatus !== 'ACTIONED') return null

  // If never actioned, can't resolve
  if (!product.lastRecommendationActionedAt) return 'UNRESOLVED'

  const actionedAt =
    product.lastRecommendationActionedAt instanceof Date
      ? product.lastRecommendationActionedAt
      : new Date(product.lastRecommendationActionedAt)

  const daysSinceAction =
    (Date.now() - actionedAt.getTime()) / (1000 * 60 * 60 * 24)

  // Too soon to evaluate
  if (daysSinceAction < ACTION_WINDOW_DAYS) return 'UNRESOLVED'

  const monitor = product.releaseMonitorStatus
  const tier    = product.exposureTier

  // Confirmed resolution: strong positive signals
  if (monitor === 'HIGH_DEMAND' || monitor === 'STABLE') return 'RESOLVED'

  // Confirmed follow-up needed: problem still active
  if (monitor === 'UNDERPERFORMING') return 'REQUIRES_FOLLOW_UP'
  if (monitor === 'ALLOCATION_PRESSURE' && tier === 'RED') return 'REQUIRES_FOLLOW_UP'
  if (monitor === 'ALLOCATION_PRESSURE' && tier === 'LOW') return 'REQUIRES_FOLLOW_UP'

  // Mixed / early improvement signals
  if (tier === 'PRIORITY' || tier === 'LIMITED' || monitor === 'NEEDS_REVIEW') return 'IMPROVING'
  if (monitor === 'UPCOMING_INTEREST') return 'IMPROVING'

  // Default: improving (benefit of the doubt after window passes)
  return 'IMPROVING'
}

export const RESOLUTION_LABEL: Record<RecommendationResolutionStatus, string> = {
  UNRESOLVED:         'Awaiting Outcome',
  IMPROVING:          'Improving',
  RESOLVED:           'Resolved',
  REQUIRES_FOLLOW_UP: 'Follow-up Required',
}

export const RESOLUTION_BADGE_CLASS: Record<RecommendationResolutionStatus, string> = {
  UNRESOLVED:         'bg-amber-50 text-amber-700 border border-amber-200',
  IMPROVING:          'bg-blue-50 text-blue-700 border border-blue-200',
  RESOLVED:           'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REQUIRES_FOLLOW_UP: 'bg-red-50 text-red-700 border border-red-200',
}
