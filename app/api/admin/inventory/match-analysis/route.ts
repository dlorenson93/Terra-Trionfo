import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PROFORMA_DATA = [
  { producerId: 'LAUTIN', name: 'El Bertu 2021', vintage: 2021, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 8.00 },
  { producerId: 'LAUTIN', name: 'Gemma Vitis (Bonarda) 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 5.60 },
  { producerId: 'LAUTIN', name: 'Re Nero (Pinot Nero) 2022', vintage: 2022, format: 'bottle', bottleSizeMl: 750, quantity: 360, costEUR: 8.50 },
  { producerId: 'LAUTIN', name: 'Le Ramie (Ramìe) 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 180, costEUR: 12.00 },
  { producerId: 'LAUTIN', name: 'Musca Bianca 2023', vintage: 2023, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.60 },
  { producerId: 'LANTIERI', name: 'Franciacorta Brut', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 12.50 },
  { producerId: 'LANTIERI', name: 'Franciacorta Satèn', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 14.20 },
  { producerId: 'LANTIERI', name: 'Franciacorta Rosé', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 14.20 },
  { producerId: 'FACCINELLI', name: 'Rosso di Valtellina 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 600, costEUR: 10.40 },
  { producerId: 'FACCINELLI', name: 'Grumello 2022', vintage: 2022, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 15.80 },
  { producerId: 'FACCINELLI', name: 'Grumello Riserva 2021', vintage: 2021, format: 'bottle', bottleSizeMl: 750, quantity: 120, costEUR: 23.50 },
  { producerId: 'RANDI', name: 'Blu di Burson', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.80 },
  { producerId: 'RANDI', name: 'Burson Selezione', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 8.90 },
  { producerId: 'RANDI', name: 'Skin Contact White', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 6.40 },
  { producerId: 'RANDI', name: 'Spritz 250ml', vintage: null, format: 'can', bottleSizeMl: 250, quantity: 7920, costEUR: 1.80 },
  { producerId: 'RANDI', name: 'Bianco 187ml', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', name: 'Rosso 187ml', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', name: 'Bianco Frizzante', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', name: 'Rosato Frizzante', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'STROPP', name: "Barbera d'Alba", vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 4.50 },
  { producerId: 'STROPP', name: 'Barolo Leonardo', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 10.50 },
  { producerId: 'STROPP', name: 'Barolo Bricco Cogni 2019', vintage: 2019, format: 'bottle', bottleSizeMl: 750, quantity: 420, costEUR: 13.00 },
  { producerId: 'STROPP', name: 'Barolo Bussia', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 120, costEUR: 19.00 },
  { producerId: 'ZANOTELLI', name: 'Kerner 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 7.10 },
  { producerId: 'ZANOTELLI', name: 'Lagrein 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 7.30 },
  { producerId: 'ZANOTELLI', name: 'Schiava 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.95 },
  { producerId: 'ZANOTELLI', name: 'Riesling 2023', vintage: 2023, format: 'bottle', bottleSizeMl: 750, quantity: 6, costEUR: 0 },
]

function normalizeWineName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bdocg?\b/gi, '')
    .replace(/[éèê]/g, 'e')
    .replace(/[àáâ]/g, 'a')
    .replace(/[òó]/g, 'o')
    .replace(/ô/g, 'o')
    .replace(/ù/g, 'u')
    .replace(/œ/g, 'oe')
    .replace(/['\-']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

interface MatchingAttempt {
  proformaEntry: (typeof PROFORMA_DATA)[0]
  producerMatchFound: boolean
  companiesFound: Array<{ id: string; name: string; slug: string }>
  candidateWines: Array<{
    id: string
    name: string
    vintage: number | null
    bottleSizeMl: number | null
    normalizedName: string
    tokenSimilarity: number
    vintageMatch: boolean
    formatMatch: boolean
    overallMatch: boolean
  }>
  matchResult: {
    matched: boolean
    product?: { id: string; name: string }
  }
}

/**
 * Detailed matching analysis endpoint
 * Shows exactly why each proforma wine is or isn't matching
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const analyses: MatchingAttempt[] = []
    let matched = 0
    let unmatched = 0

    for (const proformaEntry of PROFORMA_DATA) {
      const normalizedName = normalizeWineName(proformaEntry.name)

      // Find companies for this producer
      const companies = await prisma.company.findMany({
        where: {
          OR: [
            { slug: { contains: proformaEntry.producerId.toLowerCase(), mode: 'insensitive' } },
            { name: { contains: proformaEntry.producerId, mode: 'insensitive' } },
          ],
        },
      })

      const analysis: MatchingAttempt = {
        proformaEntry,
        producerMatchFound: companies.length > 0,
        companiesFound: companies.map(c => ({ id: c.id, name: c.name, slug: c.slug })),
        candidateWines: [],
        matchResult: { matched: false },
      }

      if (companies.length === 0) {
        unmatched++
        analyses.push(analysis)
        continue
      }

      // Get candidate wines
      const productCandidates = await prisma.product.findMany({
        where: {
          companyId: { in: companies.map(c => c.id) },
          category: 'WINE',
        },
      })

      // Analyze each candidate
      let foundMatch: (typeof productCandidates)[0] | null = null

      for (const product of productCandidates) {
        const productNameNorm = normalizeWineName(product.name)

        const proformaTokens = normalizedName.split(/[\s\-]+/).filter(t => t.length > 2)
        const productTokens = productNameNorm.split(/[\s\-]+/).filter(t => t.length > 2)

        const matches =
          proformaTokens.length > 0
            ? proformaTokens.filter(t => productTokens.some(pt => pt.includes(t) || t.includes(pt)))
            : []

        const similarity = proformaTokens.length > 0 ? matches.length / proformaTokens.length : 0

        const vintageMatch =
          proformaEntry.vintage === null ||
          (product.vintage !== null && product.vintage === proformaEntry.vintage)

        const formatMatch = product.bottleSizeMl === proformaEntry.bottleSizeMl

        const isOverallMatch = similarity >= 0.6 && vintageMatch && formatMatch

        analysis.candidateWines.push({
          id: product.id,
          name: product.name,
          vintage: product.vintage,
          bottleSizeMl: product.bottleSizeMl,
          normalizedName: productNameNorm,
          tokenSimilarity: Math.round(similarity * 100) / 100,
          vintageMatch,
          formatMatch,
          overallMatch: isOverallMatch,
        })

        if (isOverallMatch && !foundMatch) {
          foundMatch = product
        }
      }

      if (foundMatch) {
        analysis.matchResult = {
          matched: true,
          product: { id: foundMatch.id, name: foundMatch.name },
        }
        matched++
      } else {
        unmatched++
      }

      analyses.push(analysis)
    }

    return NextResponse.json(
      {
        summary: {
          totalProforma: PROFORMA_DATA.length,
          matched,
          unmatched,
          matchPercentage: Math.round((matched / PROFORMA_DATA.length) * 100),
        },
        analyses,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[match-analysis] Error:', err)
    return NextResponse.json(
      {
        error: 'Failed to analyze matches',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
