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
}

export interface RegionContext {
  name: string
  subtitle: string
  description: string
  grapes: string[]
  climateNote: string
  portfolioFocus: string[]
}

export interface ProducerContext {
  name: string
  region: string
  subregion?: string
  summary: string
  farmingMethod?: string
}

export interface SommelierRequest {
  question: string
  wineContext?: WineContext
  regionContext?: RegionContext
  producerContext?: ProducerContext
}

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

export interface SommelierResponse {
  answer: string
  suggestedWines?: SuggestedWine[]
  suggestedProducers?: SuggestedProducer[]
  error?: string
}
