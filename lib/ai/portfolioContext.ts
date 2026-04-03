import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'
import { REGION_LIST } from '@/lib/regions'
import { prisma } from '@/lib/prisma'

export function buildPortfolioContext(): string {
  const regionLines = REGION_LIST.map(
    (r) =>
      `${r.name} (${r.subtitle}): ${r.description.slice(0, 280)} Grapes: ${r.grapes.join(', ')}. Climate: ${r.climateNote}`,
  ).join('\n\n')

  const producerLines = PRODUCERS.map(
    (p) =>
      `${p.name} · ${p.region}${p.subregion ? ` (${p.subregion})` : ''}: ${p.summary}${p.farmingMethod ? ` Farming: ${p.farmingMethod}.` : ''}`,
  ).join('\n\n')

  const wineLines = WINES.map((w) => {
    const price = `$${w.consumerPurchasePriceUSD.toFixed(0)}`
    const score = w.criticScore ? ` | ${w.criticScore}` : ''
    const desc = w.description.slice(0, 180)
    return `• ${w.displayName} — ${w.type}, ${w.appellation || w.region}${score} | ${price}\n  ${desc}`
  }).join('\n')

  return `=== TERRA TRIONFO PORTFOLIO ===

── REGIONS ──
${regionLines}

── PRODUCERS ──
${producerLines}

── WINES ──
${wineLines}`.trim()
}

/**
 * Async DB-first portfolio context builder.
 * Queries live products and companies from DB.
 * Falls back to static buildPortfolioContext() if DB is empty or unreachable.
 *
 * SECURITY: Only consumer-facing fields are included. Internal pricing layers,
 * allocation counts, wholesale costs, and trade data are never exposed.
 */
export async function buildPortfolioContextFromDB(): Promise<string> {
  try {
    const [dbProducts, dbCompanies] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'APPROVED', contentStatus: 'LIVE' },
        include: {
          company: { select: { name: true, region: true, slug: true } },
        },
        orderBy: { name: 'asc' },
        take: 120,
      }),
      prisma.company.findMany({
        where: { status: 'APPROVED', contentStatus: 'LIVE' },
        orderBy: { name: 'asc' },
      }),
    ])

    // Fall back to static context if DB has no live content yet
    if (dbProducts.length === 0 && dbCompanies.length === 0) {
      return buildPortfolioContext()
    }

    const regionLines = REGION_LIST.map(
      (r) =>
        `${r.name} (${r.subtitle}): ${r.description.slice(0, 280)} Grapes: ${r.grapes.join(', ')}. Climate: ${r.climateNote}`,
    ).join('\n\n')

    const producerLines =
      dbCompanies.length > 0
        ? dbCompanies
            .map((c: any) => {
              const regionLine = [c.region, c.country].filter(Boolean).join(', ')
              const desc = (c.shortDescription || c.bio || c.description || '').slice(0, 200)
              return `${c.name}${regionLine ? ` · ${regionLine}` : ''}${desc ? `: ${desc}` : ''}`
            })
            .join('\n\n')
        : PRODUCERS.map(
            (p) =>
              `${p.name} · ${p.region}${p.subregion ? ` (${p.subregion})` : ''}: ${p.summary}${p.farmingMethod ? ` Farming: ${p.farmingMethod}.` : ''}`,
          ).join('\n\n')

    const wineLines =
      dbProducts.length > 0
        ? dbProducts
            .map((p: any) => {
              // Use DB retailPriceCents — ONLY consumer-facing price, never internal layers
              const price = `$${(p.retailPriceCents / 100).toFixed(0)}`
              const desc = (p.tastingNotesShort || p.description || '').slice(0, 180)
              const appellation = p.appellation || p.region || ''
              const producerName = (p.company as any)?.name ?? ''
              const style = p.wineStyle || p.category || ''
              return `• ${producerName} ${p.name}${style || appellation ? ` — ${[style, appellation].filter(Boolean).join(', ')}` : ''} | ${price}\n  ${desc}`
            })
            .join('\n')
        : WINES.map((w) => {
            const price = `$${w.consumerPurchasePriceUSD.toFixed(0)}`
            const score = w.criticScore ? ` | ${w.criticScore}` : ''
            const desc = w.description.slice(0, 180)
            return `• ${w.displayName} — ${w.type}, ${w.appellation || w.region}${score} | ${price}\n  ${desc}`
          }).join('\n')

    return `=== TERRA TRIONFO PORTFOLIO ===

── REGIONS ──
${regionLines}

── PRODUCERS ──
${producerLines}

── WINES ──
${wineLines}`.trim()
  } catch {
    // DB unavailable — fall back to static context gracefully
    return buildPortfolioContext()
  }
}

/**
 * Shape of a DB product record as returned by buildPortfolioContextFromDB's query.
 * Used by the sommelier route for DB-aware wine resolution.
 */
export interface DBProductRef {
  id: string
  name: string
  slug: string | null
  wineStyle: string | null
  region: string | null
  retailPriceCents: number
  company: { name: string; slug: string | null }
}

/**
 * Fetch live DB products for name-matching against AI answers.
 * Returns empty array (not throws) if DB is unavailable.
 */
export async function fetchLiveDBProducts(): Promise<DBProductRef[]> {
  try {
    return await prisma.product.findMany({
      where: { status: 'APPROVED', contentStatus: 'LIVE' },
      select: {
        id: true,
        name: true,
        slug: true,
        wineStyle: true,
        region: true,
        retailPriceCents: true,
        company: { select: { name: true, slug: true } },
      },
      orderBy: { name: 'asc' },
      take: 120,
    }) as DBProductRef[]
  } catch {
    return []
  }
}

/**
 * Fetch live DB companies for name-matching against AI answers.
 * Returns empty array (not throws) if DB is unavailable.
 */
export async function fetchLiveDBCompanies(): Promise<Array<{ id: string; name: string; slug: string | null; region: string | null }>> {
  try {
    return await prisma.company.findMany({
      where: { status: 'APPROVED', contentStatus: 'LIVE' },
      select: { id: true, name: true, slug: true, region: true },
      orderBy: { name: 'asc' },
    })
  } catch {
    return []
  }
}
