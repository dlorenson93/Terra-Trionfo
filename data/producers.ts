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
      'Family-owned estate based in La Morra with vineyards also in Bussia and Verduno. Practicing sustainable, organically inspired viticulture, Stroppiana consistently earns high critic scores and offers strong positioning across the Barolo appellation.',
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
    founded: 1929,
    farmingMethod: 'Sustainable viticulture, no synthetic herbicides',
    elevation: '150–400 m',
    estateNotes:
      'Three-site family estate spanning La Morra, the Bussia cru, and the rarely exported Verduno subzone — capturing the full range of Barolo expression across three of Piemonte\'s most distinctive terroirs within a single producer relationship.',
    portfolioNote:
      'Stroppiana anchors the classical red wine narrative. With DOCG pricing that still works for on-trade programs and critic scores above 91 points, this estate gives the portfolio a credible, accessible Barolo story without requiring rarefied allocations.',
    portfolioRole: 'Anchor Barolo estate — on-trade programs, collector introductions, and the classical red centerpiece',
    distinctive:
      'Multi-vineyard coverage captures La Morra elegance, Bussia depth, and the rare Verduno expression — three distinct Barolo characters in one estate relationship, across a meaningful price range.',
  },
  {
    id: 'lantieri',
    slug: 'lantieri',
    name: 'Lantieri',
    collection: 'classical',
    region: 'Lombardy',
    subregion: 'Franciacorta',
    summary:
      "Fourth-generation family estate at the heart of Franciacorta — Italy's most serious traditional-method sparkling wine appellation. Certified organic since 2002, with Tre Bicchieri award recognition and a complete range from Brut to Satèn and Rosé.",
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
    regionSlug: 'lombardy',
    image: null,
    elevation: '200–250 m',
    estateNotes:
      'Fourth-generation estate producing certified organic Franciacorta DOCG from Chardonnay, Pinot Nero, and Pinot Bianco grown on morainic glacier soils. One of the few organic Franciacorta estates with Tre Bicchieri recognition.',
    portfolioNote:
      'Lantieri fills the sparkling category with organically certified Franciacorta at pricing that works for both on-trade programs and direct-to-consumer. The organic certification and award track record provide quality credibility typically reserved for far higher price points.',
    portfolioRole: 'Sparkling anchor — premium Italian Metodo Classico positioned between Prosecco entry and top-tier Champagne',
    distinctive:
      'Certified organic across all three classical Franciacorta expressions (Brut, Satèn, and Rosé), with consistent Tre Bicchieri award recognition and fourth-generation family continuity.',
  },
  {
    id: 'zanotelli',
    slug: 'zanotelli',
    name: 'Zanotelli',
    collection: 'classical',
    region: 'Trentino-Alto Adige',
    subregion: 'Dolomites',
    summary:
      'Family-owned winery producing mineral-driven alpine wines from high-altitude Dolomite vineyards. Specialises in native varietals — Kerner and Lagrein — that express the precision and freshness of mountain viticulture.',
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
    founded: 1962,
    farmingMethod: 'Conventional with low intervention, minimal treatments',
    elevation: '300–600 m',
    estateNotes:
      'Family-run alpine estate producing wines from cool, high-altitude vineyards in the Dolomites, where natural temperature variation between day and night preserves acidity and develops aromatic complexity.',
    portfolioNote:
      'Zanotelli fills a critical gap in the portfolio — high-quality alpine whites and a native red that restaurants can commit to year-round. The Kerner is especially differentiated in the U.S. market, where few importers currently offer native Alto Adige varietals.',
    portfolioRole: 'Alpine white and native red specialist — distinctive glass program wines for wine-list depth',
    distinctive:
      'Native varietal focus (Kerner, Lagrein, Pinot Grigio) from Dolomite altitude where few U.S. importers currently work, giving the portfolio wines with genuine point-of-difference on any wine list.',
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
      'Multi-generational certified organic estate on the Adriatic coast producing low-alcohol, vegan-certified wines from rare native varietals — including the nearly lost Burson grape — and a pioneering 200 ml canned wine range.',
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
    regionSlug: 'emilia-romagna',
    founded: 1978,
    farmingMethod: 'Certified organic, vegan certified, no fining agents',
    elevation: 'Sea level – 150 m',
    estateNotes:
      'Adriatic coast estate producing certified organic, vegan-certified wines from native varietals including the near-extinct Burson grape. The 200 ml canned wine format — across four expressions — serves aperitif, events, and on-trade occasions no other estate in the portfolio covers.',
    portfolioNote:
      'Randi provides the most accessible entry points and the broadest format range in the portfolio. Affordable, organic, and differentiated by Burson and the canned format, this estate reaches consumers and occasions that classical fine wine cannot serve.',
    portfolioRole: 'Value and innovation anchor — organic, native varietals, canned format, broadest price range in the portfolio',
    distinctive:
      'Only estate in the portfolio producing the nearly extinct Burson grape, with certified organic and vegan-certified production, and the sole 200 ml canned wine format for events, aperitif service, and casual on-trade.',
  },
  {
    id: 'luca-faccinelli',
    slug: 'luca-faccinelli',
    name: 'Luca Faccinelli',
    collection: 'alternative-next-generation',
    region: 'Lombardy',
    subregion: 'Valtellina',
    summary:
      'Small husband-and-wife winery working steep terraced vineyards in Valtellina — one of the most physically demanding wine regions in Europe — producing Nebbiolo (Chiavennasca) with alpine elegance, freshness, and structural restraint.',
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
    regionSlug: 'lombardy',
    founded: 2008,
    farmingMethod: 'Organically inspired, steep terraced cultivation by hand',
    elevation: '400–800 m',
    estateNotes:
      'Husband-and-wife estate cultivating terraced Nebbiolo (Chiavennasca) at altitude in Valtellina. Production is small and entirely hand-managed, with the steep inclines making mechanisation impossible.',
    portfolioNote:
      'Luca Faccinelli adds a second Nebbiolo narrative completely distinct from Stroppiana. Where Barolo is power and prestige, Valtellina Nebbiolo is altitude, freshness, and restraint — the sommelier\'s Nebbiolo, appealing to wine-literate consumers and on-trade buyers looking for the unexpected.',
    portfolioRole: 'Alpine Nebbiolo specialist — the sommelier counterpoint to Barolo in the portfolio',
    distinctive:
      'Steep terraced cultivation at altitude, small family production, and Valtellina\'s unique rendering of Nebbiolo with alpine minerality and naturally lower alcohol than Barolo — almost absent from the current U.S. import market.',
  },
  {
    id: 'l-autin',
    slug: 'l-autin',
    name: "L'Autin",
    collection: 'alternative-next-generation',
    region: 'Piemonte Alps',
    subregion: 'Mount Monviso',
    summary:
      'Women-led certified organic estate near Mount Monviso, producing wines from high-altitude mineral soils using native varietals — including Timorasso, Bonarda, and Ramìe — that are rarely found in the U.S. market.',
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
    founded: 2012,
    farmingMethod: 'Certified organic, biodynamically inspired',
    elevation: '600–900 m',
    estateNotes:
      'Women-led certified organic estate on the Piemonte Alps near Mount Monviso. Elisa Camusso produces Timorasso (a rare Piemontese white making a comeback), native Bonarda, and Ramìe — a historic alpine wine with almost no U.S. presence.',
    portfolioNote:
      "L'Autin represents the most artisan edge of the Terra Trionfo portfolio. A women-led, certified organic estate producing varieties most U.S. consumers have never encountered, it brings genuine discovery value and the kind of estate story that earns placement on thoughtful wine lists.",
    portfolioRole: 'Artisan organic specialist — women-led, native varietals, high-altitude alpine expression and discovery narrative',
    distinctive:
      'Only women-led estate in the portfolio; produces Timorasso and Ramìe — two varieties with almost no current U.S. market presence; certified organic above 600 m in the Piemonte Alps.',
  },
]

export function getProducer(slug: string): Producer | undefined {
  return PRODUCERS.find((p) => p.slug === slug)
}
