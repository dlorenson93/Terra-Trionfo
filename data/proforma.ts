export interface ProformaEntry {
  producerId: string
  companySlug: string
  name: string
  vintage: number | null
  format: 'bottle' | 'can'
  bottleSizeMl: number
  quantity: number
  costEUR: number
}

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\bdocg?\b/gi, '')
    .replace(/[éèêë]/g, 'e')
    .replace(/[àáâä]/g, 'a')
    .replace(/[òóôö]/g, 'o')
    .replace(/ù/g, 'u')
    .replace(/œ/g, 'oe')
    .replace(/[’‘'`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const slugify = (value: string): string =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const generateProductSlug = (entry: ProformaEntry): string =>
  `${entry.companySlug}-${slugify(entry.name)}`

export const normalizeWineName = normalizeText

export const generateSKU = (entry: ProformaEntry): string => {
  const producer = entry.producerId.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const wine = entry.name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20)
  const vintageStr = entry.vintage ? entry.vintage.toString() : 'NV'
  const format = entry.bottleSizeMl.toString()
  return `TT-${producer}-${wine}-${vintageStr}-${format}`
}

export const PROFORMA_DATA: ProformaEntry[] = [
  { producerId: 'LAUTIN', companySlug: 'l-autin', name: 'El Bertu 2021', vintage: 2021, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 8.0 },
  { producerId: 'LAUTIN', companySlug: 'l-autin', name: 'Gemma Vitis (Bonarda) 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 5.6 },
  { producerId: 'LAUTIN', companySlug: 'l-autin', name: 'Re Nero (Pinot Nero) 2022', vintage: 2022, format: 'bottle', bottleSizeMl: 750, quantity: 360, costEUR: 8.5 },
  { producerId: 'LAUTIN', companySlug: 'l-autin', name: 'Le Ramie (Ramìe) 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 180, costEUR: 12.0 },
  { producerId: 'LAUTIN', companySlug: 'l-autin', name: 'Musca Bianca 2023', vintage: 2023, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.6 },

  { producerId: 'LANTIERI', companySlug: 'lantieri', name: 'Franciacorta Brut', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 12.5 },
  { producerId: 'LANTIERI', companySlug: 'lantieri', name: 'Franciacorta Satèn', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 14.2 },
  { producerId: 'LANTIERI', companySlug: 'lantieri', name: 'Franciacorta Rosé', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 14.2 },

  { producerId: 'FACCINELLI', companySlug: 'luca-faccinelli', name: 'Rosso di Valtellina 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 600, costEUR: 10.4 },
  { producerId: 'FACCINELLI', companySlug: 'luca-faccinelli', name: 'Grumello 2022', vintage: 2022, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 15.8 },
  { producerId: 'FACCINELLI', companySlug: 'luca-faccinelli', name: 'Grumello Riserva 2021', vintage: 2021, format: 'bottle', bottleSizeMl: 750, quantity: 120, costEUR: 23.5 },

  { producerId: 'RANDI', companySlug: 'randi', name: 'Blu di Burson', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.8 },
  { producerId: 'RANDI', companySlug: 'randi', name: 'Burson Selezione', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 8.9 },
  { producerId: 'RANDI', companySlug: 'randi', name: 'Skin Contact White', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 6.4 },

  { producerId: 'RANDI', companySlug: 'randi', name: 'Spritz 250ml', vintage: null, format: 'can', bottleSizeMl: 250, quantity: 7920, costEUR: 1.8 },
  { producerId: 'RANDI', companySlug: 'randi', name: 'Bianco 187ml', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', companySlug: 'randi', name: 'Rosso 187ml', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', companySlug: 'randi', name: 'Bianco Frizzante', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', companySlug: 'randi', name: 'Rosato Frizzante', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },

  { producerId: 'STROPP', companySlug: 'stroppiana', name: "Barbera d'Alba", vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 4.5 },
  { producerId: 'STROPP', companySlug: 'stroppiana', name: 'Barolo Leonardo', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 10.5 },
  { producerId: 'STROPP', companySlug: 'stroppiana', name: 'Barolo Bricco Cogni 2019', vintage: 2019, format: 'bottle', bottleSizeMl: 750, quantity: 420, costEUR: 13.0 },
  { producerId: 'STROPP', companySlug: 'stroppiana', name: 'Barolo Bussia', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 120, costEUR: 19.0 },

  { producerId: 'ZANOTELLI', companySlug: 'zanotelli', name: 'Kerner 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 7.1 },
  { producerId: 'ZANOTELLI', companySlug: 'zanotelli', name: 'Lagrein 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 7.3 },
  { producerId: 'ZANOTELLI', companySlug: 'zanotelli', name: 'Schiava 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.95 },
  { producerId: 'ZANOTELLI', companySlug: 'zanotelli', name: 'Riesling 2023', vintage: 2023, format: 'bottle', bottleSizeMl: 750, quantity: 6, costEUR: 0 },
]

export const PROFORMA_PRODUCT_SLUGS = PROFORMA_DATA.map(generateProductSlug)
export const PROFORMA_WINE_COUNT = PROFORMA_DATA.length
export const PROFORMA_COUNTS_BY_PRODUCER = PROFORMA_DATA.reduce<Record<string, number>>((acc, entry) => {
  acc[entry.producerId] = (acc[entry.producerId] ?? 0) + 1
  return acc
}, {})
