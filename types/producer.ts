export type Collection = 'classical' | 'alternative-next-generation'

export type ColaWaiverStatus = 'available' | 'requested' | 'none'

export type OrganicStatus = 'certified' | 'inspired' | 'conventional'

export interface Producer {
  id: string
  slug: string
  name: string
  collection: Collection
  region: string
  subregion: string
  summary: string
  familyOwned: boolean
  organicStatus: OrganicStatus
  keywords: string[]
  colaWaiverStatus: ColaWaiverStatus
  /** Maps to an existing /regions/[slug] page when present */
  regionSlug?: string
  image: null

  // Importer context (for producer detail page)
  founded?: number
  farmingMethod?: string
  elevation?: string
  estateNotes?: string
  /** Why Terra Trionfo selected this estate */
  portfolioNote?: string
  /** Role the estate plays in the overall portfolio */
  portfolioRole?: string
  /** What makes this estate distinctive in the U.S. market */
  distinctive?: string
}
