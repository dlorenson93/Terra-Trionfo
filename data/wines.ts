import type { Wine } from '@/types/wine'
import { buildWinePricing } from '@/utils/pricingEngine'

/**
 * Enriches a raw wine record with all computed pricing tiers.
 * The only price consumers see is `consumerPurchasePriceUSD`.
 * All other layers are for internal / admin use.
 */
function w(
  base: Omit<
    Wine,
    | 'costUSD'
    | 'importerSellPriceUSD'
    | 'distributorWholesalePriceUSD'
    | 'retailEstimatedPriceUSD'
    | 'restaurantBottlePriceUSD'
    | 'consumerPurchasePriceUSD'
  >,
): Wine {
  return { ...base, ...buildWinePricing(base.internalWholesalePriceEUR) }
}

export const WINES: Wine[] = [
  // ── Stroppiana ────────────────────────────────────────────────────────
  w({
    id: 'stroppiana-barolo-leonardo',
    slug: 'stroppiana-barolo-leonardo',
    producerId: 'stroppiana',
    wineName: 'Barolo Leonardo',
    displayName: 'Stroppiana Barolo "Leonardo"',
    type: 'Red',
    appellation: 'Barolo DOCG',
    region: 'Piemonte',
    description:
      'From La Morra — the most aromatic and perfumed subzone of Barolo — this Nebbiolo opens with dried rose, violet, and wild cherry, deepening into iron, dried herb, and a mineral thread on a palate framed by firm but refined tannins. Lively acidity and a lingering finish give it the structure to reward 5–10 years of cellaring, while its elegant profile and accessible price make it equally suited to the by-the-glass programme today.',
    criticScore: '91+ James Suckling',
    internalWholesalePriceEUR: 11.5,
    colaWaiverStatus: 'available',
    tags: ['Barolo', 'Nebbiolo', 'By-the-Glass', 'La Morra', 'Structured'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'stroppiana-barbera-d-alba',
    slug: 'stroppiana-barbera-d-alba',
    producerId: 'stroppiana',
    wineName: "Barbera d'Alba",
    displayName: "Stroppiana Barbera d'Alba",
    type: 'Red',
    appellation: "Barbera d'Alba DOC",
    region: 'Piemonte',
    description:
      "Barbera d'Alba is Piemonte's everyday red — and in Stroppiana's hands it punches well above its price point. Bright natural acidity lifts ripe dark cherry and fresh plum, with a touch of oak integration that rounds the mid-palate without masking the grape's vivacity. Versatile enough for the glass programme and honest enough for the wine list alongside pasta, pizza, and charcuterie.",
    internalWholesalePriceEUR: 5.0,
    colaWaiverStatus: 'available',
    tags: ['Barbera', 'Value', 'Approachable', 'Versatile'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'stroppiana-barolo-bussia',
    slug: 'stroppiana-barolo-bussia',
    producerId: 'stroppiana',
    wineName: 'Barolo Bussia',
    displayName: 'Stroppiana Barolo Bussia',
    type: 'Red',
    appellation: 'Barolo Bussia Cru',
    region: 'Piemonte',
    description:
      "Bussia is one of the most celebrated crus in all of Barolo — a southeast-facing subzone in Monforte d'Alba prized for wines of density, depth, and uncommon longevity. This single-vineyard expression shows dried rose, tobacco, licorice, and dark cherry, with iron and tar minerality delivering the firm, gripping tannin structure that defines great Bussia. Best approached at 7–12 years; an essential cellar candidate at its price point, with 93-point recognition from James Suckling.",
    criticScore: '93 James Suckling',
    internalWholesalePriceEUR: 19.0,
    colaWaiverStatus: 'available',
    tags: ['Barolo', 'Single Vineyard', 'Bussia', 'Nebbiolo', 'Cellar Candidate', 'High Score'],
    importStatus: 'candidate',
    image: null,
  }),
  // ── Lantieri ──────────────────────────────────────────────────────────
  w({
    id: 'lantieri-franciacorta-brut',
    slug: 'lantieri-franciacorta-brut',
    producerId: 'lantieri',
    wineName: 'Franciacorta Brut',
    displayName: 'Lantieri Franciacorta Brut',
    type: 'Sparkling',
    appellation: 'Franciacorta DOCG',
    region: 'Lombardy',
    description:
      'Crafted from certified organic Chardonnay, Pinot Nero, and Pinot Bianco grown on the morainic glacier soils south of Lake Iseo, this Brut undergoes extended secondary fermentation in bottle — the same Méthode Champenoise as Champagne. The palate delivers green apple, white peach, citrus zest, and a brioche character from lees contact, with a fine, persistent perlage that separates serious Franciacorta from industrial Prosecco. One of Italy\'s most credible aperitif-to-table sparkling wines at a fraction of Champagne pricing.',
    internalWholesalePriceEUR: 15.5,
    colaWaiverStatus: 'available',
    tags: ['Sparkling', 'Franciacorta', 'Metodo Classico', 'Brut', 'Versatile'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'lantieri-franciacorta-saten',
    slug: 'lantieri-franciacorta-saten',
    producerId: 'lantieri',
    wineName: 'Franciacorta Satèn',
    displayName: 'Lantieri Franciacorta Satèn',
    type: 'Sparkling',
    appellation: 'Franciacorta DOCG',
    region: 'Lombardy',
    description:
      'Satèn is Franciacorta\'s most distinctive category — a Blanc de Blancs style produced exclusively from white varieties at reduced pressure, resulting in a uniquely soft, silky mousse unlike any other Italian sparkling wine. Lantieri\'s certified organic expression balances delicate white flower, lemon cream, ripe pear, and a gentle hazelnut note with a rounded, lingering finish shaped by extended time on the lees. The choice for guests who want Champagne quality and character without the Champagne price or the Prosecco compromise.',
    internalWholesalePriceEUR: 17.0,
    colaWaiverStatus: 'available',
    tags: ['Sparkling', 'Franciacorta', 'Blanc de Blancs', 'Satèn', 'Creamy'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'lantieri-franciacorta-brut-rose',
    slug: 'lantieri-franciacorta-brut-rose',
    producerId: 'lantieri',
    wineName: 'Franciacorta Brut Rosé',
    displayName: 'Lantieri Franciacorta Brut Rosé',
    type: 'Sparkling Rosé',
    appellation: 'Franciacorta DOCG',
    region: 'Lombardy',
    description:
      'Pinot Nero brings structure, colour, and depth to this certified organic Franciacorta Brut Rosé — showing wild strawberry, raspberry, and a cream note on the nose, with a clean, dry finish and fine persistent bubbles. The Pinot backbone gives it more presence and length than most Italian sparkling rosés, making it credible from aperitif through a full meal with delicate fish or charcuterie. Champagne-method quality and organic credentials at a price point that works on any programme.',
    internalWholesalePriceEUR: 17.0,
    colaWaiverStatus: 'available',
    tags: ['Sparkling', 'Rosé', 'Franciacorta', 'Pinot Noir'],
    importStatus: 'candidate',
    image: null,
  }),
  // ── Zanotelli ─────────────────────────────────────────────────────────
  w({
    id: 'zanotelli-pinot-grigio',
    slug: 'zanotelli-pinot-grigio',
    producerId: 'zanotelli',
    wineName: 'Pinot Grigio',
    displayName: 'Zanotelli Pinot Grigio',
    type: 'White',
    appellation: 'Alto Adige DOC',
    region: 'Trentino-Alto Adige',
    description:
      'This is alpine Pinot Grigio as it is meant to taste — shaped by Dolomite altitude and the cool mountain nights that preserve aromatic lift and vivid natural acidity, rather than the neutral mass-produced style that dominates the category. White pear, lemon zest, almond skin, and a stony mineral thread on the finish reflect the unique terroir of the South Tyrolean mountain valleys. One of the portfolio\'s most restaurant-ready whites: clean, versatile, and built to hold its position on a by-the-glass programme year-round.',
    internalWholesalePriceEUR: 8.2,
    colaWaiverStatus: 'requested',
    tags: ['White', 'Pinot Grigio', 'Alpine', 'Mineral', 'By-the-Glass'],
    importStatus: 'sample',
    image: null,
  }),
  w({
    id: 'zanotelli-kerner',
    slug: 'zanotelli-kerner',
    producerId: 'zanotelli',
    wineName: 'Kerner',
    displayName: 'Zanotelli Kerner',
    type: 'White',
    region: 'Trentino-Alto Adige',
    description:
      'Kerner is one of the Alto Adige\'s most expressive native varietals — a cross of Riesling and Trollinger cultivated exclusively at high alpine elevations where cool mountain air preserves aromatics that warmer climates simply cannot achieve. Zanotelli\'s expression delivers grapefruit zest, white peach, a precise floral lift, and a vivid mineral backbone that lingers long on the finish. Almost entirely absent from U.S. import lists at present, this is a genuine point-of-difference wine for sommeliers and wine-literate consumers who want something they haven\'t tasted before.',
    internalWholesalePriceEUR: 8.9,
    colaWaiverStatus: 'requested',
    tags: ['White', 'Kerner', 'Alpine', 'Native Varietal', 'Aperitif', 'Aromatic'],
    importStatus: 'sample',
    image: null,
  }),
  w({
    id: 'zanotelli-lagrein',
    slug: 'zanotelli-lagrein',
    producerId: 'zanotelli',
    wineName: 'Lagrein',
    displayName: 'Zanotelli Lagrein',
    type: 'Red',
    region: 'Trentino-Alto Adige',
    description:
      'Lagrein is indigenous to the Dolomite valleys of Alto Adige — a deeply coloured, soft red with dark berry fruit, a violet character, and naturally moderate tannins that allow it to be served lightly chilled, a feature very few Italian reds can offer. Grown at altitude on the Zanotelli family\'s high-elevation sites, this expression shows blackberry, plum, dried violet, and a clean savory finish that pairs naturally with charcuterie, grilled sausage, and hard cheeses. An ideal by-the-glass red for summer and early-autumn programmes where guests want something with presence but not weight.',
    internalWholesalePriceEUR: 9.2,
    colaWaiverStatus: 'requested',
    tags: ['Red', 'Lagrein', 'Alpine', 'By-the-Glass', 'Native Varietal', 'Chilled'],
    importStatus: 'sample',
    image: null,
  }),
  // ── Randi ─────────────────────────────────────────────────────────────
  w({
    id: 'randi-burson-blu',
    slug: 'randi-burson-blu',
    producerId: 'randi',
    wineName: 'Burson Blu',
    displayName: 'Randi Burson Blu',
    type: 'Red',
    region: 'Emilia-Romagna',
    description:
      'Burson is one of the rarest wine grapes on earth — a native varietal indigenous to the Romagna coast that survives in only a handful of certified organic vineyards, of which Randi is among the most committed. The entry-level Blu expression is deliberately bright and fruit-forward: fresh red cherry, plum, a violet note, and a clean, dry finish that makes it immediately approachable. An organic red of genuine discovery value, certified vegan, and priced to earn its place in the glass programme without compromise.',
    internalWholesalePriceEUR: 6.4,
    colaWaiverStatus: 'available',
    tags: ['Red', 'Burson', 'Native Varietal', 'Approachable', 'Organic', 'Fruit-Forward'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'randi-burson-selezione',
    slug: 'randi-burson-selezione',
    producerId: 'randi',
    wineName: 'Burson Selezione',
    displayName: 'Randi Burson Selezione',
    type: 'Red',
    region: 'Emilia-Romagna',
    description:
      'Burson Selezione takes the near-extinct native grape through a partial drying process — the same appassimento technique used in the production of Amarone — concentrating sugar, fruit intensity, and character while retaining the Adriatic coast\'s natural freshness. The result is a wine of real depth and a long finish: dried cherry, dark plum, cocoa, warm spice, and a concentration that dramatically outperforms its price point. Organic, vegan-certified, and singular in character — an Amarone-method wine from a grape most guests will have never encountered.',
    internalWholesalePriceEUR: 9.9,
    colaWaiverStatus: 'available',
    tags: ['Red', 'Burson', 'Appassimento', 'Structured', 'Native Varietal', 'Organic'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'randi-rambela-bianca',
    slug: 'randi-rambela-bianca',
    producerId: 'randi',
    wineName: 'Rambela Bianca',
    displayName: 'Randi Rambela Bianca',
    type: 'White',
    region: 'Emilia-Romagna',
    description:
      'Rambela Bianca is produced from a native Adriatic coast white varietal — semi-aromatic on the nose but emphatically dry on the palate — with pear blossom, citrus zest, and a coastal mineral salinity that reflects the estate\'s proximity to the sea. Certified organic and vegan-certified, with naturally low alcohol, this is a genuinely food-versatile white that holds alongside grilled fish, squid, seasonal vegetables, and light seafood pastas. An honest, terroir-driven white at an entry price that rewards the curious guest.',
    internalWholesalePriceEUR: 5.6,
    colaWaiverStatus: 'available',
    tags: ['White', 'Dry', 'Aromatic', 'Food-Friendly', 'Organic', 'Native Varietal'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'randi-organic-canned-white',
    slug: 'randi-organic-canned-white',
    producerId: 'randi',
    wineName: 'Organic Canned White',
    displayName: 'Randi Organic Canned White (200 ml)',
    type: 'White',
    region: 'Emilia-Romagna',
    description:
      'Bright, clean, and dry — this certified organic still white from the Adriatic coast comes in a 200 ml can designed for on-trade by-the-glass service, events, and venues where open bottles create waste and inconsistency. Citrus, white pear, and a light mineral freshness on the palate; one can delivers a single generous pour with zero compromise on organic credentials. The most waste-efficient format in the portfolio for high-volume aperitif and casual service occasions.',
    internalWholesalePriceEUR: 1.98,
    colaWaiverStatus: 'available',
    tags: ['White', 'Canned', 'Organic', '200ml', 'On-Trade'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'randi-organic-canned-red',
    slug: 'randi-organic-canned-red',
    producerId: 'randi',
    wineName: 'Organic Canned Red',
    displayName: 'Randi Organic Canned Red (200 ml)',
    type: 'Red',
    region: 'Emilia-Romagna',
    description:
      'Sourced from certified organic Sangiovese vines on the Adriatic coast, this canned red is light-bodied, fruit-forward, and built for easy drinking: red cherry, fresh plum, a touch of earthiness, and a clean, approachable finish. The 200 ml format serves a single glass with zero open-bottle waste, making it the practical on-trade solution for events, outdoor dining, festivals, and casual service where bottle format creates logistical problems. Certified organic, vegan-certified, and priced for volume placement.',
    internalWholesalePriceEUR: 1.98,
    colaWaiverStatus: 'available',
    tags: ['Red', 'Canned', 'Organic', '200ml', 'On-Trade'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'randi-organic-canned-sparkling-white',
    slug: 'randi-organic-canned-sparkling-white',
    producerId: 'randi',
    wineName: 'Organic Canned Sparkling White',
    displayName: 'Randi Organic Canned Sparkling White (200 ml)',
    type: 'Sparkling',
    region: 'Emilia-Romagna',
    description:
      'A certified organic sparkling white in a 200 ml can — fresh, dry, and lively, with citrus and green apple character, a fine effervescence, and the clean Adriatic terroir that defines the Randi estate. Available in a format no other producer in the portfolio offers, this is the aperitif solution for events, hotel programmes, and outdoor service environments where glass or bottle service is not practical. Organic, vegan-certified, and built for the high-volume occasions the fine wine bottle cannot serve.',
    internalWholesalePriceEUR: 1.98,
    colaWaiverStatus: 'available',
    tags: ['Sparkling', 'White', 'Canned', 'Organic', '200ml', 'Aperitif'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'randi-organic-canned-sparkling-rose',
    slug: 'randi-organic-canned-sparkling-rose',
    producerId: 'randi',
    wineName: 'Organic Canned Sparkling Rosé',
    displayName: 'Randi Organic Canned Sparkling Rosé (200 ml)',
    type: 'Sparkling Rosé',
    region: 'Emilia-Romagna',
    description:
      'Bright pink and organically certified, this 200 ml sparkling rosé in can format is the event wine the standard portfolio has been missing — fresh wild strawberry, a fine persistent mousse, and a clean dry finish that holds its character from aperitif through the meal. The format eliminates open-bottle waste in high-turnover service environments; the Randi organic and vegan certifications give it a story that resonates across multiple consumer segments. Lowest per-unit cost in the sparkling category with the widest occasion flexibility in the portfolio.',
    internalWholesalePriceEUR: 1.98,
    colaWaiverStatus: 'available',
    tags: ['Sparkling', 'Rosé', 'Canned', 'Organic', '200ml'],
    importStatus: 'candidate',
    image: null,
  }),
  // ── Luca Faccinelli ───────────────────────────────────────────────────
  w({
    id: 'luca-faccinelli-valtellina-rosso',
    slug: 'luca-faccinelli-valtellina-rosso',
    producerId: 'luca-faccinelli',
    wineName: 'Valtellina Rosso',
    displayName: 'Luca Faccinelli Valtellina Rosso',
    type: 'Red',
    appellation: 'Valtellina DOC',
    region: 'Lombardy',
    description:
      'Chiavennasca is the local name for Nebbiolo in Valtellina — and at 400–800 metres on steep granite terraces above the Adda River, the grape expresses itself in a way that Barolo never can: lighter in body, more aromatic, more mineral, and dramatically more food-flexible. Red cherry, alpine herb, dried rose, and a stony granite minerality on the finish define this expression, with the freshness and lower alcohol that altitude delivers. Almost entirely absent from U.S. import portfolios — a genuine sommelier discovery wine at an accessible price.',
    internalWholesalePriceEUR: 11.7,
    colaWaiverStatus: 'requested',
    tags: ['Red', 'Nebbiolo', 'Valtellina', 'Alpine', 'Mineral', 'Elegant'],
    importStatus: 'sample',
    image: null,
  }),
  w({
    id: 'luca-faccinelli-valtellina-superiore',
    slug: 'luca-faccinelli-valtellina-superiore',
    producerId: 'luca-faccinelli',
    wineName: 'Valtellina Superiore',
    displayName: 'Luca Faccinelli Valtellina Superiore',
    type: 'Red',
    appellation: 'Valtellina Superiore DOCG',
    region: 'Lombardy',
    description:
      'From old-vine Chiavennasca grown on Valtellina\'s most demanding terraced slopes, this DOCG Superiore is the most structured and age-worthy wine in the Faccinelli range — deeper colour, greater concentration, and a longer evolution on the palate than the Rosso. Dried cherry, iron, leather, dried alpine herb, and a stony mineral backbone come together over a fine, persistent tannin structure that warrants 5–8 years of patience. A wine of genuine Italian distinction that holds its own beside Barolo at half the price, with the added credential of hand-cultivated mountain viticulture almost no U.S. importer currently brings to market.',
    internalWholesalePriceEUR: 16.7,
    colaWaiverStatus: 'requested',
    tags: ['Red', 'Nebbiolo', 'Valtellina', 'Old Vine', 'Structured', 'Superiore'],
    importStatus: 'sample',
    image: null,
  }),
  // ── L'Autin ───────────────────────────────────────────────────────────
  w({
    id: 'l-autin-bonarda',
    slug: 'l-autin-bonarda',
    producerId: 'l-autin',
    wineName: 'Bonarda',
    displayName: "L'Autin Bonarda",
    type: 'Red',
    region: 'Piemonte Alps',
    description:
      'Bonarda near Mount Monviso is produced by an ancient method of secondary fermentation that has defined alpine red wine culture in this corner of the Piemonte Alps for centuries — low in alcohol, lightly frizzante, deeply coloured, and built to be enjoyed cool. L\'Autin\'s certified organic expression delivers fresh dark cherry, blackberry, wild violet, and a vivid frizzante texture that makes it ideal at the aperitif hour alongside cured meats and young cheeses. A vivid departure from the serious structured reds that dominate the Piemonte narrative, and one of the most accessible and crowd-pleasing wines in the portfolio.',
    internalWholesalePriceEUR: 7.0,
    colaWaiverStatus: 'available',
    tags: ['Red', 'Bonarda', 'Lightly Sparkling', 'Low Alcohol', 'Aperitif', 'Alpine'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'l-autin-ramie',
    slug: 'l-autin-ramie',
    producerId: 'l-autin',
    wineName: 'Ramìe',
    displayName: "L'Autin Ramìe",
    type: 'Red',
    region: 'Piemonte Alps',
    description:
      'Ramìe is one of the rarest indigenous grapes in all of Piemonte — a near-extinct alpine variety cultivated on the high-altitude mineral soils below Mount Monviso, where certified organic farming and severe terrain shape wines of stark individuality that simply cannot be replicated anywhere else in Italy. L\'Autin\'s expression is medium-bodied and poised: dried alpine herb, red cherry, a floral lift, and an earthy mineral character that speaks only of ancient, rare-breed viticulture at altitude. For wine-literate accounts and sommeliers who prioritise genuine rarity, provenance, and the story no other importer currently brings to their market.',
    internalWholesalePriceEUR: 15.0,
    colaWaiverStatus: 'available',
    tags: ['Red', 'Alpine', 'Historic Varietal', 'Mount Monviso', 'Organic'],
    importStatus: 'candidate',
    image: null,
  }),
  w({
    id: 'l-autin-timorasso',
    slug: 'l-autin-timorasso',
    producerId: 'l-autin',
    wineName: 'Timorasso',
    displayName: "L'Autin Timorasso",
    type: 'White',
    region: 'Piemonte Alps',
    description:
      'Timorasso is Piemonte\'s most compelling native white — a grape capable of producing structured, textured wines of real depth and aging potential, for decades overlooked in favour of international varieties, and now being rediscovered by sommeliers across Italy and beyond. L\'Autin\'s certified organic expression from Mount Monviso altitude shows ripe pear, hazelnut, white mineral, and a lanolin richness on the palate, with an unusually long and saline finish that rewards the table rather than the aperitif. One of the most compelling Italian whites entering the U.S. market — essential for fine dining programmes, serious collectors, and any account building a credible Italian white wine narrative.',
    internalWholesalePriceEUR: 10.0,
    colaWaiverStatus: 'available',
    tags: ['White', 'Timorasso', 'Structured', 'Alpine', 'Aging Potential', 'Organic'],
    importStatus: 'candidate',
    image: null,
  }),
]

export function getWine(slug: string): Wine | undefined {
  return WINES.find((w) => w.slug === slug)
}

export function getProducerWines(producerId: string): Wine[] {
  return WINES.filter((w) => w.producerId === producerId)
}
