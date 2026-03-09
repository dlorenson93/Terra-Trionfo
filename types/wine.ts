import type { ColaWaiverStatus } from './producer'

export type WineType = 'Red' | 'White' | 'Sparkling' | 'Sparkling Rosé' | 'Rosé'

export type ImportStatus = 'candidate' | 'sample' | 'ordered'

export interface Wine {
  id: string
  slug: string
  producerId: string
  wineName: string
  displayName: string
  type: WineType
  appellation?: string
  region: string
  description: string
  criticScore?: string
  internalWholesalePriceEUR: number
  colaWaiverStatus: ColaWaiverStatus
  tags: string[]
  importStatus: ImportStatus
  image: null
}
