import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PROFORMA_DATA, normalizeWineName } from '@/data/proforma'

export const dynamic = 'force-dynamic'

interface MatchingAttempt {
  proformaEntry: (typeof PROFORMA_DATA)[0]
  producerMatchFound: boolean
  companiesFound: Array<{ id: string; name: string; slug: string | null }>
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

      // Find the canonical supplier by slug first, then fallback to the original producer code lookup.
      const exactCompany = await prisma.company.findUnique({
        where: { slug: proformaEntry.companySlug },
      })

      const companies = exactCompany
        ? [exactCompany]
        : await prisma.company.findMany({
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
