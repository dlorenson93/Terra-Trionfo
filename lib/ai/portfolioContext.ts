import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'
import { REGION_LIST } from '@/lib/regions'

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
