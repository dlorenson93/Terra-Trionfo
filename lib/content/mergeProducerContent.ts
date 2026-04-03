/**
 * mergeProducerContent — DB-primary content merge for public producer DTOs.
 *
 * DB fields always take precedence. Static producer data from producers.ts fills
 * editorial gaps (bio, story, farming method, distinctive note) only when the
 * DB field is null/empty.
 */

import { PRODUCERS } from '@/data/producers'
import type { Producer } from '@/types/producer'

export interface PublicProducerDTO {
  id: string
  name: string
  slug: string | null
  region: string | null
  subregion: string | null
  country: string | null
  bio: string | null
  shortDescription: string | null
  story: string | null
  website: string | null
  heroImageUrl: string | null
  foundedYear: number | null
  winemakerName: string | null
  sustainablePractices: string | null
  isFoundingProducer: boolean
  /** What makes this estate distinctive in the U.S. market — editorial copy. */
  distinctiveNote: string | null
  /** Portfolio role / why Terra Trionfo selected this estate. */
  portfolioNote: string | null
}

/**
 * Merge a DB company record with an optional static producer fallback.
 * DB is always primary. Static fields fill editorial gaps only.
 */
export function mergeProducerContent(
  dbCompany: any,
  staticSlugHint?: string,
): PublicProducerDTO {
  const slug = staticSlugHint ?? dbCompany.slug
  const staticProducer: Producer | undefined = slug
    ? PRODUCERS.find((p) => p.slug === slug || p.id === slug)
    : undefined

  return {
    id: dbCompany.id,
    name: dbCompany.name,
    slug: dbCompany.slug ?? null,
    region: dbCompany.region ?? staticProducer?.region ?? null,
    subregion: dbCompany.subregion ?? staticProducer?.subregion ?? null,
    country: dbCompany.country ?? null,
    // Bio: DB wins; static estateNotes or summary as editorial fallback
    bio:
      dbCompany.bio ||
      dbCompany.description ||
      staticProducer?.estateNotes ||
      staticProducer?.summary ||
      null,
    shortDescription:
      dbCompany.shortDescription ||
      (staticProducer?.summary ? staticProducer.summary.slice(0, 200) : null),
    story: dbCompany.story || staticProducer?.portfolioNote || null,
    website: dbCompany.website ?? null,
    heroImageUrl: dbCompany.heroImageUrl ?? null,
    foundedYear: dbCompany.foundedYear ?? staticProducer?.founded ?? null,
    winemakerName: dbCompany.winemakerName ?? null,
    sustainablePractices:
      dbCompany.sustainablePractices ?? staticProducer?.farmingMethod ?? null,
    isFoundingProducer: dbCompany.isFoundingProducer ?? false,
    distinctiveNote: staticProducer?.distinctive ?? null,
    portfolioNote: staticProducer?.portfolioNote ?? null,
  }
}

/**
 * Build a PublicProducerDTO from static data only (no DB record).
 * Used as fallback when DB has no matching company.
 */
export function mergeProducerContentFromStatic(
  staticProducer: Producer,
): PublicProducerDTO {
  return {
    id: staticProducer.id,
    name: staticProducer.name,
    slug: staticProducer.slug,
    region: staticProducer.region,
    subregion: staticProducer.subregion,
    country: null,
    bio: staticProducer.estateNotes ?? staticProducer.summary,
    shortDescription: staticProducer.summary.slice(0, 200),
    story: staticProducer.portfolioNote ?? null,
    website: null,
    heroImageUrl: null,
    foundedYear: staticProducer.founded ?? null,
    winemakerName: null,
    sustainablePractices: staticProducer.farmingMethod ?? null,
    isFoundingProducer: false,
    distinctiveNote: staticProducer.distinctive ?? null,
    portfolioNote: staticProducer.portfolioNote ?? null,
  }
}
