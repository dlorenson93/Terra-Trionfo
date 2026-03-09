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
}
