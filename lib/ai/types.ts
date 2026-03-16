// ── Release status ─────────────────────────────────────────────────────────
export type ReleaseStatus = 'UPCOMING' | 'AVAILABLE' | 'ALLOCATED' | 'SOLD_OUT' | 'ARCHIVED'

// ── Page type — tells the AI where the user is ─────────────────────────────
export type PageType = 'wine' | 'producer' | 'region' | 'global'

// ── Session-scoped preference memory ───────────────────────────────────────
export interface SessionPreferences {
  preferredColor?: 'red' | 'white' | 'sparkling' | 'rosé'
  preferredStyle?: string          // e.g. "lighter reds", "structured whites"
  comparisonPoints?: string[]      // e.g. ['Burgundy', 'Champagne']
  foodContext?: string             // last mentioned food
  priceRange?: 'approachable' | 'mid' | 'premium'
  interestMode?: 'discovery' | 'pairing' | 'learning' | 'buying'
}

// ── Page-specific context objects ──────────────────────────────────────────
export interface WineContext {
  name: string
  producer: string
  region: string
  type: string
  description: string
  appellation?: string
  grapes?: string[]
  vintage?: number | null
  criticScore?: string
  price?: number
  releaseStatus?: ReleaseStatus
  isLimitedAllocation?: boolean
  slug?: string
}

export interface RegionContext {
  name: string
  subtitle: string
  description: string
  grapes: string[]
  climateNote: string
  portfolioFocus: string[]
  portfolioProducers?: string[]    // producer names in this region
  portfolioWines?: string[]        // wine display names in this region
}

export interface ProducerContext {
  name: string
  region: string
  subregion?: string
  summary: string
  farmingMethod?: string
  collection?: string
  organicStatus?: string
  founded?: number
  distinctive?: string
  signatureWines?: string[]        // display names of this producer's wines
}

// ── Request ────────────────────────────────────────────────────────────────
export interface SommelierRequest {
  question: string
  pageType?: PageType
  wineContext?: WineContext
  regionContext?: RegionContext
  producerContext?: ProducerContext
  sessionPreferences?: SessionPreferences
}

// ── Structured response ───────────────────────────────────────────────────
export interface SuggestedWine {
  id: string
  displayName: string
  type: string
  region: string
  price: number
  slug: string
}

export interface SuggestedProducer {
  id: string
  name: string
  region: string
  slug: string
}

export interface RecommendationCard {
  name: string
  slug?: string
  producer?: string
  reason?: string
}

export interface SommelierResponse {
  answer: string
  primaryRecommendation?: RecommendationCard
  secondaryRecommendations?: RecommendationCard[]
  followUpPrompts?: string[]
  suggestedWines?: SuggestedWine[]
  suggestedProducers?: SuggestedProducer[]
  error?: string
}
