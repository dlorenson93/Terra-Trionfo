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

  // ── Pricing — acquisition cost (internal) ────────────────────────────
  /** EUR cost paid to producer — INTERNAL ONLY */
  internalWholesalePriceEUR: number

  // ── Derived pricing layers (computed by pricingEngine) ───────────────
  /** USD acquisition cost — INTERNAL ONLY */
  costUSD: number
  /** Terra Trionfo → Distributor sell price — INTERNAL ONLY */
  importerSellPriceUSD: number
  /** Estimated distributor wholesale — INTERNAL ONLY */
  distributorWholesalePriceUSD: number
  /** Estimated retail shelf price — INTERNAL ONLY */
  retailEstimatedPriceUSD: number
  /** Estimated restaurant bottle list price — INTERNAL ONLY */
  restaurantBottlePriceUSD: number
  /** PUBLIC marketplace price — the ONLY price shown to consumers */
  consumerPurchasePriceUSD: number

  colaWaiverStatus: ColaWaiverStatus
  tags: string[]
  importStatus: ImportStatus
  image: null
}
