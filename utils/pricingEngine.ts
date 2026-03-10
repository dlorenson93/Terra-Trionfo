/**
 * Terra Trionfo Pricing Engine
 *
 * Calculates the full distribution chain pricing for every portfolio wine.
 *
 * Economic chain:
 *   Producer → Terra Trionfo (importer) → Distributor → Retailer/Restaurant → Consumer
 *
 * VISIBILITY RULES
 *   Public marketplace  → consumerPurchasePriceUSD ONLY
 *   Distributor portal  → importerSellPriceUSD
 *   Internal / admin    → all layers
 */

/** EUR → USD conversion rate (configurable) */
export const EURUSD = 1.08

/** Terra Trionfo importer markup over acquisition cost */
const IMPORTER_MARKUP = 1.35

/** Distributor markup over importer sell price */
const DISTRIBUTOR_MARKUP = 1.30

/** Retail shelf markup over distributor wholesale */
const RETAIL_MARKUP = 1.45

/** Restaurant bottle list multiplier over retail shelf price */
const RESTAURANT_MULTIPLIER = 2.7

/**
 * Standard retail price bands for 750 ml bottles.
 * Retail estimates are rounded to the nearest value in this list.
 * For small-format wines (< $10 retail), nearest-dollar rounding is used instead.
 */
const PRICE_BANDS = [15, 18, 20, 22, 25, 28, 32, 36, 40, 45, 55, 60] as const

function roundToNearestBand(price: number): number {
  if (price <= 10) return Math.round(price)
  let nearest: number = PRICE_BANDS[0]
  let minDist = Math.abs(price - nearest)
  for (const band of PRICE_BANDS) {
    const dist = Math.abs(price - band)
    if (dist < minDist) { minDist = dist; nearest = band }
  }
  return nearest
}

// ── Individual calculators ────────────────────────────────────────────────────

/** Step 1 — Convert EUR acquisition cost to USD */
export function calculateCostUSD(internalWholesalePriceEUR: number): number {
  return Math.round(internalWholesalePriceEUR * EURUSD * 100) / 100
}

/** Step 2 — Terra Trionfo sell price to distributor (35% markup) */
export function calculateImporterPrice(costUSD: number): number {
  return Math.round(costUSD * IMPORTER_MARKUP * 100) / 100
}

/** Step 3 — Estimated distributor wholesale price (30% markup) */
export function calculateDistributorPrice(importerSellPriceUSD: number): number {
  return Math.round(importerSellPriceUSD * DISTRIBUTOR_MARKUP * 100) / 100
}

/** Step 4 — Estimated retail shelf price (45% markup, rounded to price band) */
export function calculateRetailPrice(distributorWholesalePriceUSD: number): number {
  const raw = distributorWholesalePriceUSD * RETAIL_MARKUP
  return roundToNearestBand(raw)
}

/** Step 5 — Estimated restaurant bottle list price (2.7× retail) */
export function calculateRestaurantPrice(retailEstimatedPriceUSD: number): number {
  return Math.round(retailEstimatedPriceUSD * RESTAURANT_MULTIPLIER * 100) / 100
}

/** Step 6 — Consumer marketplace price (equals retail shelf, visible publicly) */
export function calculateConsumerPrice(retailEstimatedPriceUSD: number): number {
  return retailEstimatedPriceUSD
}

// ── Composite builder ─────────────────────────────────────────────────────────

export interface WinePricing {
  /** USD acquisition cost — INTERNAL ONLY */
  costUSD: number
  /** Terra Trionfo → Distributor sell price — INTERNAL ONLY */
  importerSellPriceUSD: number
  /** Estimated Distributor wholesale — INTERNAL ONLY */
  distributorWholesalePriceUSD: number
  /** Estimated retail shelf price — INTERNAL ONLY */
  retailEstimatedPriceUSD: number
  /** Estimated restaurant bottle list price — INTERNAL ONLY */
  restaurantBottlePriceUSD: number
  /** PUBLIC marketplace price — the ONLY price shown to consumers */
  consumerPurchasePriceUSD: number
}

/** Derive all six pricing tiers from the EUR acquisition cost. */
export function buildWinePricing(internalWholesalePriceEUR: number): WinePricing {
  const costUSD                   = calculateCostUSD(internalWholesalePriceEUR)
  const importerSellPriceUSD      = calculateImporterPrice(costUSD)
  const distributorWholesalePriceUSD = calculateDistributorPrice(importerSellPriceUSD)
  const retailEstimatedPriceUSD   = calculateRetailPrice(distributorWholesalePriceUSD)
  const restaurantBottlePriceUSD  = calculateRestaurantPrice(retailEstimatedPriceUSD)
  const consumerPurchasePriceUSD  = calculateConsumerPrice(retailEstimatedPriceUSD)
  return {
    costUSD,
    importerSellPriceUSD,
    distributorWholesalePriceUSD,
    retailEstimatedPriceUSD,
    restaurantBottlePriceUSD,
    consumerPurchasePriceUSD,
  }
}
