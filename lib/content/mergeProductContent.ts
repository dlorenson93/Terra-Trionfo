/**
 * mergeProductContent — DB-primary content merge for public product DTOs.
 *
 * DB fields always take precedence. Static wine data from wines.ts fills
 * editorial gaps (description, tasting notes, appellation) only when the
 * DB field is null/empty. Internal pricing layers are never exposed.
 */

import { WINES } from '@/data/wines'
import type { Wine } from '@/types/wine'

export interface PublicProductDTO {
  id: string
  name: string
  slug: string | null
  description: string | null
  imageUrl: string | null
  category: string
  /** Retail price in USD — derived from DB retailPriceCents; NEVER from static pricing layers. */
  retailPriceUSD: number
  company: {
    id: string
    name: string
    slug?: string | null
    region?: string | null
    country?: string | null
  }
  // Wine origin
  vintage: number | null
  appellation: string | null
  region: string | null
  grapeVarietals: string[]
  wineStyle: string | null
  // Sensory profile
  body: string | null
  acidity: string | null
  tannin: string | null
  abv: number | null
  tastingNotesShort: string | null
  tastingNotesFull: string | null
  aromaNotes: string | null
  palateNotes: string | null
  finishNotes: string | null
  // Serving
  servingTemperature: string | null
  decantingNotes: string | null
  foodPairings: string[]
  sustainabilityNotes: string | null
  // Commerce flags
  isLimitedAllocation: boolean
  isFeatured: boolean
  isFoundingWine: boolean
  contentStatus?: string
}

/**
 * Merge a DB product record with an optional static wine fallback.
 * DB is always primary. Static fields fill gaps only for editorial content.
 */
export function mergeProductContent(
  dbProduct: any,
  staticSlugHint?: string,
): PublicProductDTO {
  const slug = staticSlugHint ?? dbProduct.slug
  const staticWine: Wine | undefined = slug
    ? WINES.find((w) => w.slug === slug || w.id === slug)
    : undefined

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug ?? null,
    // DB description wins; fall back to static description only for editorial fill
    description: dbProduct.description || staticWine?.description || null,
    imageUrl: dbProduct.imageUrl ?? null,
    category: dbProduct.category,
    // DB retailPriceCents is the single source of truth for consumer pricing
    retailPriceUSD: dbProduct.retailPriceCents / 100,
    company: dbProduct.company ?? { id: '', name: '' },
    vintage: dbProduct.vintage ?? null,
    appellation: dbProduct.appellation || staticWine?.appellation || null,
    region: dbProduct.region || staticWine?.region || null,
    grapeVarietals: dbProduct.grapeVarietals?.length > 0 ? dbProduct.grapeVarietals : [],
    wineStyle: dbProduct.wineStyle ?? null,
    body: dbProduct.body ?? null,
    acidity: dbProduct.acidity ?? null,
    tannin: dbProduct.tannin ?? null,
    abv: dbProduct.abv ?? null,
    tastingNotesShort:
      dbProduct.tastingNotesShort ||
      staticWine?.description?.slice(0, 200) ||
      null,
    tastingNotesFull: dbProduct.tastingNotesFull ?? null,
    aromaNotes: dbProduct.aromaNotes ?? null,
    palateNotes: dbProduct.palateNotes ?? null,
    finishNotes: dbProduct.finishNotes ?? null,
    servingTemperature: dbProduct.servingTemperature ?? null,
    decantingNotes: dbProduct.decantingNotes ?? null,
    foodPairings: dbProduct.foodPairings?.length > 0 ? dbProduct.foodPairings : [],
    sustainabilityNotes: dbProduct.sustainabilityNotes ?? null,
    isLimitedAllocation: dbProduct.isLimitedAllocation ?? false,
    isFeatured: dbProduct.isFeatured ?? false,
    isFoundingWine: dbProduct.isFoundingWine ?? false,
    contentStatus: dbProduct.contentStatus,
  }
}
