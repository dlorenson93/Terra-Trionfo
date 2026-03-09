export interface RegionData {
  slug: string
  name: string
  subtitle: string
  heroLine: string
  description: string
  appellations: string[]
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
    heroLine: 'The kingdom of Nebbiolo — Barolo, Barbaresco, and alpine terroir.',
    description:
      "Nestled at the foot of the Alps, Piedmont is home to some of Italy's most celebrated appellations. The Langhe hills cultivate Nebbiolo into Barolo and Barbaresco, wines of uncommon structure and longevity. Barbera d'Asti brings generosity; Moscato d'Asti, delicacy. Truffle country, slow fermentation, and a deep tradition of cellaring define the Piemontese ethos.",
    appellations: ["Barolo DOCG", "Barbaresco DOCG", "Barbera d'Asti DOC", "Moscato d'Asti DOCG", "Gavi DOCG", "Dolcetto d'Alba DOC"],
    grapes: ['Nebbiolo', 'Barbera', 'Dolcetto', 'Moscato Bianco', 'Cortese'],
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
    heroLine: 'Sangiovese country — Chianti, Brunello, and the Bolgheri coast.',
    description:
      "Tuscany defines Italian wine for much of the world. The Sangiovese grape, expressed through an extraordinary range of soils and elevations, yields wines from the structured grandeur of Brunello di Montalcino to the vivid acidity of Chianti Classico. The Bolgheri coast introduced the Supertuscans — Cabernet and Merlot-driven blends that rewrote the international handbook. Ancient hilltop estates, olive groves, and Renaissance landscapes complete the story.",
    appellations: ['Chianti Classico DOCG', 'Brunello di Montalcino DOCG', 'Vino Nobile di Montepulciano DOCG', 'Bolgheri DOC', 'Morellino di Scansano DOC', 'Vernaccia di San Gimignano DOCG'],
    grapes: ['Sangiovese', 'Cabernet Sauvignon', 'Merlot', 'Vernaccia', 'Trebbiano Toscano'],
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
    heroLine: "From Amarone's dried-grape intensity to the volcanic minerality of Soave.",
    description:
      "The Veneto is Italy's most prolific wine region, yet quality and variety are everywhere. The Valpolicella zone produces Amarone della Valpolicella — one of the world's great red wines — through the appassimento technique of drying harvested grapes before pressing. The Soave hills, with their volcanic basalt soils, yield whites of subtle mineral depth. Prosecco, produced across a sweep of hillside vineyards in Conegliano-Valdobbiadene, has become an emblem of Italian conviviality.",
    appellations: ['Amarone della Valpolicella DOCG', 'Valpolicella DOC', 'Soave Classico DOC', 'Prosecco di Valdobbiadene DOCG', 'Bardolino DOC', 'Ripasso Valpolicella DOC'],
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
      'Alto Adige (Südtirol) sits at the crossroads of Italian and Tyrolean culture, producing wines of remarkable intensity and finesse at vineyard elevations between 200 and 900 meters. The extreme diurnal temperature range — warm days, cold nights — locks in aromatics and acidity. This region is most celebrated for its Pinot Bianco, Gewürztraminer, and Pinot Nero, though Lagrein — a dark, inky, native red — offers something entirely unique.',
    appellations: ['Alto Adige DOC / Südtirol DOC', 'Santa Maddalena DOC', 'Terlano DOC', 'Valle Isarco DOC'],
    grapes: ['Pinot Bianco', 'Pinot Grigio', 'Gewürztraminer', 'Pinot Nero', 'Lagrein', 'Schiava'],
    climateNote: 'Alpine continental — high altitude and large diurnal shifts produce wines of exceptional aromatic clarity.',
    dbKeywords: ['alto adige', 'südtirol', 'south tyrol', 'trentino', 'bolzano'],
    mapCoordinates: [11.3, 46.6],
    lat: 46.6,
    lng: 11.3,
  },
}

export const REGION_LIST: RegionData[] = Object.values(REGIONS)
