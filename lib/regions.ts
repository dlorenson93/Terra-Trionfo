export interface RegionData {
  slug: string
  name: string
  subtitle: string
  heroLine: string
  description: string
  /** Portfolio focus bullets — what Terra Trionfo values from this region */
  portfolioFocus: string[]
  grapes: string[]
  climateNote: string
  /** Keywords matched against company.region (case-insensitive) */
  dbKeywords: string[]
  /**
   * Map coordinates in react-simple-maps [longitude, latitude] order.
   * Approximate centroid of the wine zone (not the administrative capital).
   */
  mapCoordinates: [number, number]
  /** Latitude for other uses */
  lat: number
  /** Longitude for other uses */
  lng: number
}

export const REGIONS: Record<string, RegionData> = {
  piedmont: {
    slug: 'piedmont',
    name: 'Piedmont',
    subtitle: 'Il Piemonte',
    heroLine: 'The kingdom of Nebbiolo — structure, depth, and a deep tradition of cellaring.',
    description:
      "Piedmont sits at the foot of the Alps, where continental climate and hillside terroir shape wines of remarkable character and depth. Nebbiolo — the region's defining grape — produces wines of uncommon structure and aging potential. Barbera and Dolcetto offer freshness and food affinity at every occasion. The Langhe hills and Monferrato zone represent Italy's most compelling case for cellar-worthy reds alongside everyday drinking. Terra Trionfo's focus in Piemonte is on producers who honor the classical tradition while offering strong commercial positioning at their respective price points.",
    portfolioFocus: [
      'Nebbiolo-driven wines with structure, lift, and aging potential',
      'Fresh, food-oriented everyday reds from Barbera and Dolcetto',
      'Mineral northern whites that bring balance to the portfolio',
      'Classic and cellar-worthy wines that represent Piemonte\'s depth',
    ],
    grapes: ['Nebbiolo', 'Barbera', 'Dolcetto', 'Arneis', 'Cortese'],
    climateNote: 'Continental climate with Alpine influence — significant diurnal shifts preserve acidity and aromatic precision.',
    dbKeywords: ['piedmont', 'piemonte', 'langhe', 'monferrato'],
    mapCoordinates: [7.9, 44.6],
    lat: 44.6,
    lng: 7.9,
  },
  tuscany: {
    slug: 'tuscany',
    name: 'Tuscany',
    subtitle: 'La Toscana',
    heroLine: 'Sangiovese country — structure, character, and centuries of hillside winemaking.',
    description:
      "Tuscany has shaped the image of Italian wine for generations, and Sangiovese — in all its regional expression — remains its defining voice. From elevated hillside zones with cool breezes and volcanic soils to the warmer coastal plains, the region rewards those who look beyond the familiar labels. Terra Trionfo values Tuscany for its depth of character, food affinity, and the broad stylistic range it offers — from elegant, medium-bodied reds to richer coastal expressions. The classical tradition and its modern evolution both have a place in the portfolio framework.",
    portfolioFocus: [
      'Sangiovese-led wines with acidity, elegance, and regional identity',
      'Classic hillside expressions with savory depth and food affinity',
      'Coastal Tuscan styles offering richer structure and Mediterranean character',
      'Traditional and modern interpretations of Tuscan winemaking',
    ],
    grapes: ['Sangiovese', 'Canaiolo', 'Cabernet Sauvignon', 'Merlot', 'Vermentino'],
    climateNote: 'Warm Mediterranean tendencies moderated by maritime breezes along the coast and altitude inland.',
    dbKeywords: ['tuscany', 'toscana', 'chianti', 'montalcino', 'bolgheri', 'montepulciano'],
    mapCoordinates: [11.2, 43.5],
    lat: 43.5,
    lng: 11.2,
  },
  veneto: {
    slug: 'veneto',
    name: 'Veneto',
    subtitle: 'Il Veneto',
    heroLine: 'A region of real range — from mineral whites and bright reds to dried-grape depth.',
    description:
      "The Veneto encompasses some of Italy's most distinctive stylistic contrasts — volcanic whites from hillside vineyards, the bright, food-friendly reds of the Valpolicella zone, and rich, concentrated wines crafted through the dried-grape appassimento tradition. Lake Garda moderates the western zones; the Dolomites shape alpine character in the north. Terra Trionfo looks at Veneto as a region of genuine range — from aperitivo-ready sparkling wines to structured, cellar-worthy reds that illustrate the depth of the Italian northeast.",
    portfolioFocus: [
      'Soave-inspired whites with freshness, almond notes, and mineral clarity',
      'Valpolicella-family reds with bright fruit and balance',
      'Structured dried-grape traditions that illustrate Veneto\'s richer side',
      'Sparkling and still wines that reflect the region\'s broad stylistic range',
    ],
    grapes: ['Corvina', 'Rondinella', 'Garganega', 'Glera', 'Pinot Grigio'],
    climateNote: 'Varied — Lake Garda moderates temperatures in the west; the Dolomites shape alpine conditions in the north.',
    dbKeywords: ['veneto', 'valpolicella', 'amarone', 'soave', 'valdobbiadene'],
    mapCoordinates: [11.5, 45.3],
    lat: 45.3,
    lng: 11.5,
  },
  'alto-adige': {
    slug: 'alto-adige',
    name: 'Alto Adige',
    subtitle: 'Südtirol',
    heroLine: 'Alpine precision — cool-climate whites and elegant reds at the northern limit.',
    description:
      "Alto Adige — known in German as Südtirol — sits at Italy's alpine northern boundary, producing wines that carry the precision and aromatic clarity of the mountains. Vineyard elevations between 200 and 900 meters, combined with dramatic diurnal temperature shifts, preserve vivid acidity and fragrance across both white and red varieties. The region is home to some of Italy's most compelling terroir-driven whites, alongside elegant, lighter reds shaped by altitude. Terra Trionfo's focus here is on producers whose wines reflect the alpine character of this unique cultural and viticultural crossroads.",
    portfolioFocus: [
      'Alpine whites with precision, minerality, and aromatic lift',
      'Mountain-grown reds with freshness and elegance',
      'High-elevation wines shaped by dramatic temperature shifts',
      'Native and international varieties expressed through alpine terroir',
    ],
    grapes: ['Pinot Bianco', 'Pinot Grigio', 'Gewürztraminer', 'Pinot Nero', 'Lagrein', 'Schiava'],
    climateNote: 'Alpine continental — high altitude and large diurnal shifts produce wines of exceptional aromatic clarity.',
    dbKeywords: ['alto adige', 'südtirol', 'south tyrol', 'trentino', 'bolzano'],
    mapCoordinates: [11.3, 46.6],
    lat: 46.6,
    lng: 11.3,
  },
}

export const REGION_LIST: RegionData[] = Object.values(REGIONS)
