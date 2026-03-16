/**
 * Page-context builders for the Phase 2 AI sommelier.
 *
 * Each builder serialises only consumer-visible information into a compact
 * text block that gets prepended to the user message.  Internal pricing
 * layers, wholesale costs, allocation totals, and distributor data are
 * intentionally excluded here at the source.
 */
import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'
import { REGIONS } from '@/lib/regions'
import type {
  WineContext,
  ProducerContext,
  RegionContext,
  SessionPreferences,
  ReleaseStatus,
} from './types'

// ── Release status → human-readable label ──────────────────────────────────
export function releaseLabel(status: ReleaseStatus): string {
  switch (status) {
    case 'UPCOMING':   return 'upcoming introduction'
    case 'AVAILABLE':  return 'currently available'
    case 'ALLOCATED':  return 'available in limited allocation'
    case 'SOLD_OUT':   return 'fully allocated / not available now'
    case 'ARCHIVED':   return 'no longer in active portfolio'
  }
}

// ── Wine context builder ───────────────────────────────────────────────────
/**
 * Build a WineContext from a static data-layer wine id/slug.
 * Used server-side to enrich requests that arrive with only a slug.
 */
export function buildWineContextFromSlug(slug: string): WineContext | null {
  const wine = WINES.find((w) => w.slug === slug || w.id === slug)
  if (!wine) return null
  const producer = PRODUCERS.find((p) => p.id === wine.producerId)
  return {
    name: wine.displayName,
    producer: producer?.name ?? wine.producerId,
    region: wine.region,
    type: wine.type,
    description: wine.description,
    appellation: wine.appellation,
    grapes: [],             // static data doesn't carry a grapeVarietals array
    criticScore: wine.criticScore,
    price: wine.consumerPurchasePriceUSD,
    releaseStatus: 'AVAILABLE', // all static wines are currently available
    slug: wine.slug,
  }
}

// ── Producer context builder ───────────────────────────────────────────────
export function buildProducerContextFromSlug(slug: string): ProducerContext | null {
  const p = PRODUCERS.find((pr) => pr.slug === slug || pr.id === slug)
  if (!p) return null
  const signatureWines = WINES.filter((w) => w.producerId === p.id).map((w) => w.displayName)
  return {
    name: p.name,
    region: p.region,
    subregion: p.subregion,
    summary: p.summary,
    farmingMethod: p.farmingMethod,
    collection: p.collection,
    organicStatus: p.organicStatus,
    founded: p.founded,
    distinctive: p.distinctive,
    signatureWines,
  }
}

// ── Region context builder ─────────────────────────────────────────────────
export function buildRegionContextFromSlug(slug: string): RegionContext | null {
  const r = REGIONS[slug]
  if (!r) return null
  const regionProducers = PRODUCERS.filter((p) => p.regionSlug === slug)
  const portfolioWines = WINES.filter((w) =>
    regionProducers.some((p) => p.id === w.producerId),
  ).map((w) => w.displayName)
  return {
    name: r.name,
    subtitle: r.subtitle,
    description: r.description,
    grapes: r.grapes,
    climateNote: r.climateNote,
    portfolioFocus: r.portfolioFocus,
    portfolioProducers: regionProducers.map((p) => p.name),
    portfolioWines,
  }
}

// ── Context serialisers (for prompt injection) ────────────────────────────
export function serialiseWineContext(ctx: WineContext): string {
  const parts: string[] = [
    `[CURRENT WINE PAGE: "${ctx.name}" by ${ctx.producer}]`,
    `Type: ${ctx.type}`,
    ctx.appellation ? `Appellation: ${ctx.appellation}` : `Region: ${ctx.region}`,
  ]
  if (ctx.grapes && ctx.grapes.length > 0) parts.push(`Grapes: ${ctx.grapes.join(', ')}`)
  if (ctx.vintage) parts.push(`Vintage: ${ctx.vintage}`)
  if (ctx.criticScore) parts.push(`Critic score: ${ctx.criticScore}`)
  if (ctx.price) parts.push(`Consumer price: $${ctx.price.toFixed(0)}`)
  if (ctx.releaseStatus) parts.push(`Release status: ${releaseLabel(ctx.releaseStatus)}`)
  if (ctx.isLimitedAllocation) parts.push('Note: limited allocation wine')
  parts.push(`Description: ${ctx.description.slice(0, 220)}`)
  return parts.join('\n')
}

export function serialiseProducerContext(ctx: ProducerContext): string {
  const parts: string[] = [
    `[CURRENT PRODUCER PAGE: ${ctx.name}]`,
    `Region: ${[ctx.subregion, ctx.region].filter(Boolean).join(', ')}`,
  ]
  if (ctx.collection) parts.push(`Collection: ${ctx.collection === 'classical' ? 'Classical Selection' : 'Alternative & Next Generation'}`)
  if (ctx.organicStatus && ctx.organicStatus !== 'conventional') {
    parts.push(`Organic status: ${ctx.organicStatus === 'certified' ? 'Certified Organic' : 'Organically Inspired'}`)
  }
  if (ctx.founded) parts.push(`Founded: ${ctx.founded}`)
  if (ctx.farmingMethod) parts.push(`Farming: ${ctx.farmingMethod}`)
  if (ctx.distinctive) parts.push(`Distinctive: ${ctx.distinctive.slice(0, 180)}`)
  parts.push(`Summary: ${ctx.summary.slice(0, 220)}`)
  if (ctx.signatureWines && ctx.signatureWines.length > 0) {
    parts.push(`Wines in portfolio: ${ctx.signatureWines.join(', ')}`)
  }
  return parts.join('\n')
}

export function serialiseRegionContext(ctx: RegionContext): string {
  const parts: string[] = [
    `[CURRENT REGION PAGE: ${ctx.name} — ${ctx.subtitle}]`,
    `Grapes: ${ctx.grapes.join(', ')}`,
    `Climate: ${ctx.climateNote}`,
  ]
  if (ctx.portfolioProducers && ctx.portfolioProducers.length > 0) {
    parts.push(`Terra Trionfo producers here: ${ctx.portfolioProducers.join(', ')}`)
  }
  if (ctx.portfolioWines && ctx.portfolioWines.length > 0) {
    parts.push(`Portfolio wines from this region: ${ctx.portfolioWines.join(', ')}`)
  }
  parts.push(`Portfolio focus: ${ctx.portfolioFocus.join(' | ')}`)
  return parts.join('\n')
}

export function serialiseSessionPreferences(prefs: SessionPreferences): string {
  const parts: string[] = []
  if (prefs.preferredColor) parts.push(`User prefers: ${prefs.preferredColor} wines`)
  if (prefs.preferredStyle) parts.push(`Preferred style: ${prefs.preferredStyle}`)
  if (prefs.comparisonPoints && prefs.comparisonPoints.length > 0) {
    parts.push(`Familiar reference points: ${prefs.comparisonPoints.join(', ')}`)
  }
  if (prefs.foodContext) parts.push(`Recent food context: ${prefs.foodContext}`)
  if (prefs.priceRange) parts.push(`Price preference: ${prefs.priceRange}`)
  if (prefs.interestMode) parts.push(`Current interest: ${prefs.interestMode}`)
  if (parts.length === 0) return ''
  return `[SESSION PREFERENCES]\n${parts.join('\n')}`
}
