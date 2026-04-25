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
 * Matching criteria:
 * 1. Producer company lookup (by slug or name pattern)
 * 2. Wine name similarity (60%+ token match)
 * 3. Vintage validation (if proforma specifies vintage, must match exactly)
 * 4. Format/size validation (bottleSizeMl must match exactly)
 */
async function matchProduct(proformaEntry: (typeof PROFORMA_DATA)[0]) {
  const normalizedName = normalizeWineName(proformaEntry.name)

  // Step 1: Find company by producer ID
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { slug: { contains: proformaEntry.producerId.toLowerCase(), mode: 'insensitive' } },
        { name: { contains: proformaEntry.producerId, mode: 'insensitive' } },
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

  // Step 3: Try to match by name + vintage + format
  for (const product of productCandidates) {
    const productNameNorm = normalizeWineName(product.name)

    // Token-based similarity matching
    const proformaTokens = normalizedName.split(/[\s\-]+/).filter(t => t.length > 2)
    const productTokens = productNameNorm.split(/[\s\-]+/).filter(t => t.length > 2)

    if (proformaTokens.length === 0 || productTokens.length === 0) {
      continue
    }

    // Calculate token matches
    const matches = proformaTokens.filter(t =>
      productTokens.some(pt => pt.includes(t) || t.includes(pt))
    )
    const similarity = matches.length / proformaTokens.length

    // Require 60% similarity
    if (similarity < 0.6) {
      continue
    }

    // Vintage must match exactly if specified in proforma
    if (proformaEntry.vintage !== null) {
      if (product.vintage === null || product.vintage !== proformaEntry.vintage) {
        continue
      }
    }

    // Format/size must match exactly
    if (product.bottleSizeMl === null || product.bottleSizeMl !== proformaEntry.bottleSizeMl) {
      continue
    }

    return product
  }

  return null
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
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildWinePricing } from '@/utils/pricingEngine'

export const dynamic = 'force-dynamic'

/**
 * PROFORMA DATA (SOURCE OF TRUTH)
 * Structured supplier data for inventory synchronization.
 */
const PROFORMA_DATA = [
  // L'AUTIN (Piemonte Alps)
  { producerId: 'LAUTIN', name: 'El Bertu 2021', vintage: 2021, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 8.00 },
  { producerId: 'LAUTIN', name: 'Gemma Vitis Bonarda 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 5.60 },
  { producerId: 'LAUTIN', name: 'Re Nero Pinot Nero 2022', vintage: 2022, format: 'bottle', bottleSizeMl: 750, quantity: 360, costEUR: 8.50 },
  { producerId: 'LAUTIN', name: 'Le Ramie 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 180, costEUR: 12.00 },
  { producerId: 'LAUTIN', name: 'Musca Bianca 2023', vintage: 2023, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.60 },

  // LANTIERI (Franciacorta)
  { producerId: 'LANTIERI', name: 'Franciacorta Brut', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 12.50 },
  { producerId: 'LANTIERI', name: 'Franciacorta Satèn', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 14.20 },
  { producerId: 'LANTIERI', name: 'Franciacorta Rosé', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 14.20 },

  // LUCA FACCINELLI (Valtellina)
  { producerId: 'FACCINELLI', name: 'Rosso di Valtellina 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 600, costEUR: 10.40 },
  { producerId: 'FACCINELLI', name: 'Grumello 2022', vintage: 2022, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 15.80 },
  { producerId: 'FACCINELLI', name: 'Grumello Riserva 2021', vintage: 2021, format: 'bottle', bottleSizeMl: 750, quantity: 120, costEUR: 23.50 },

  // RANDI (Emilia-Romagna) — Bottled
  { producerId: 'RANDI', name: 'Blu di Burson', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.80 },
  { producerId: 'RANDI', name: 'Burson Selezione', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 8.90 },
  { producerId: 'RANDI', name: 'Skin Contact White', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 6.40 },

  // RANDI (Emilia-Romagna) — Cans
  { producerId: 'RANDI', name: 'Spritz', vintage: null, format: 'can', bottleSizeMl: 250, quantity: 7920, costEUR: 1.80 },
  { producerId: 'RANDI', name: 'Bianco', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', name: 'Rosso', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', name: 'Bianco Frizzante', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },
  { producerId: 'RANDI', name: 'Rosato Frizzante', vintage: null, format: 'can', bottleSizeMl: 187, quantity: 2376, costEUR: 1.75 },

  // STROPPIANA (Barolo)
  { producerId: 'STROPP', name: 'Barbera d Alba', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 480, costEUR: 4.50 },
  { producerId: 'STROPP', name: 'Barolo Leonardo', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 960, costEUR: 10.50 },
  { producerId: 'STROPP', name: 'Barolo Bricco Cogni 2019', vintage: 2019, format: 'bottle', bottleSizeMl: 750, quantity: 420, costEUR: 13.00 },
  { producerId: 'STROPP', name: 'Barolo Bussia', vintage: null, format: 'bottle', bottleSizeMl: 750, quantity: 120, costEUR: 19.00 },

  // ZANOTELLI (Trentino)
  { producerId: 'ZANOTELLI', name: 'Kerner 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 7.10 },
  { producerId: 'ZANOTELLI', name: 'Lagrein 2025', vintage: 2025, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 7.30 },
  { producerId: 'ZANOTELLI', name: 'Schiava 2024', vintage: 2024, format: 'bottle', bottleSizeMl: 750, quantity: 720, costEUR: 5.95 },
  { producerId: 'ZANOTELLI', name: 'Riesling 2023', vintage: 2023, format: 'bottle', bottleSizeMl: 750, quantity: 6, costEUR: 0 },
]

/** Normalize wine name for matching */
function normalizeWineName(name: string): string {
  return name
    .toLowerCase()
    .replace(/docg?/gi, '') // remove DOC/DOCG
    .replace(/[éèê]/g, 'e') // normalize accents
    .replace(/[àáâ]/g, 'a')
    .replace(/œ/g, 'oe')
    .trim()
}

/** Generate deterministic SKU */
function generateSKU(producerId: string, wineName: string, vintage: number | null, bottleSizeMl: number): string {
  const producer = producerId.toUpperCase()
  const wine = wineName
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
  const vintageStr = vintage ? vintage.toString() : 'NV'
  const format = bottleSizeMl.toString()
  return `TT-${producer}-${wine}-${vintageStr}-${format}`
}

/** Match proforma entry to existing product in DB */
async function matchProduct(proformaEntry: typeof PROFORMA_DATA[0]) {
  const normalizedName = normalizeWineName(proformaEntry.name)

  // Get all wines from this producer
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { slug: { contains: proformaEntry.producerId.toLowerCase(), mode: 'insensitive' } },
        { name: { contains: proformaEntry.producerId, mode: 'insensitive' } },
      ],
    },
  })

  if (companies.length === 0) {
    return null
  }

  // Find matching products from this company
  const productCandidates = await prisma.product.findMany({
    where: {
      companyId: { in: companies.map(c => c.id) },
      category: 'WINE',
    },
  })

  // Try to match by name + vintage + format
  for (const product of productCandidates) {
    const productNameNorm = normalizeWineName(product.name)
    
    // Check if names are similar (at least 80% match of key tokens)
    const proformaTokens = normalizedName.split(/[\s-]+/).filter(t => t.length > 2)
    const productTokens = productNameNorm.split(/[\s-]+/).filter(t => t.length > 2)
    
    const matches = proformaTokens.filter(t => productTokens.some(pt => pt.includes(t) || t.includes(pt)))
    const similarity = proformaTokens.length > 0 ? matches.length / proformaTokens.length : 0

    if (similarity < 0.6) continue // Require 60% token match

    // Check vintage match
    if (proformaEntry.vintage !== null) {
      if (product.vintage === null || product.vintage !== proformaEntry.vintage) {
        continue
      }
    }

    // Check format/size match
    if (product.bottleSizeMl === null || product.bottleSizeMl !== proformaEntry.bottleSizeMl) {
      continue
    }

    return product
  }

  return null
}

interface SyncResult {
  updated: Array<{
    productId: string
    name: string
    sku: string
    oldInventory: number
    newInventory: number
    oldCostEUR: number | null
    newCostEUR: number
    oldPrice: number
    newPrice: number
  }>
  unmatched: Array<{
    producerId: string
    name: string
    reason: string
  }>
  errors: Array<{
    message: string
    productId?: string
  }>
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const result: SyncResult = {
      updated: [],
      unmatched: [],
      errors: [],
    }

    // Process each proforma entry
    for (const entry of PROFORMA_DATA) {
      try {
        const existingProduct = await matchProduct(entry)

        if (!existingProduct) {
          result.unmatched.push({
            producerId: entry.producerId,
            name: entry.name,
            reason: 'No matching product found in database',
          })
          continue
        }

        // Generate SKU
        const sku = generateSKU(entry.producerId, entry.name, entry.vintage, entry.bottleSizeMl)

        // Calculate new pricing from costEUR
        const pricingData = buildWinePricing(entry.costEUR)
        const newRetailPriceCents = Math.round(pricingData.consumerPurchasePriceUSD * 100)

        // Determine release status
        let newStatus = existingProduct.status
        if (entry.quantity === 0) {
          newStatus = 'SOLD_OUT' as any
        } else if (existingProduct.status === 'PENDING') {
          newStatus = 'PENDING'
        }

        // Update product
        const updated = await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            sku,
            inventory: entry.quantity,
            costEUR: entry.costEUR,
            format: entry.format,
            bottleSizeMl: entry.bottleSizeMl,
            retailPriceCents: newRetailPriceCents,
            status: newStatus,
          },
        })

        result.updated.push({
          productId: updated.id,
          name: updated.name,
          sku,
          oldInventory: existingProduct.inventory,
          newInventory: entry.quantity,
          oldCostEUR: existingProduct.costEUR ?? 0,
          newCostEUR: entry.costEUR,
          oldPrice: existingProduct.retailPriceCents / 100,
          newPrice: newRetailPriceCents / 100,
        })
      } catch (err) {
        result.errors.push({
          message: `Failed to process ${entry.producerId}/${entry.name}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        })
      }
    }

    // Return summary
    return NextResponse.json({
      success: true,
      summary: {
        updated: result.updated.length,
        unmatched: result.unmatched.length,
        errors: result.errors.length,
      },
      details: result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[sync-proforma] Error:', err)
    return NextResponse.json(
      { error: 'Failed to sync proforma inventory' },
      { status: 500 }
    )
  }
}
