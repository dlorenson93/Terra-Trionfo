import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildWinePricing } from '@/utils/pricingEngine'

export const dynamic = 'force-dynamic'

/**
 * PROFORMA DATA (SOURCE OF TRUTH)
 * Structured supplier data for inventory synchronization.
 * Phase 27A: Controlled Data Alignment + SKU Standardization
 */
const PROFORMA_DATA = [
  // L'AUTIN (Piemonte Alps) - 5 wines
  { producerId: 'LAUTIN', name: 'El Bertu 2021', vintage: 2021, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 8.00 },
  { producerId: 'LAUTIN', name: 'Gemma Vitis (Bonarda) 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 5.60 },
  { producerId: 'LAUTIN', name: 'Re Nero (Pinot Nero) 2022', vintage: 2022, format: 'bottle', bottleSizeMl: 750, quantity: 360, costEUR: 8.50 },
  { producerId: 'LAUTIN', name: 'Le Ramie (Ramìe) 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 180, costEUR: 12.00 },
  { producerId: 'LAUTIN', name: 'Musca Bianca 2023', vintage: 2023, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.60 },

  // LANTIERI (Franciacorta) - 3 wines
  { producerId: 'LANTIERI', name: 'Franciacorta Brut', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 12.50 },
  { producerId: 'LANTIERI', name: 'Franciacorta Satèn', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 14.20 },
  { producerId: 'LANTIERI', name: 'Franciacorta Rosé', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 14.20 },

  // LUCA FACCINELLI (Valtellina) - 3 wines
  { producerId: 'FACCINELLI', name: 'Rosso di Valtellina 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 600, costEUR: 10.40 },
  { producerId: 'FACCINELLI', name: 'Grumello 2022', vintage: 2022, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 15.80 },
  { producerId: 'FACCINELLI', name: 'Grumello Riserva 2021', vintage: 2021, format: 'bottle', bottleSizeMl: 750, quantity: 120, costEUR: 23.50 },

  // RANDI (Emilia-Romagna) - Bottled - 3 wines
  { producerId: 'RANDI', name: 'Blu di Burson', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.80 },
  { producerId: 'RANDI', name: 'Burson Selezione', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 8.90 },
  { producerId: 'RANDI', name: 'Skin Contact White', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 6.40 },

  // RANDI (Emilia-Romagna) - Cans - 5 products
  { producerId: 'RANDI', name: 'Spritz 250ml', vintage: null, format: 'can', bottleSizeMl: 250, quantity: 7920, costEUR: 1.80 },
  { producerId: 'RANDI', name: 'Bianco 187ml', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', name: 'Rosso 187ml', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', name: 'Bianco Frizzante', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', name: 'Rosato Frizzante', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },

  // STROPPIANA (Barolo) - 4 wines
  { producerId: 'STROPP', name: "Barbera d'Alba", vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 4.50 },
  { producerId: 'STROPP', name: 'Barolo Leonardo', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 10.50 },
  { producerId: 'STROPP', name: 'Barolo Bricco Cogni 2019', vintage: 2019, format: 'bottle', bottleSizeMl: 750, quantity: 420, costEUR: 13.00 },
  { producerId: 'STROPP', name: 'Barolo Bussia', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 120, costEUR: 19.00 },

  // ZANOTELLI (Trentino) - 4 wines
  { producerId: 'ZANOTELLI', name: 'Kerner 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 7.10 },
  { producerId: 'ZANOTELLI', name: 'Lagrein 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 7.30 },
  { producerId: 'ZANOTELLI', name: 'Schiava 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.95 },
  { producerId: 'ZANOTELLI', name: 'Riesling 2023', vintage: 2023, format: 'bottle', bottleSizeMl: 750, quantity: 6, costEUR: 0 },
]

/**
 * Normalize wine name for matching
 * Rules: remove DOC/DOCG, normalize accents, trim whitespace
 */
function normalizeWineName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bdocg?\b/gi, '') // remove DOC/DOCG
    .replace(/[éèê]/g, 'e') // normalize accents
    .replace(/[àáâ]/g, 'a')
    .replace(/[òó]/g, 'o')
    .replace(/ô/g, 'o')
    .replace(/ù/g, 'u')
    .replace(/œ/g, 'oe')
    .replace(/['\-']/g, '') // remove apostrophes and special dashes
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate deterministic SKU
 * Format: TT-{PRODUCER}-{WINE}-{VINTAGE}-{FORMAT}
 * Examples:
 *   TT-LAUTIN-ELBERTU-2021-750
 *   TT-RANDI-SPRITZ-NV-250
 */
function generateSKU(producerId: string, wineName: string, vintage: number | null, bottleSizeMl: number): string {
  const producer = producerId.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const wine = wineName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // remove special chars
    .replace(/\s+/g, '-')
    .substring(0, 20) // truncate to reasonable length
  const vintageStr = vintage ? vintage.toString() : 'NV'
  const format = bottleSizeMl.toString()
  return `TT-${producer}-${wine}-${vintageStr}-${format}`
}

/**
 * Match proforma entry to existing product in DB
 * Matching hierarchy:
 * 1. Find company by producer ID (slug/name lookup)
 * 2. Strict match: exact name + vintage + format (60%+ token similarity)
 * 3. Format-flexible: exact name + vintage, any format (50%+ similarity)
 * 4. Vintage-flexible: exact name, any vintage/format (50%+ similarity)
 * 5. Name-only fallback: best name match at 50%+ similarity
 */
async function matchProduct(proformaEntry: (typeof PROFORMA_DATA)[0]) {
  const normalizedName = normalizeWineName(proformaEntry.name)

  // Step 1: Find company by producer ID
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { slug: { contains: proformaEntry.producerId.toLowerCase(), mode: 'insensitive' } },
        { name: { contains: proformaEntry.producerId, mode: 'insensitive' } },
        // Also try just first part of producer ID for partial matches
        { slug: { startsWith: proformaEntry.producerId.substring(0, 3).toLowerCase(), mode: 'insensitive' } },
        { name: { startsWith: proformaEntry.producerId.substring(0, 3), mode: 'insensitive' } },
      ],
    },
  })

  if (companies.length === 0) {
    return null
  }

  // Step 2: Get all wine products from matching companies
  const productCandidates = await prisma.product.findMany({
    where: {
      companyId: { in: companies.map(c => c.id) },
      category: 'WINE',
    },
  })

  if (productCandidates.length === 0) {
    return null
  }

  // Helper function to calculate name similarity
  const calculateSimilarity = (tokens1: string[], tokens2: string[]) => {
    if (tokens1.length === 0 || tokens2.length === 0) return 0
    const matches = tokens1.filter(t => tokens2.some(pt => pt.includes(t) || t.includes(pt)))
    return matches.length / tokens1.length
  }

  let bestMatch: (typeof productCandidates)[0] | null = null
  let bestMatchScore = 0

  for (const product of productCandidates) {
    const productNameNorm = normalizeWineName(product.name)
    const proformaTokens = normalizedName.split(/[\s\-]+/).filter(t => t.length > 2)
    const productTokens = productNameNorm.split(/[\s\-]+/).filter(t => t.length > 2)

    const nameSimilarity = calculateSimilarity(proformaTokens, productTokens)

    // Skip very poor matches
    if (nameSimilarity < 0.4) {
      continue
    }

    // TIER 1: Exact format + vintage match (weight: 1.0)
    if (
      nameSimilarity >= 0.6 &&
      product.bottleSizeMl === proformaEntry.bottleSizeMl &&
      (proformaEntry.vintage === null || product.vintage === proformaEntry.vintage)
    ) {
      const score = nameSimilarity * 1.0
      if (score > bestMatchScore) {
        bestMatch = product
        bestMatchScore = score
      }
    }

    // TIER 2: Format match, vintage flexible (weight: 0.9)
    if (
      nameSimilarity >= 0.55 &&
      product.bottleSizeMl === proformaEntry.bottleSizeMl &&
      (proformaEntry.vintage === null || product.vintage === null || product.vintage === proformaEntry.vintage)
    ) {
      const score = nameSimilarity * 0.9
      if (score > bestMatchScore && !bestMatch) {
        bestMatch = product
        bestMatchScore = score
      }
    }

    // TIER 3: Vintage match, format flexible (weight: 0.8)
    if (
      nameSimilarity >= 0.5 &&
      (product.bottleSizeMl === null ||
        product.bottleSizeMl === proformaEntry.bottleSizeMl ||
        Math.abs(product.bottleSizeMl - proformaEntry.bottleSizeMl) <= 50) &&
      (proformaEntry.vintage === null || product.vintage === proformaEntry.vintage)
    ) {
      const score = nameSimilarity * 0.8
      if (score > bestMatchScore && !bestMatch) {
        bestMatch = product
        bestMatchScore = score
      }
    }

    // TIER 4: Name only, best effort (weight: 0.6)
    if (nameSimilarity >= 0.5) {
      const score = nameSimilarity * 0.6
      if (score > bestMatchScore && !bestMatch) {
        bestMatch = product
        bestMatchScore = score
      }
    }
  }

  return bestMatch
}

interface UpdatedProduct {
  productId: string
  name: string
  sku: string
  oldInventory: number
  newInventory: number
  oldCostEUR: number | null
  newCostEUR: number
  oldPrice: number
  newPrice: number
}

interface UnmatchedEntry {
  producerId: string
  name: string
  reason: string
}

interface SyncError {
  message: string
  productId?: string
}

interface SyncResult {
  updated: UpdatedProduct[]
  unmatched: UnmatchedEntry[]
  errors: SyncError[]
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

    const result: SyncResult = {
      updated: [],
      unmatched: [],
      errors: [],
    }

    // STEP 1-10: Process each proforma entry
    for (const entry of PROFORMA_DATA) {
      try {
        // STEP 1 & 2: Product matching
        const existingProduct = await matchProduct(entry)

        if (!existingProduct) {
          result.unmatched.push({
            producerId: entry.producerId,
            name: entry.name,
            reason: 'No matching product found in database',
          })
          continue
        }

        // STEP 2: SKU Generation (MANDATORY)
        const sku = generateSKU(
          entry.producerId,
          entry.name,
          entry.vintage,
          entry.bottleSizeMl
        )

        // STEP 4 & 5: Cost alignment + Pricing recalculation
        // Input: costEUR (supplier acquisition cost)
        // Output: retailPriceCents (via pricing engine)
        const pricingData = buildWinePricing(entry.costEUR)
        const newRetailPriceCents = Math.round(pricingData.consumerPurchasePriceUSD * 100)

        // STEP 7: Release status safety
        // Rules: inventory > 0 → keep existing status
        //        inventory == 0 → SOLD_OUT
        //        UPCOMING stays UPCOMING
        let newStatus = existingProduct.status
        if (entry.quantity === 0) {
          newStatus = 'SOLD_OUT' as any
        }
        // Otherwise preserve existing status (PENDING/APPROVED/etc.)

        // STEP 3: Inventory overwrite (EXACT proforma quantity)
        // STEP 4: Cost alignment
        // STEP 6: Format handling
        const updated = await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            // SKU assignment
            sku,
            // Inventory overwrite (exact)
            inventory: entry.quantity,
            // Cost alignment
            costEUR: entry.costEUR,
            // Format handling
            format: entry.format,
            bottleSizeMl: entry.bottleSizeMl,
            // Pricing recalculation
            retailPriceCents: newRetailPriceCents,
            // Status safety
            status: newStatus,
          },
        })

        // STEP 9: Logging (REQUIRED)
        result.updated.push({
          productId: updated.id,
          name: updated.name,
          sku,
          oldInventory: existingProduct.inventory,
          newInventory: entry.quantity,
          oldCostEUR: existingProduct.costEUR ?? null,
          newCostEUR: entry.costEUR,
          oldPrice: existingProduct.retailPriceCents / 100,
          newPrice: newRetailPriceCents / 100,
        })
      } catch (err) {
        result.errors.push({
          message: `Failed to process ${entry.producerId}/${entry.name}: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        })
      }
    }

    // STEP 10: Return comprehensive summary
    return NextResponse.json(
      {
        success: true,
        summary: {
          updated: result.updated.length,
          unmatched: result.unmatched.length,
          errors: result.errors.length,
          total: PROFORMA_DATA.length,
        },
        details: result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[sync-proforma] Error:', err)
    return NextResponse.json(
      {
        error: 'Failed to sync proforma inventory',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
