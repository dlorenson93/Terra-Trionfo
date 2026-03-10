import type { Producer } from '@/types/producer'

export const PRODUCERS: Producer[] = [
  // ── Classical Collection ─────────────────────────────────────────────
  {
    id: 'stroppiana',
    slug: 'stroppiana',
    name: 'Stroppiana',
    collection: 'classical',
    region: 'Piemonte',
    subregion: 'La Morra · Bussia · Verduno',
    summary:
      'Family-owned estate based in La Morra with vineyards also in Bussia and Verduno. The winery practices sustainable, organically inspired viticulture and has strong international presence across Italy, the United States, and Asia. Wines consistently receive high critic scores and offer strong positioning in the Barolo category.',
    familyOwned: true,
    organicStatus: 'inspired',
    keywords: [
      'Sustainable Viticulture',
      'Family-Owned',
      'Barolo District',
      'Native Varietals',
      'High Scores',
      'Strong Value Pricing',
    ],
    colaWaiverStatus: 'available',
    regionSlug: 'piedmont',
    image: null,
  },
  {
    id: 'lantieri',
    slug: 'lantieri',
    name: 'Lantieri',
    collection: 'classical',
    region: 'Lombardy',
    subregion: 'Franciacorta',
    summary:
      "Family-owned winery located in Franciacorta, Italy's premier traditional-method sparkling wine region. The wines offer excellent quality-to-price ratio and strong commercial appeal.",
    familyOwned: true,
    organicStatus: 'certified',
    keywords: [
      'Organic',
      'Franciacorta',
      'Family-Owned',
      'Tre Bicchieri Awards',
      'Strong Value',
    ],
    colaWaiverStatus: 'available',
    image: null,
  },
  {
    id: 'zanotelli',
    slug: 'zanotelli',
    name: 'Zanotelli',
    collection: 'classical',
    region: 'Trentino-Alto Adige',
    subregion: 'Dolomites',
    summary:
      'Family-owned winery producing mineral-driven alpine wines from high-altitude vineyards in the Italian Dolomites.',
    familyOwned: true,
    organicStatus: 'conventional',
    keywords: [
      'Alpine Viticulture',
      'Mineral Wines',
      'High Altitude Vineyards',
      'Family Led',
      'Native Varietals',
    ],
    colaWaiverStatus: 'requested',
    regionSlug: 'alto-adige',
    image: null,
  },
  // ── Alternative & Next Generation ────────────────────────────────────
  {
    id: 'randi',
    slug: 'randi',
    name: 'Randi',
    collection: 'alternative-next-generation',
    region: 'Emilia-Romagna',
    subregion: 'Adriatic Coast',
    summary:
      'Certified organic winery producing wines from native varietals with strong performance in national retail chains and private-label projects.',
    familyOwned: true,
    organicStatus: 'certified',
    keywords: [
      'Organic Certified',
      'Native Varietals',
      'Adriatic Influence',
      'Sustainable',
      'Vegan Certified',
      'Low Alcohol',
    ],
    colaWaiverStatus: 'available',
    image: null,
  },
  {
    id: 'luca-faccinelli',
    slug: 'luca-faccinelli',
    name: 'Luca Faccinelli',
    collection: 'alternative-next-generation',
    region: 'Lombardy',
    subregion: 'Valtellina',
    summary:
      'Small husband-and-wife winery producing alpine Nebbiolo from steep terraced vineyards with strong international critic recognition.',
    familyOwned: true,
    organicStatus: 'inspired',
    keywords: [
      'Alpine Viticulture',
      'Terraced Vineyards',
      'Nebbiolo',
      'High Altitude',
      'Sustainable',
    ],
    colaWaiverStatus: 'requested',
    image: null,
  },
  {
    id: 'l-autin',
    slug: 'l-autin',
    name: "L'Autin",
    collection: 'alternative-next-generation',
    region: 'Piemonte Alps',
    subregion: 'Mount Monviso',
    summary:
      'Certified organic winery led by winemaker Elisa Camusso, producing distinctive alpine wines from high-altitude vineyards.',
    familyOwned: true,
    organicStatus: 'certified',
    keywords: [
      'Organic Certified',
      'Women Led',
      'Alpine Viticulture',
      'Native Varietals',
      'High Mineral Soils',
    ],
    colaWaiverStatus: 'available',
    regionSlug: 'piedmont',
    image: null,
  },
]

export function getProducer(slug: string): Producer | undefined {
  return PRODUCERS.find((p) => p.slug === slug)
}
