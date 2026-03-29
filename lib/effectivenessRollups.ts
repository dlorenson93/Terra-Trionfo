/**
 * effectivenessRollups.ts
 *
 * Pure aggregation layer. Takes a pre-filtered array of products and
 * returns portfolio-level effectiveness rollups across:
 *   - action type
 *   - region
 *   - style (grape / wine style)
 *   - price tier
 *
 * Only aggregates products where:
 *   recommendationStatus === 'ACTIONED'  AND  effectivenessDelta !== null
 *
 * This module never queries the DB — it receives data from the API route.
 * Never expose output to consumers.
 */

import type { EffectivenessDelta } from './deriveEffectivenessDelta'

// ── Input type ────────────────────────────────────────────────────────────────

export interface RollupProduct {
  id:                     string
  recommendationStatus:   string | null
  recommendationActionType: string | null
  effectivenessDelta:     string | null
  preActionSignalScore:   number | null
  postActionSignalScore:  number | null
  releaseMonitorStatus:   string | null
  exposureTier:           string | null
  region:                 string | null
  wineStyle:              string | null
  grapeVarietals:         string[]
  appellation:            string | null
  retailPriceCents:       number
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface DimensionRollup {
  key:            string
  label:          string
  totalCount:     number
  positiveCount:  number
  mixedCount:     number
  noChangeCount:  number
  negativeCount:  number
  positiveRate:   number   // 0–100, rounded to 1dp
  negativeRate:   number   // 0–100
  averageDelta:   number   // mean (postScore − preScore) across measured subset
}

export interface ActionTypeRollup  extends DimensionRollup {}
export interface RegionRollup      extends DimensionRollup {}
export interface StyleRollup       extends DimensionRollup {}
export interface PriceTierRollup   extends DimensionRollup {}

export interface PortfolioSummary {
  totalMeasured:            number
  positiveRate:             number
  negativeRate:             number
  avgDelta:                 number
  topPerformingActionType:  string | null
  worstPerformingActionType: string | null
  topPerformingRegion:      string | null
  topPerformingStyle:       string | null
}

export interface EffectivenessRollupOutput {
  actionTypePerformance: ActionTypeRollup[]
  regionPerformance:     RegionRollup[]
  stylePerformance:      StyleRollup[]
  priceTierPerformance:  PriceTierRollup[]
  portfolioSummary:      PortfolioSummary
}

// ── Label maps ────────────────────────────────────────────────────────────────

const ACTION_TYPE_LABELS: Record<string, string> = {
  ACCELERATE_RELEASE:      'Accelerate Release',
  HOLD_RELEASE:            'Hold Release',
  INCREASE_ALLOCATION:     'Increase Allocation',
  REDUCE_EXPOSURE:         'Reduce Exposure',
  INCREASE_MERCHANDISING:  'Increase Merchandising',
  MAINTAIN:                'Maintain',
  NONE:                    'No Action',
  DISMISSED:               'Dismissed',
}

// ── Style bucket ──────────────────────────────────────────────────────────────

/**
 * Maps a product's grape varietals / style / appellation into a grouping bucket
 * that matches the Italian-focused Terra Trionfo portfolio.
 */
export function deriveStyleBucket(
  grapeVarietals: string[],
  wineStyle:      string | null,
  appellation:    string | null,
): string {
  const grapes = grapeVarietals.map(g => g.toLowerCase())
  const app    = (appellation ?? '').toLowerCase()

  if (grapes.some(g => g.includes('nebbiolo')) || app.includes('barolo') || app.includes('barbaresco') || app.includes('langhe')) {
    return 'Nebbiolo'
  }
  if (grapes.some(g => g.includes('barbera'))) {
    return 'Barbera'
  }
  if (grapes.some(g => g.includes('chardonnay') || g.includes('pinot nero') || g.includes('pinot noir')) && app.includes('franciacorta')) {
    return 'Franciacorta'
  }
  if (
    grapes.some(g => g.includes('pinot grigio') || g.includes('gewürztraminer') || g.includes('müller') || g.includes('riesling') || g.includes('sauvignon')) &&
    (app.includes('alto adige') || app.includes('trentino') || app.includes('friuli'))
  ) {
    return 'Alpine Whites'
  }
  if (grapes.some(g => g.includes('glera')) || app.includes('prosecco')) {
    return 'Sparkling'
  }
  // Fallback to wineStyle buckets
  if (wineStyle === 'Sparkling' || wineStyle === 'Sparkling Red') return 'Sparkling'
  if (wineStyle === 'White') return 'Alpine Whites'
  if (wineStyle === 'Rosé') return 'Rosé'

  return 'Alternative Varietals'
}

// ── Price tier ────────────────────────────────────────────────────────────────

export function derivePriceTierKey(retailPriceCents: number): string {
  if (retailPriceCents < 4000)  return '$25–$40'
  if (retailPriceCents < 6000)  return '$40–$60'
  if (retailPriceCents < 10000) return '$60–$100'
  return '$100+'
}

// ── Core aggregator ───────────────────────────────────────────────────────────

function buildRollup(items: RollupProduct[], key: string, label: string): DimensionRollup {
  let positive = 0, mixed = 0, noChange = 0, negative = 0, deltaSum = 0, deltaCount = 0

  for (const p of items) {
    const d = p.effectivenessDelta as EffectivenessDelta
    if (d === 'POSITIVE_SHIFT')       positive++
    else if (d === 'MIXED_RESULT')    mixed++
    else if (d === 'NO_MEANINGFUL_CHANGE') noChange++
    else if (d === 'NEGATIVE_SHIFT')  negative++

    if (p.preActionSignalScore != null && p.postActionSignalScore != null) {
      deltaSum   += (p.postActionSignalScore - p.preActionSignalScore)
      deltaCount++
    }
  }

  const total = items.length
  return {
    key,
    label,
    totalCount:    total,
    positiveCount: positive,
    mixedCount:    mixed,
    noChangeCount: noChange,
    negativeCount: negative,
    positiveRate:  total > 0 ? Math.round((positive / total) * 1000) / 10 : 0,
    negativeRate:  total > 0 ? Math.round((negative / total) * 1000) / 10 : 0,
    averageDelta:  deltaCount > 0 ? Math.round((deltaSum / deltaCount) * 10) / 10 : 0,
  }
}

function groupAndRollup<K extends string>(
  products: RollupProduct[],
  keyFn:    (p: RollupProduct) => K | null,
  labelFn:  (k: K) => string,
): DimensionRollup[] {
  const groups = new Map<K, RollupProduct[]>()
  for (const p of products) {
    const k = keyFn(p)
    if (!k) continue
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(p)
  }
  return Array.from(groups.entries())
    .map(([k, items]) => buildRollup(items, k, labelFn(k)))
    .sort((a, b) => b.totalCount - a.totalCount)
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeEffectivenessRollups(
  allProducts: RollupProduct[],
): EffectivenessRollupOutput {
  // Filter to measurable products only
  const measured = allProducts.filter(
    p => p.recommendationStatus === 'ACTIONED' && p.effectivenessDelta != null,
  )

  // ── Action type ────────────────────────────────────────────────────────────
  const actionTypePerformance = groupAndRollup(
    measured,
    p => (p.recommendationActionType as string | null) ?? null,
    k => ACTION_TYPE_LABELS[k] ?? k.replace(/_/g, ' '),
  ) as ActionTypeRollup[]

  // ── Region ─────────────────────────────────────────────────────────────────
  const regionPerformance = groupAndRollup(
    measured,
    p => p.region ?? null,
    k => k,
  ) as RegionRollup[]

  // ── Style ──────────────────────────────────────────────────────────────────
  const stylePerformance = groupAndRollup(
    measured,
    p => deriveStyleBucket(p.grapeVarietals ?? [], p.wineStyle, p.appellation),
    k => k,
  ) as StyleRollup[]

  // ── Price tier ─────────────────────────────────────────────────────────────
  const priceTierPerformance = groupAndRollup(
    measured,
    p => derivePriceTierKey(p.retailPriceCents),
    k => k,
  ).sort((a, b) => {
    // Order tiers from lowest to highest
    const order = ['$25–$40', '$40–$60', '$60–$100', '$100+']
    return order.indexOf(a.key) - order.indexOf(b.key)
  }) as PriceTierRollup[]

  // ── Portfolio summary ──────────────────────────────────────────────────────
  const totalMeasured  = measured.length
  let sumDelta = 0, deltaCount = 0, posTotal = 0, negTotal = 0

  for (const p of measured) {
    const d = p.effectivenessDelta as EffectivenessDelta
    if (d === 'POSITIVE_SHIFT') posTotal++
    if (d === 'NEGATIVE_SHIFT') negTotal++
    if (p.preActionSignalScore != null && p.postActionSignalScore != null) {
      sumDelta   += (p.postActionSignalScore - p.preActionSignalScore)
      deltaCount++
    }
  }

  // Best / worst from action type rollup (min 2 samples for reliability)
  const reliableActionTypes = actionTypePerformance.filter(a => a.totalCount >= 2)
  const topActionType  = reliableActionTypes.sort((a, b) => b.positiveRate - a.positiveRate)[0] ?? null
  const worstActionType = reliableActionTypes.sort((a, b) => a.positiveRate - b.positiveRate)[0] ?? null
  const topRegion      = regionPerformance.filter(r => r.totalCount >= 2).sort((a, b) => b.positiveRate - a.positiveRate)[0] ?? null
  const topStyle       = stylePerformance.filter(s => s.totalCount >= 2).sort((a, b) => b.positiveRate - a.positiveRate)[0] ?? null

  const portfolioSummary: PortfolioSummary = {
    totalMeasured,
    positiveRate:  totalMeasured > 0 ? Math.round((posTotal / totalMeasured) * 1000) / 10 : 0,
    negativeRate:  totalMeasured > 0 ? Math.round((negTotal / totalMeasured) * 1000) / 10 : 0,
    avgDelta:      deltaCount > 0 ? Math.round((sumDelta / deltaCount) * 10) / 10 : 0,
    topPerformingActionType:   topActionType?.label   ?? null,
    worstPerformingActionType: worstActionType?.label ?? null,
    topPerformingRegion:       topRegion?.label       ?? null,
    topPerformingStyle:        topStyle?.label        ?? null,
  }

  return {
    actionTypePerformance,
    regionPerformance,
    stylePerformance,
    priceTierPerformance,
    portfolioSummary,
  }
}
