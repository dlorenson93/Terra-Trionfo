/**
 * lib/portfolioForecastingEngine.ts
 *
 * Phase 23 — Portfolio Forecasting & Import Opportunity Layer
 *
 * Pure engine — no DB access.
 *
 * Synthesises demand signals, portfolio effectiveness history, and strategy
 * execution playbooks to produce forward-looking portfolio guidance:
 *
 *   - Import Opportunity Signals  — styles/regions to consider importing next
 *   - Portfolio Gap Signals       — demand outpacing portfolio depth
 *   - Region Expansion Signals    — regions with momentum and track record
 *   - Style Deepening Signals     — styles to add more SKUs to
 *   - Price Tier Opportunity Signals — tiers where demand exceeds supply depth
 *
 * Advisory only. ADMIN-ONLY. Never expose to consumers or vendors.
 */

import type { DemandSnapshot, RegionAggregate, StyleAggregate, PriceTierAggregate } from './demandInsights'
import type { EffectivenessRollupOutput, DimensionRollup } from './effectivenessRollups'
import type { StrategyExecutionLearningOutput, PlaybookCandidate } from './strategyExecutionLearningEngine'

// ── Thresholds ────────────────────────────────────────────────────────────────

const MIN_IMPORT_OPPORTUNITY_SCORE  = 1.5
const EFFECTIVENESS_TRACK_RECORD    = 40   // % positive rate = "has a positive track record"
const EFFECTIVENESS_STRONG          = 65   // % positive rate = strong historical confidence
const THIN_PORTFOLIO_THRESHOLD      = 3    // ≤ N products = thin coverage for that dimension

// ── Input types ───────────────────────────────────────────────────────────────

export interface PortfolioForecastingInput {
  demandSnapshot:       DemandSnapshot
  effectivenessRollups: EffectivenessRollupOutput
  strategyLearning:     StrategyExecutionLearningOutput
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface ImportOpportunitySignal {
  id:                string
  style:             string          // style bucket name
  priceTierLabel:    string          // '$25–$40' | '$40–$60' | '$60–$100' | '$100+'
  demandLevel:       string          // StyleAggregate.signal label
  effectivenessRate: number | null   // 0–100 combined positive rate; null if no history
  portfolioDepth:    number          // current product count in this style
  opportunityScore:  number          // composite 0–5
  tradeLeading:      boolean         // trade demand materially outpacing consumer interest
  consumerBuilding:  boolean         // waitlist interest building ahead of purchase conversion
  playbookBacked:    boolean         // covered by an active PlaybookCandidate
  rationale:         string[]
}

export interface PortfolioGapSignal {
  id:             string
  dimension:      'region' | 'style' | 'priceTier'
  key:            string
  label:          string
  demandLevel:    string
  currentDepth:   number
  avgDepth:       number
  gapDescription: string
}

export interface RegionExpansionSignal {
  id:               string
  region:           string   // slug or raw display text
  displayName:      string
  demandLevel:      string
  trend:            string   // 'growing' | 'stable' | 'declining'
  currentDepth:     number
  effectivenessRate: number | null
  playbookBacked:   boolean
  signal:           'strong' | 'moderate' | 'watch'
  rationale:        string[]
}

export interface StyleDeepeningSignal {
  id:                  string
  style:               string
  demandConcentration: number
  signalLabel:         string   // 'strong demand' | 'moderate demand'
  effectivenessRate:   number | null
  channelContext:      string   // 'trade-led' | 'consumer-led' | 'balanced' | 'limited data'
  currentDepth:        number
  playbookBacked:      boolean
  rationale:           string[]
}

export interface PriceTierOpportunitySignal {
  id:                string
  tier:              string   // 'entry' | 'mid' | 'premium' | 'luxury'
  label:             string   // '$25–$40' etc.
  conversionStrength: number
  totalWaitlists:    number
  totalPurchases:    number
  currentDepth:      number
  effectivenessRate: number | null
  signal:            'opportunity' | 'watch' | 'well-served'
  rationale:         string[]
}

export interface ForecastingSummary {
  topImportOpportunity:    string | null
  topRegionToExpand:       string | null
  topStyleToDeepen:        string | null
  topPriceTierOpportunity: string | null
  totalOpportunitySignals: number
  totalGapSignals:         number
  totalExpansionSignals:   number
  portfolioObservations:   string[]
}

export interface PortfolioForecastingOutput {
  importOpportunities:    ImportOpportunitySignal[]
  portfolioGaps:          PortfolioGapSignal[]
  regionExpansionSignals: RegionExpansionSignal[]
  styleDeepeningSignals:  StyleDeepeningSignal[]
  priceTierOpportunities: PriceTierOpportunitySignal[]
  forecastingSummary:     ForecastingSummary
  generatedAt:            string
  dataNote?:              string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function styleSignalWeight(signal: string): number {
  if (signal === 'strong demand')   return 2
  if (signal === 'moderate demand') return 1
  return 0
}

/** Find the effectiveness rollup entry for a style bucket key (exact match). */
function effectivenessForStyle(
  style: string,
  stylePerformance: DimensionRollup[],
): DimensionRollup | null {
  return stylePerformance.find(s => s.key === style) ?? null
}

/** Find the effectiveness rollup entry for a price tier label (e.g. '$40–$60'). */
function effectivenessForTierLabel(
  label: string,
  priceTierPerformance: DimensionRollup[],
): DimensionRollup | null {
  return priceTierPerformance.find(p => p.key === label) ?? null
}

/**
 * Region keys differ between data sources:
 *   - demandInsights: slugs ('piedmont', 'south-tyrol')
 *   - effectivenessRollups: raw DB strings ('Piedmont', 'Barolo', 'Alto Adige' …)
 * We use a contains-based fuzzy match on lowercase.
 */
function effectivenessForRegion(
  regionSlug: string,
  regionPerformance: DimensionRollup[],
): DimensionRollup | null {
  const lower = regionSlug.toLowerCase().replace(/-/g, ' ')
  for (const r of regionPerformance) {
    const rLower = r.key.toLowerCase()
    if (rLower.includes(lower) || lower.includes(rLower)) return r
  }
  return null
}

/**
 * Return true if any active PlaybookCandidate covers this style+region combination.
 * "insufficient" status candidates are excluded.
 */
function isPlaybookBacked(
  style:     string | undefined,
  region:    string | undefined,
  candidates: PlaybookCandidate[],
): boolean {
  for (const p of candidates) {
    if (p.playbookStatus === 'insufficient') continue
    const styleMatch  = !style  || !p.style  ||
      p.style.toLowerCase().includes(style.toLowerCase()) ||
      style.toLowerCase().includes(p.style.toLowerCase())
    const regionMatch = !region || !p.region ||
      p.region.toLowerCase().includes(region.toLowerCase()) ||
      region.toLowerCase().includes(p.region.toLowerCase())
    if (styleMatch && regionMatch) return true
  }
  return false
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computePortfolioForecasting(
  input:       PortfolioForecastingInput,
  generatedAt: string,
): PortfolioForecastingOutput {
  const { demandSnapshot, effectivenessRollups, strategyLearning } = input
  const { regionAggregates, styleAggregates, priceTierAggregates } = demandSnapshot
  const { stylePerformance, regionPerformance, priceTierPerformance } = effectivenessRollups
  const { playbookCandidates } = strategyLearning

  // ── 1. Import Opportunity Signals ─────────────────────────────────────────
  //
  // For each style with meaningful demand, cross-reference each price tier to
  // identify the highest-opportunity import combinations.
  //
  const importOpportunities: ImportOpportunitySignal[] = []

  for (const sa of styleAggregates) {
    if (sa.signal === 'low demand') continue

    const styleEff = effectivenessForStyle(sa.style, stylePerformance)
    const signalW  = styleSignalWeight(sa.signal)

    for (const pta of priceTierAggregates) {
      const tierEff = effectivenessForTierLabel(pta.label, priceTierPerformance)

      // Combined effectiveness rate: average style + tier rate when both exist
      const effRate: number | null =
        styleEff && tierEff
          ? (styleEff.positiveRate + tierEff.positiveRate) / 2
          : tierEff?.positiveRate ?? styleEff?.positiveRate ?? null

      // Trade-leading: aggregate trade interest well above consumer waitlists for this style
      const tradeLeading     = sa.totalTradeInterest > sa.totalWaitlists * 1.5
      // Consumer-building: many waitlisted, but few have converted — latent demand not yet captured
      const consumerBuilding = sa.totalWaitlists > sa.totalPurchases * 2 && sa.totalWaitlists > 5

      // Playbook backing: any active candidate covers this style × any region
      const backed = isPlaybookBacked(sa.style, undefined, playbookCandidates)

      // Composite opportunity score (0–5 scale)
      let score = signalW                                                            // 0–2 demand strength
      if (effRate !== null && effRate >= EFFECTIVENESS_TRACK_RECORD) score += 1     // proven effectiveness
      if (effRate !== null && effRate >= EFFECTIVENESS_STRONG)        score += 0.5  // strong effectiveness
      if (backed)                                                       score += 0.5 // playbook support
      if (sa.productCount <= THIN_PORTFOLIO_THRESHOLD)                 score += 0.5 // thin portfolio

      if (score < MIN_IMPORT_OPPORTUNITY_SCORE) continue

      const rationale: string[] = []
      rationale.push(
        sa.signal === 'strong demand'
          ? `${sa.style} shows strong demand signal across the portfolio.`
          : `${sa.style} shows moderate demand with consistent buying interest.`,
      )
      if (effRate !== null) {
        rationale.push(
          effRate >= EFFECTIVENESS_STRONG
            ? `Strong historical effectiveness: ${effRate.toFixed(1)}% of past actions produced a positive shift.`
            : `Historical effectiveness: ${effRate.toFixed(1)}% of past actions produced a positive shift.`,
        )
      }
      if (sa.productCount <= THIN_PORTFOLIO_THRESHOLD) {
        rationale.push(
          `Portfolio depth is thin (${sa.productCount} product${sa.productCount !== 1 ? 's' : ''}) — selection can be deepened without saturation risk.`,
        )
      }
      if (tradeLeading)     rationale.push('Trade demand is outpacing consumer interest — B2B-led import opportunity.')
      if (consumerBuilding) rationale.push('Consumer waitlist interest is building ahead of purchase conversion — early mover advantage.')
      if (backed)           rationale.push('Supported by an active strategy playbook candidate.')

      importOpportunities.push({
        id:                `import_${slugify(sa.style)}_${slugify(pta.label)}`,
        style:             sa.style,
        priceTierLabel:    pta.label,
        demandLevel:       sa.signal,
        effectivenessRate: effRate !== null ? Math.round(effRate * 10) / 10 : null,
        portfolioDepth:    sa.productCount,
        opportunityScore:  Math.round(score * 10) / 10,
        tradeLeading,
        consumerBuilding,
        playbookBacked:    backed,
        rationale,
      })
    }
  }

  // Sort by opportunityScore desc; keep only top 3 per style to avoid list inflation
  importOpportunities.sort((a, b) => b.opportunityScore - a.opportunityScore)
  const styleCount: Record<string, number> = {}
  const dedupedImport = importOpportunities.filter(sig => {
    styleCount[sig.style] = (styleCount[sig.style] ?? 0) + 1
    return styleCount[sig.style] <= 3
  })

  // ── 2. Portfolio Gap Signals ───────────────────────────────────────────────
  //
  // Dimensions where demand is medium/high but portfolio depth sits below
  // the portfolio's own average — an internal gap check.
  //
  const portfolioGaps: PortfolioGapSignal[] = []

  // Regions
  if (regionAggregates.length > 0) {
    const avgRegionDepth =
      regionAggregates.reduce((s, r) => s + r.productCount, 0) / regionAggregates.length
    for (const ra of regionAggregates) {
      if (ra.demandLevel === 'low') continue
      if (ra.productCount > avgRegionDepth) continue
      portfolioGaps.push({
        id:           `gap_region_${slugify(ra.region)}`,
        dimension:    'region',
        key:          ra.region,
        label:        ra.displayName,
        demandLevel:  ra.demandLevel,
        currentDepth: ra.productCount,
        avgDepth:     Math.round(avgRegionDepth * 10) / 10,
        gapDescription:
          `${ra.displayName} shows ${ra.demandLevel} demand with ${ra.productCount} product${ra.productCount !== 1 ? 's' : ''} ` +
          `— below the portfolio average of ${avgRegionDepth.toFixed(1)}.`,
      })
    }
  }

  // Styles
  if (styleAggregates.length > 0) {
    const avgStyleDepth =
      styleAggregates.reduce((s, sa) => s + sa.productCount, 0) / styleAggregates.length
    for (const sa of styleAggregates) {
      if (sa.signal === 'low demand') continue
      if (sa.productCount > Math.max(avgStyleDepth, THIN_PORTFOLIO_THRESHOLD)) continue
      portfolioGaps.push({
        id:           `gap_style_${slugify(sa.style)}`,
        dimension:    'style',
        key:          sa.style,
        label:        sa.style,
        demandLevel:  sa.signal,
        currentDepth: sa.productCount,
        avgDepth:     Math.round(avgStyleDepth * 10) / 10,
        gapDescription:
          `${sa.style} shows ${sa.signal} with ${sa.productCount} product${sa.productCount !== 1 ? 's' : ''} ` +
          `— below the style average of ${avgStyleDepth.toFixed(1)}.`,
      })
    }
  }

  // Price tiers
  if (priceTierAggregates.length > 0) {
    const avgTierDepth =
      priceTierAggregates.reduce((s, pt) => s + pt.productCount, 0) / priceTierAggregates.length
    for (const pta of priceTierAggregates) {
      const totalDemand = pta.totalWaitlists + pta.totalPurchases
      if (totalDemand < 3) continue
      if (pta.productCount > avgTierDepth) continue
      portfolioGaps.push({
        id:           `gap_tier_${slugify(pta.tier)}`,
        dimension:    'priceTier',
        key:          pta.tier,
        label:        pta.label,
        demandLevel:  pta.conversionStrength >= 1.5 ? 'high' : 'medium',
        currentDepth: pta.productCount,
        avgDepth:     Math.round(avgTierDepth * 10) / 10,
        gapDescription:
          `${pta.label} tier has ${totalDemand} combined demand signals with only ${pta.productCount} product${pta.productCount !== 1 ? 's' : ''} ` +
          `(portfolio average: ${avgTierDepth.toFixed(1)}).`,
      })
    }
  }

  // ── 3. Region Expansion Signals ───────────────────────────────────────────
  //
  // Regions where demand is growing or strong — scored by momentum and
  // historical effectiveness track record.
  //
  const regionExpansionSignals: RegionExpansionSignal[] = []

  for (const ra of regionAggregates) {
    if (ra.demandLevel === 'low' && ra.trend === 'declining') continue

    const effRollup = effectivenessForRegion(ra.region, regionPerformance)
    const effRate   = effRollup?.positiveRate ?? null
    const backed    = isPlaybookBacked(undefined, ra.region, playbookCandidates)

    let signal: 'strong' | 'moderate' | 'watch'
    if (ra.demandLevel === 'high' && (ra.trend === 'growing' || ra.trend === 'stable')) {
      signal = 'strong'
    } else if (ra.demandLevel === 'medium' || ra.trend === 'growing') {
      signal = 'moderate'
    } else {
      signal = 'watch'
    }

    const rationale: string[] = []
    rationale.push(`${ra.displayName}: ${ra.demandLevel} demand, trend ${ra.trend}.`)
    if (effRate !== null) {
      rationale.push(`Historical effectiveness in this region: ${effRate.toFixed(1)}% positive actions.`)
    }
    if (ra.trend === 'growing') {
      rationale.push('Demand is growing — momentum aligns with expansion timing.')
    }
    if (backed) {
      rationale.push('Covered by an active strategy playbook candidate.')
    }

    regionExpansionSignals.push({
      id:               `region_${slugify(ra.region)}`,
      region:            ra.region,
      displayName:       ra.displayName,
      demandLevel:       ra.demandLevel,
      trend:             ra.trend,
      currentDepth:      ra.productCount,
      effectivenessRate: effRate,
      playbookBacked:    backed,
      signal,
      rationale,
    })
  }

  const signalOrder: Record<string, number> = { strong: 0, moderate: 1, watch: 2 }
  regionExpansionSignals.sort((a, b) => {
    const so = signalOrder[a.signal] - signalOrder[b.signal]
    if (so !== 0) return so
    return (b.effectivenessRate ?? 0) - (a.effectivenessRate ?? 0)
  })

  // ── 4. Style Deepening Signals ────────────────────────────────────────────
  //
  // Styles where demand is strong or moderate — recommend adding more SKUs.
  // Channel context distinguishes trade-led vs consumer-led demand.
  //
  const styleDeepeningSignals: StyleDeepeningSignal[] = []

  for (const sa of styleAggregates) {
    if (sa.signal === 'low demand') continue

    const effRollup = effectivenessForStyle(sa.style, stylePerformance)
    const effRate   = effRollup?.positiveRate ?? null
    const backed    = isPlaybookBacked(sa.style, undefined, playbookCandidates)

    const totalDemand = sa.totalWaitlists + sa.totalPurchases + sa.totalTradeInterest
    let channelContext: string
    if (totalDemand === 0) {
      channelContext = 'limited data'
    } else {
      const tradePct = sa.totalTradeInterest / totalDemand
      if (tradePct > 0.6)      channelContext = 'trade-led'
      else if (tradePct < 0.3) channelContext = 'consumer-led'
      else                     channelContext = 'balanced'
    }

    const rationale: string[] = []
    if (sa.signal === 'strong demand') {
      rationale.push(`${sa.style} is performing strongly across all demand signals.`)
    } else {
      rationale.push(`${sa.style} shows moderate demand with consistent interest.`)
    }
    if (effRate !== null && effRate >= EFFECTIVENESS_TRACK_RECORD) {
      rationale.push(`Proven track record: ${effRate.toFixed(1)}% of past actions produced a positive shift.`)
    }
    rationale.push(`Channel context: ${channelContext}.`)
    if (sa.demandConcentration > 2) {
      rationale.push(
        `High demand concentration (${sa.demandConcentration.toFixed(1)} signals per product) — existing selection is under-serving interest.`,
      )
    }
    if (backed) {
      rationale.push('Supported by an active strategy playbook candidate.')
    }

    styleDeepeningSignals.push({
      id:                  `style_${slugify(sa.style)}`,
      style:               sa.style,
      demandConcentration: sa.demandConcentration,
      signalLabel:         sa.signal,
      effectivenessRate:   effRate,
      channelContext,
      currentDepth:        sa.productCount,
      playbookBacked:      backed,
      rationale,
    })
  }

  styleDeepeningSignals.sort((a, b) => {
    if (a.signalLabel !== b.signalLabel) {
      return a.signalLabel === 'strong demand' ? -1 : 1
    }
    return (b.effectivenessRate ?? 0) - (a.effectivenessRate ?? 0)
  })

  // ── 5. Price Tier Opportunity Signals ─────────────────────────────────────
  //
  // Tiers where the conversion-to-depth balance suggests room to add selection.
  //
  const priceTierOpportunities: PriceTierOpportunitySignal[] = []

  const avgConversion =
    priceTierAggregates.reduce((s, p) => s + p.conversionStrength, 0) /
    Math.max(1, priceTierAggregates.length)

  for (const pta of priceTierAggregates) {
    const effRollup    = effectivenessForTierLabel(pta.label, priceTierPerformance)
    const effRate      = effRollup?.positiveRate ?? null
    const totalDemand  = pta.totalWaitlists + pta.totalPurchases
    const waitlistRatio = pta.totalWaitlists / Math.max(1, pta.productCount)

    let signal: 'opportunity' | 'watch' | 'well-served'
    const rationale: string[] = []

    if (pta.conversionStrength >= avgConversion * 1.2 && pta.productCount <= THIN_PORTFOLIO_THRESHOLD) {
      signal = 'opportunity'
      rationale.push(
        `${pta.label} tier shows above-average conversion (${pta.conversionStrength.toFixed(2)}) with thin depth (${pta.productCount} product${pta.productCount !== 1 ? 's' : ''}) — demand can absorb more selection.`,
      )
    } else if (waitlistRatio > 5 && totalDemand > 3) {
      signal = 'opportunity'
      rationale.push(
        `High waitlist-to-product ratio (${waitlistRatio.toFixed(1)}/product) in the ${pta.label} tier — unmet demand is visible.`,
      )
    } else if (totalDemand >= 2 && pta.productCount <= 2) {
      signal = 'watch'
      rationale.push(`${pta.label} tier has active demand signals but below-average portfolio depth.`)
    } else {
      signal = 'well-served'
      rationale.push(`${pta.label} tier appears reasonably served relative to current demand signals.`)
    }

    if (effRate !== null) {
      rationale.push(
        `Historical actions at this price tier: ${effRate.toFixed(1)}% positive effectiveness rate.`,
      )
    }

    priceTierOpportunities.push({
      id:                `tier_${slugify(pta.tier)}`,
      tier:              pta.tier,
      label:             pta.label,
      conversionStrength: Math.round(pta.conversionStrength * 100) / 100,
      totalWaitlists:    pta.totalWaitlists,
      totalPurchases:    pta.totalPurchases,
      currentDepth:      pta.productCount,
      effectivenessRate: effRate,
      signal,
      rationale,
    })
  }

  const tierSignalOrder: Record<string, number> = { opportunity: 0, watch: 1, 'well-served': 2 }
  priceTierOpportunities.sort((a, b) => tierSignalOrder[a.signal] - tierSignalOrder[b.signal])

  // ── 6. Forecasting Summary ────────────────────────────────────────────────

  const topImport = dedupedImport[0] ?? null
  const topRegion = regionExpansionSignals.find(r => r.signal !== 'watch') ?? null
  const topStyle  = styleDeepeningSignals[0] ?? null
  const topTier   = priceTierOpportunities.find(p => p.signal === 'opportunity') ?? null

  const portfolioObservations: string[] = []

  if (topStyle) {
    const effStr =
      topStyle.effectivenessRate !== null
        ? ` with a ${topStyle.effectivenessRate}% historical positive action rate`
        : ''
    portfolioObservations.push(
      `${topStyle.style} shows ${topStyle.signalLabel}${effStr} — consider adding depth in this category.`,
    )
  }
  if (topRegion) {
    portfolioObservations.push(
      `${topRegion.displayName} is showing ${topRegion.trend} ${topRegion.demandLevel} demand — ` +
      `conditions favour deepening regional coverage.`,
    )
  }
  if (topTier) {
    portfolioObservations.push(
      `The ${topTier.label} price tier shows an import opportunity relative to current portfolio depth.`,
    )
  }
  if (dedupedImport.some(i => i.tradeLeading)) {
    portfolioObservations.push(
      'Trade demand is leading consumer interest in several categories — B2B-first rollout may capture early positioning advantage.',
    )
  }
  if (dedupedImport.some(i => i.consumerBuilding)) {
    portfolioObservations.push(
      'Consumer waitlist interest is building ahead of conversion in some styles — early supply depth may unlock deferred purchases.',
    )
  }

  const summary: ForecastingSummary = {
    topImportOpportunity:    topImport ? `${topImport.style} (${topImport.priceTierLabel})` : null,
    topRegionToExpand:       topRegion ? topRegion.displayName : null,
    topStyleToDeepen:        topStyle  ? topStyle.style : null,
    topPriceTierOpportunity: topTier   ? topTier.label : null,
    totalOpportunitySignals: dedupedImport.length,
    totalGapSignals:         portfolioGaps.length,
    totalExpansionSignals:   regionExpansionSignals.filter(r => r.signal !== 'watch').length,
    portfolioObservations,
  }

  // ── Data note ─────────────────────────────────────────────────────────────

  const notes: string[] = []
  if (stylePerformance.length === 0 && priceTierPerformance.length === 0) {
    notes.push('No measured effectiveness history yet — opportunity scoring uses demand signals only.')
  }
  if (playbookCandidates.length === 0) {
    notes.push('No strategy playbook candidates yet — playbook backing signal unavailable.')
  }

  return {
    importOpportunities:    dedupedImport,
    portfolioGaps,
    regionExpansionSignals,
    styleDeepeningSignals,
    priceTierOpportunities,
    forecastingSummary:     summary,
    generatedAt,
    dataNote: notes.length > 0 ? notes.join(' ') : undefined,
  }
}
