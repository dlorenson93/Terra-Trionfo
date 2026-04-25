import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * PROFORMA PRODUCT IDs - Source of Truth
 * These are the exact 27 wines that should exist in the database.
 * All others will be identified as duplicates/out-of-scope.
 */
const PROFORMA_PRODUCT_IDS = [
  // L'AUTIN (5 wines)
  'lautin-el-bertu-2021',
  'lautin-gemma-vitis-bonarda-2025',
  'lautin-re-nero-pinot-nero-2022',
  'lautin-le-ramie-ramie-2024',
  'lautin-musca-bianca-2023',

  // LANTIERI (3 wines)
  'lantieri-franciacorta-brut',
  'lantieri-franciacorta-saten',
  'lantieri-franciacorta-rose',

  // LUCA FACCINELLI (3 wines)
  'faccinelli-rosso-di-valtellina-2024',
  'faccinelli-grumello-2022',
  'faccinelli-grumello-riserva-2021',

  // RANDI (8 wines: 3 bottles + 5 cans)
  'randi-blu-di-burson',
  'randi-burson-selezione',
  'randi-skin-contact-white',
  'randi-spritz-250ml',
  'randi-bianco-187ml',
  'randi-rosso-187ml',
  'randi-bianco-frizzante',
  'randi-rosato-frizzante',

  // STROPPIANA (4 wines)
  'stroppiana-barbera-d-alba',
  'stroppiana-barolo-leonardo',
  'stroppiana-barolo-bricco-cogni-2019',
  'stroppiana-barolo-bussia',

  // ZANOTELLI (4 wines)
  'zanotelli-kerner-2025',
  'zanotelli-lagrein-2025',
  'zanotelli-schiava-2024',
  'zanotelli-riesling-2023',
]

interface CleanupResult {
  duplicatesRemoved: Array<{
    id: string
    name: string
    companyId: string
    reason: string
  }>
  outOfScope: Array<{
    id: string
    name: string
    slug: string | null
    companyId: string
    reason: string
  }>
  preserved: number
  totalProcessed: number
}

export async function POST(request: Request) {
  try {
    // ADMIN-ONLY ACCESS
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const result: CleanupResult = {
      duplicatesRemoved: [],
      outOfScope: [],
      preserved: 0,
      totalProcessed: 0,
    }

    // Step 1: Get all wine products from the database
    const allProducts = await prisma.product.findMany({
      where: {
        category: 'WINE',
      },
      select: {
        id: true,
        slug: true,
        name: true,
        companyId: true,
        company: {
          select: {
            slug: true,
            name: true,
          },
        },
        inventory: true,
        vintage: true,
        bottleSizeMl: true,
      },
    })

    result.totalProcessed = allProducts.length

    // Step 2: Build a map of producer + normalized name to identify duplicates
    const nameMap = new Map<string, typeof allProducts>()
    for (const product of allProducts) {
      const companySlug = product.company?.slug || product.companyId
      const normalizedName = product.name
        .toLowerCase()
        .replace(/[éèê]/g, 'e')
        .replace(/[àáâ]/g, 'a')
        .replace(/[òó]/g, 'o')
        .replace(/ô/g, 'o')
        .replace(/ù/g, 'u')
        .replace(/œ/g, 'oe')
        .replace(/['\-']/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      const key = `${companySlug}::${normalizedName}`

      if (!nameMap.has(key)) {
        nameMap.set(key, [])
      }
      nameMap.get(key)!.push(product)
    }

    // Step 3: Identify and remove duplicates (keep only one per producer+name)
    const duplicateIds = new Set<string>()
    for (const [key, products] of nameMap.entries()) {
      if (products.length > 1) {
        // Sort by creation order (keep first, mark rest as duplicates)
        const [keep, ...duplicates] = products.sort((a, b) => a.id.localeCompare(b.id))

        for (const dup of duplicates) {
          duplicateIds.add(dup.id)
        }
      }
    }

    // Delete duplicates
    for (const dupId of duplicateIds) {
      const dup = allProducts.find(p => p.id === dupId)
      if (dup) {
        await prisma.product.delete({
          where: { id: dupId },
        })

        result.duplicatesRemoved.push({
          id: dupId,
          name: dup.name,
          companyId: dup.companyId,
          reason: 'Duplicate: multiple products with same producer+name combination',
        })
      }
    }

    // Step 4: Identify products not in the proforma (out-of-scope)
    const remainingProducts = allProducts.filter(p => !duplicateIds.has(p.id))

    for (const product of remainingProducts) {
      // Check if this product slug is in the proforma list
      const inProforma = PROFORMA_PRODUCT_IDS.some(
        id => product.slug?.toLowerCase().includes(id.toLowerCase()) || id.includes(product.id)
      )

      if (!inProforma) {
        // This product is not in the proforma - mark as out-of-scope but don't delete
        result.outOfScope.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          companyId: product.companyId,
          reason: 'Not in Phase 27A proforma (27 wines only)',
        })
      } else {
        result.preserved++
      }
    }

    return NextResponse.json(
      {
        success: true,
        summary: {
          duplicatesRemoved: result.duplicatesRemoved.length,
          outOfScope: result.outOfScope.length,
          preserved: result.preserved,
          totalProcessed: result.totalProcessed,
        },
        details: result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[cleanup-duplicates] Error:', err)
    return NextResponse.json(
      {
        error: 'Failed to cleanup duplicates',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
