/**
 * Analysis Freshness Helper
 *
 * Classifies how current a product's persisted intelligence state is based on
 * when the release optimization engine last ran for that product.
 *
 * FRESH       — analyzed within 7 days; safe to act on
 * AGING       — 8–14 days; valid but signals may have shifted; refresh soon
 * STALE       — older than 14 days; should not be acted on without refreshing
 * NEVER_RUN   — lastRecommendationAt is null; product has never been analyzed
 *
 * Reusable in both server (API routes) and client (admin dashboard) contexts.
 * Pure function — no database access.
 */

export type AnalysisFreshness = 'NEVER_RUN' | 'FRESH' | 'AGING' | 'STALE'

const MS_PER_DAY = 86_400_000
const FRESH_DAYS = 7
const AGING_DAYS = 14

export function deriveAnalysisFreshness(
  lastRecommendationAt: Date | string | null | undefined,
): AnalysisFreshness {
  if (!lastRecommendationAt) return 'NEVER_RUN'

  const date =
    typeof lastRecommendationAt === 'string'
      ? new Date(lastRecommendationAt)
      : lastRecommendationAt

  // Guard against invalid dates
  if (isNaN(date.getTime())) return 'NEVER_RUN'

  const daysSince = (Date.now() - date.getTime()) / MS_PER_DAY

  if (daysSince <= FRESH_DAYS)  return 'FRESH'
  if (daysSince <= AGING_DAYS)  return 'AGING'
  return 'STALE'
}

/** Stable display label for each freshness state */
export const FRESHNESS_LABEL: Record<AnalysisFreshness, string> = {
  FRESH:      'Fresh',
  AGING:      'Aging',
  STALE:      'Stale',
  NEVER_RUN:  'Never Run',
}

/** Tailwind classes for freshness badges — used consistently across admin surfaces */
export const FRESHNESS_BADGE_CLASS: Record<AnalysisFreshness, string> = {
  FRESH:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  AGING:     'bg-amber-50 text-amber-700 border border-amber-200',
  STALE:     'bg-red-50 text-red-600 border border-red-200',
  NEVER_RUN: 'bg-gray-50 text-gray-500 border border-gray-200',
}
