/**
 * Demand Aggregation Layer
 *
 * Fetches all raw signals from the database (orders, waitlists, trade interests)
 * and computes structured per-product, per-region, per-style, and per-price-tier
 * aggregations ready for the decision engine or API responses.
 *
 * DATA VISIBILITY: All outputs are ADMIN-ONLY. Nothing here is exposed to consumers.
 */

import { prisma } from './prisma'
import { REGIONS } from './regions'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Derived release availability, computed from contentStatus + inventory.
 * UPCOMING  — not yet live (DRAFT | IN_REVIEW | READY)
 * AVAILABLE  — live with stock
 * ALLOCATED  — live, limited allocation, stock > 0
 * SOLD_OUT   — live but inventory exhausted
 */
export type DerivedReleaseStatus = 'UPCOMING' | 'AVAILABLE' | 'ALLOCATED' | 'SOLD_OUT'

export interface ProductSignals {
  productId: string
  productName: string
  company: string
  region: string | null
  contentStatus: string // DRAFT | IN_REVIEW | READY | LIVE
  /** Derived from contentStatus + inventory + isLimitedAllocation */
  releaseStatus: DerivedReleaseStatus
  grapeVarietals: string[]
  wineStyle: string | null
  retailPriceCents: number
  isLimitedAllocation: boolean
  inventory: number

  // Raw signal counts
  purchaseCount: number       // all-time units sold
  recentPurchaseCount: number // units sold in last 30 days
  waitlistCount: number
  tradeInterestCount: number
  totalCaseInterest: number   // sum of caseInterest from trade inquiries

  // Derived signals
  /**
   * Weighted demand intensity:
   *   waitlistCount + (tradeInterestCount × 2) + purchaseCount
   * Trade interest is weighted 2× — B2B buyers move higher volume than
   * individual consumers and represent stronger commercial signal quality.
   */
  demandIntensity: number
  /** purchaseCount / (waitlistCount + tradeInterestCount + 1) — conversion proxy without view data */
  conversionProxy: number
  /** waitlistCount − recentPurchaseCount — how many interested parties are not converting */
  interestGap: number
  /** (recentPurchaseCount / max(1, purchaseCount)) × 100 — purchase velocity trending */
  velocityScore: number
}

export interface RegionAggregate {
  region: string
  displayName: string
  totalWaitlists: number
  totalPurchases: number
  totalTradeInterest: number
  productCount: number
  demandLevel: 'high' | 'medium' | 'low'
  trend: 'growing' | 'stable' | 'declining'
}

export interface StyleAggregate {
  style: string
  totalWaitlists: number
  totalPurchases: number
  totalTradeInterest: number
  productCount: number
  /** Average demand signals per product in this style */
  demandConcentration: number
  signal: 'strong demand' | 'moderate demand' | 'low demand'
  action: string
}

export interface PriceTierAggregate {
  tier: string
  label: string
  totalPurchases: number
  totalWaitlists: number
  /** purchaseCount / max(1, waitlistCount) — how well interest converts at this price point */
  conversionStrength: number
  productCount: number
}

export interface DemandSnapshot {
  products: ProductSignals[]
  regionAggregates: RegionAggregate[]
  styleAggregates: StyleAggregate[]
  priceTierAggregates: PriceTierAggregate[]
  generatedAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICE_TIERS: Array<{ tier: string; label: string; minCents: number; maxCents: number }> = [
  { tier: 'entry',   label: '$25–$40',  minCents: 2500,  maxCents: 4000  },
  { tier: 'mid',     label: '$40–$60',  minCents: 4000,  maxCents: 6000  },
  { tier: 'premium', label: '$60–$100', minCents: 6000,  maxCents: 10000 },
  { tier: 'luxury',  label: '$100+',    minCents: 10000, maxCents: Infinity },
]

// Grapes/styles to track explicitly per spec
const TRACKED_VARIETALS = ['Nebbiolo', 'Barbera', 'Kerner', 'Lagrein', 'Sangiovese', 'Burson']

// Build region keyword map from REGIONS at module load time
const REGION_KEYWORDS: Record<string, { displayName: string; keywords: string[] }> = {}
for (const [slug, data] of Object.entries(REGIONS)) {
  REGION_KEYWORDS[slug] = { displayName: data.name, keywords: data.dbKeywords }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyPriceTier(cents: number): string {
  for (const t of PRICE_TIERS) {
    if (cents >= t.minCents && cents < t.maxCents) return t.tier
  }
  return 'entry'
}

function matchRegionSlug(regionStr: string | null): string | null {
  if (!regionStr) return null
  const lower = regionStr.toLowerCase()
  for (const [slug, { keywords }] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return slug
  }
  return null
}

// ─── Main aggregation ─────────────────────────────────────────────────────────

export async function buildDemandSnapshot(): Promise<DemandSnapshot> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Fetch all signals in parallel — single round-trip
  const [
    products,
    allOrderItems,
    recentOrderItems,
    waitlistCounts,
    tradeInterestCounts,
  ] = await Promise.all([
    // All APPROVED products — includes non-LIVE for upcoming interest signals
    prisma.product.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        name: true,
        region: true,
        contentStatus: true,
        grapeVarietals: true,
        wineStyle: true,
        retailPriceCents: true,
        isLimitedAllocation: true,
        inventory: true,
        company: { select: { name: true } },
      },
    }),

    // All-time order quantities
    prisma.orderItem.findMany({
      select: { productId: true, quantity: true },
    }),

    // Recent (30-day) order quantities for velocity
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: thirtyDaysAgo } } },
      select: { productId: true, quantity: true },
    }),

    // Waitlist counts per product
    (prisma as any).waitlist.groupBy({
      by: ['productId'],
      _count: { id: true },
    }),

    // Trade interest counts + total case interest per product
    (prisma as any).tradeInterest.groupBy({
      by: ['productId'],
      _count: { id: true },
      _sum: { caseInterest: true },
    }),
  ])

  // ── Build lookup maps ──────────────────────────────────────────────────
  const purchaseMap = new Map<string, number>()
  for (const item of allOrderItems) {
    purchaseMap.set(item.productId, (purchaseMap.get(item.productId) ?? 0) + item.quantity)
  }

  const recentPurchaseMap = new Map<string, number>()
  for (const item of recentOrderItems) {
    recentPurchaseMap.set(item.productId, (recentPurchaseMap.get(item.productId) ?? 0) + item.quantity)
  }

  const waitlistMap = new Map<string, number>()
  for (const row of waitlistCounts) {
    waitlistMap.set(row.productId, row._count.id)
  }

  const tradeMap = new Map<string, { count: number; caseInterest: number }>()
  for (const row of tradeInterestCounts) {
    tradeMap.set(row.productId, {
      count: row._count.id,
      caseInterest: row._sum?.caseInterest ?? 0,
    })
  }

  // ── Per-product signals ────────────────────────────────────────────────
  const productSignals: ProductSignals[] = (products as any[]).map((p) => {
    const purchaseCount = purchaseMap.get(p.id) ?? 0
    const recentPurchaseCount = recentPurchaseMap.get(p.id) ?? 0
    const waitlistCount = waitlistMap.get(p.id) ?? 0
    const trade = tradeMap.get(p.id) ?? { count: 0, caseInterest: 0 }

    // Trade interest is weighted 2× — B2B buyers signal higher volume potential
    const demandIntensity = waitlistCount + (trade.count * 2) + purchaseCount
    const conversionProxy = purchaseCount / (waitlistCount + trade.count + 1)
    const interestGap = waitlistCount - recentPurchaseCount
    const velocityScore =
      purchaseCount > 0
        ? Math.round((recentPurchaseCount / purchaseCount) * 100)
        : recentPurchaseCount > 0
          ? 100
          : 0

    const releaseStatus: DerivedReleaseStatus =
      p.contentStatus !== 'LIVE'
        ? 'UPCOMING'
        : p.inventory === 0
          ? 'SOLD_OUT'
          : p.isLimitedAllocation
            ? 'ALLOCATED'
            : 'AVAILABLE'

    return {
      productId: p.id,
      productName: p.name,
      company: p.company?.name ?? '',
      region: p.region ?? null,
      contentStatus: p.contentStatus,
      releaseStatus,
      grapeVarietals: p.grapeVarietals ?? [],
      wineStyle: p.wineStyle ?? null,
      retailPriceCents: p.retailPriceCents,
      isLimitedAllocation: p.isLimitedAllocation,
      inventory: p.inventory,
      purchaseCount,
      recentPurchaseCount,
      waitlistCount,
      tradeInterestCount: trade.count,
      totalCaseInterest: trade.caseInterest,
      demandIntensity,
      conversionProxy,
      interestGap,
      velocityScore,
    }
  })

  // ── Region aggregates ──────────────────────────────────────────────────
  const regionMap = new Map<
    string,
    {
      displayName: string
      totalWaitlists: number
      totalPurchases: number
      totalTradeInterest: number
      recentPurchases: number
      productCount: number
    }
  >()

  for (const sig of productSignals) {
    const slug = matchRegionSlug(sig.region)
    if (!slug) continue
    const existing = regionMap.get(slug) ?? {
      displayName: REGION_KEYWORDS[slug]?.displayName ?? slug,
      totalWaitlists: 0,
      totalPurchases: 0,
      totalTradeInterest: 0,
      recentPurchases: 0,
      productCount: 0,
    }
    existing.totalWaitlists += sig.waitlistCount
    existing.totalPurchases += sig.purchaseCount
    existing.totalTradeInterest += sig.tradeInterestCount
    existing.recentPurchases += sig.recentPurchaseCount
    existing.productCount += 1
    regionMap.set(slug, existing)
  }

  const regionAggregates: RegionAggregate[] = Array.from(regionMap.entries()).map(
    ([slug, data]) => {
      const totalDemand = data.totalWaitlists + data.totalPurchases + data.totalTradeInterest
      const demandLevel: RegionAggregate['demandLevel'] =
        totalDemand > 20 ? 'high' : totalDemand > 5 ? 'medium' : 'low'
      const avgRecentPurchases = data.productCount > 0 ? data.recentPurchases / data.productCount : 0
      const trend: RegionAggregate['trend'] =
        avgRecentPurchases > 1 ? 'growing' : avgRecentPurchases > 0 ? 'stable' : 'declining'

      return {
        region: slug,
        displayName: data.displayName,
        totalWaitlists: data.totalWaitlists,
        totalPurchases: data.totalPurchases,
        totalTradeInterest: data.totalTradeInterest,
        productCount: data.productCount,
        demandLevel,
        trend,
      }
    },
  )

  // ── Style / grape aggregates ───────────────────────────────────────────
  const styleMap = new Map<
    string,
    { totalWaitlists: number; totalPurchases: number; totalTradeInterest: number; productCount: number }
  >()

  for (const sig of productSignals) {
    const matched = new Set<string>()

    // Match against tracked varietals
    for (const grape of sig.grapeVarietals) {
      const hit = TRACKED_VARIETALS.find((v) => grape.toLowerCase().includes(v.toLowerCase()))
      if (hit) matched.add(hit)
    }

    // Franciacorta — sparkling style or region keyword
    if (
      sig.wineStyle?.toLowerCase().includes('sparkling') ||
      sig.region?.toLowerCase().includes('franciacorta')
    ) {
      matched.add('Franciacorta')
    }

    // Fallback: use wineStyle if no varietal matched
    if (matched.size === 0 && sig.wineStyle) {
      matched.add(sig.wineStyle)
    }

    for (const style of matched) {
      const existing = styleMap.get(style) ?? {
        totalWaitlists: 0,
        totalPurchases: 0,
        totalTradeInterest: 0,
        productCount: 0,
      }
      existing.totalWaitlists += sig.waitlistCount
      existing.totalPurchases += sig.purchaseCount
      existing.totalTradeInterest += sig.tradeInterestCount
      existing.productCount += 1
      styleMap.set(style, existing)
    }
  }

  const styleAggregates: StyleAggregate[] = Array.from(styleMap.entries()).map(
    ([style, data]) => {
      const totalSignals =
        data.totalWaitlists + data.totalPurchases + data.totalTradeInterest
      const demandConcentration =
        data.productCount > 0
          ? Math.round((totalSignals / data.productCount) * 10) / 10
          : 0

      const signal: StyleAggregate['signal'] =
        demandConcentration > 5
          ? 'strong demand'
          : demandConcentration > 1
            ? 'moderate demand'
            : 'low demand'

      const action =
        signal === 'strong demand'
          ? 'expand portfolio depth'
          : signal === 'moderate demand'
            ? 'maintain current depth'
            : 'review portfolio positioning'

      return {
        style,
        totalWaitlists: data.totalWaitlists,
        totalPurchases: data.totalPurchases,
        totalTradeInterest: data.totalTradeInterest,
        productCount: data.productCount,
        demandConcentration,
        signal,
        action,
      }
    },
  )

  // ── Price tier aggregates ──────────────────────────────────────────────
  const tierMap = new Map<
    string,
    { totalPurchases: number; totalWaitlists: number; productCount: number }
  >()
  for (const t of PRICE_TIERS) {
    tierMap.set(t.tier, { totalPurchases: 0, totalWaitlists: 0, productCount: 0 })
  }

  for (const sig of productSignals) {
    const tier = classifyPriceTier(sig.retailPriceCents)
    const existing = tierMap.get(tier)
    if (!existing) continue
    existing.totalPurchases += sig.purchaseCount
    existing.totalWaitlists += sig.waitlistCount
    existing.productCount += 1
  }

  const priceTierAggregates: PriceTierAggregate[] = PRICE_TIERS.map((t) => {
    const data = tierMap.get(t.tier)!
    return {
      tier: t.tier,
      label: t.label,
      totalPurchases: data.totalPurchases,
      totalWaitlists: data.totalWaitlists,
      conversionStrength:
        data.totalWaitlists > 0
          ? Math.round((data.totalPurchases / data.totalWaitlists) * 100) / 100
          : data.totalPurchases > 0
            ? 1
            : 0,
      productCount: data.productCount,
    }
  })

  return {
    products: productSignals,
    regionAggregates,
    styleAggregates,
    priceTierAggregates,
    generatedAt: new Date().toISOString(),
  }
}
