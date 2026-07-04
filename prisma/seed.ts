// Load env vars from .env.local (Next.js) or .env (Prisma default) before
// the Prisma client initialises so DATABASE_URL is always available.
import * as fs from 'fs'
import * as path from 'path'

function loadEnv(filename: string) {
  const envPath = path.resolve(process.cwd(), filename)
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

// Prefer .env.local (Next.js dev), fall back to .env (Prisma default)
loadEnv('.env.local')
loadEnv('.env')

import { PrismaClient, UserRole, CompanyStatus, ProductStatus, CommerceModel, ListingOwner, ProductCategory } from '@prisma/client'
import { WINES } from '../data/wines'
import { PRODUCERS } from '../data/producers'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create settings
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      defaultMarketplaceMarkupPercent: 20,
    },
  })

  console.log('✅ Settings created')

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@terratrionfo.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@terratrionfo.com',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      profileCompleted: true,
    },
  })

  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@example.com' },
    update: {},
    create: {
      name: 'Giuseppe Rossi',
      email: 'vendor@example.com',
      passwordHash: hashedPassword,
      role: UserRole.VENDOR,
      profileCompleted: true,
    },
  })

  const consumerUser = await prisma.user.upsert({
    where: { email: 'consumer@example.com' },
    update: {},
    create: {
      name: 'Maria Bianchi',
      email: 'consumer@example.com',
      passwordHash: hashedPassword,
      role: UserRole.CONSUMER,
      profileCompleted: true,
    },
  })

  console.log('✅ Users created')

  // Create portfolio winery companies
  const companiesData: any[] = [
    // ── Classical Collection ─────────────────────────────────────────
    {
      id: 'stroppiana',
      name: 'Stroppiana',
      slug: 'stroppiana',
      contactEmail: 'info@stroppiana.it',
      region: 'Piemonte',
      country: 'Italy',
      description: 'Family-owned estate based in La Morra with vineyards in Bussia and Verduno.',
      bio: 'Family-owned estate based in La Morra with vineyards also in Bussia and Verduno. Practicing sustainable, organically inspired viticulture, Stroppiana consistently earns high critic scores and offers strong positioning across the Barolo appellation.',
      status: CompanyStatus.APPROVED,
      isFoundingProducer: true,
      ownerId: adminUser.id,
      foundedYear: 1929,
      sustainablePractices: 'Sustainable viticulture, no synthetic herbicides',
      contentStatus: 'DRAFT',
      shortDescription: 'Family-owned Barolo estate spanning La Morra, Bussia, and Verduno — three distinct expressions in one estate relationship.',
      story: "Three-site family estate spanning La Morra, the Bussia cru, and the rarely exported Verduno subzone — capturing the full range of Barolo expression across three of Piemonte's most distinctive terroirs within a single producer relationship.",
    },
    {
      id: 'lantieri',
      name: 'Lantieri',
      slug: 'lantieri',
      contactEmail: 'info@lantierivini.it',
      region: 'Lombardy',
      country: 'Italy',
      description: 'Fourth-generation certified organic Franciacorta DOCG estate.',
      bio: "Fourth-generation family estate at the heart of Franciacorta — Italy's most serious traditional-method sparkling wine appellation. Certified organic since 2002, with Tre Bicchieri award recognition.",
      status: CompanyStatus.APPROVED,
      isFoundingProducer: true,
      ownerId: adminUser.id,
      sustainablePractices: 'Certified organic since 2002, morainic glacier soils',
      contentStatus: 'DRAFT',
      shortDescription: 'Certified organic Franciacorta DOCG — fourth-generation estate with Tre Bicchieri recognition.',
      story: 'Fourth-generation estate producing certified organic Franciacorta DOCG from Chardonnay, Pinot Nero, and Pinot Bianco grown on morainic glacier soils. One of the few organic Franciacorta estates with Tre Bicchieri recognition.',
    },
    {
      id: 'zanotelli',
      name: 'Zanotelli',
      slug: 'zanotelli',
      contactEmail: 'info@zanotelli.it',
      region: 'Trentino-Alto Adige',
      country: 'Italy',
      description: 'Family-owned alpine winery producing mineral-driven wines from high-altitude Dolomite vineyards.',
      bio: 'Family-owned winery producing mineral-driven alpine wines from high-altitude Dolomite vineyards. Specialises in native varietals — Kerner and Lagrein — that express the precision and freshness of mountain viticulture.',
      status: CompanyStatus.APPROVED,
      isFoundingProducer: true,
      ownerId: adminUser.id,
      foundedYear: 1962,
      sustainablePractices: 'Conventional with low intervention, minimal treatments',
      contentStatus: 'DRAFT',
      shortDescription: 'High-altitude family estate in the Dolomites — native varietals (Kerner, Lagrein) with alpine mineral precision.',
      story: 'Family-run alpine estate producing wines from cool, high-altitude vineyards in the Dolomites, where natural temperature variation between day and night preserves acidity and develops aromatic complexity.',
    },
    // ── Alternative & Next Generation ────────────────────────────────
    {
      id: 'randi',
      name: 'Randi',
      slug: 'randi',
      contactEmail: 'info@cantinarandi.it',
      region: 'Emilia-Romagna',
      country: 'Italy',
      description: 'Multi-generational certified organic estate producing vegan-certified wines from rare native varietals.',
      bio: 'Multi-generational certified organic estate on the Adriatic coast producing low-alcohol, vegan-certified wines from rare native varietals — including the nearly lost Burson grape — and a pioneering 200 ml canned wine range.',
      status: CompanyStatus.APPROVED,
      isFoundingProducer: false,
      ownerId: adminUser.id,
      foundedYear: 1978,
      sustainablePractices: 'Certified organic, vegan certified, no fining agents',
      contentStatus: 'DRAFT',
      shortDescription: 'Certified organic, vegan-certified estate preserving the nearly extinct Burson grape with a pioneering canned wine range.',
      story: 'Adriatic coast estate producing certified organic, vegan-certified wines from native varietals including the near-extinct Burson grape. The 200 ml canned wine format — across four expressions — serves aperitif, events, and on-trade occasions no other estate in the portfolio covers.',
    },
    {
      id: 'luca-faccinelli',
      name: 'Luca Faccinelli',
      slug: 'luca-faccinelli',
      contactEmail: 'info@lucafaccinelli.it',
      region: 'Lombardy',
      country: 'Italy',
      description: 'Small husband-and-wife winery on steep terraced Valtellina vineyards producing alpine Nebbiolo.',
      bio: "Small husband-and-wife winery working steep terraced vineyards in Valtellina — one of the most physically demanding wine regions in Europe — producing Nebbiolo (Chiavennasca) with alpine elegance, freshness, and structural restraint.",
      status: CompanyStatus.APPROVED,
      isFoundingProducer: false,
      ownerId: adminUser.id,
      foundedYear: 2008,
      sustainablePractices: 'Organically inspired, steep terraced cultivation by hand',
      contentStatus: 'DRAFT',
      shortDescription: "Husband-and-wife estate on terraced Valtellina vineyards — the sommelier's Nebbiolo with alpine freshness.",
      story: 'Husband-and-wife estate cultivating terraced Nebbiolo (Chiavennasca) at altitude in Valtellina. Production is small and entirely hand-managed, with the steep inclines making mechanisation impossible.',
      winemakerName: 'Luca Faccinelli',
      winemakerBio: 'Luca and his wife manage every aspect of the estate by hand on the near-vertical terraced vineyards of Valtellina, where mechanisation is physically impossible.',
    },
    {
      id: 'l-autin',
      name: "L'Autin",
      slug: 'l-autin',
      contactEmail: 'info@lautin.it',
      region: 'Piemonte Alps',
      country: 'Italy',
      description: 'Women-led certified organic estate near Mount Monviso producing rare native varietals.',
      bio: "Women-led certified organic estate near Mount Monviso, producing wines from high-altitude mineral soils using native varietals — including Timorasso, Bonarda, and Ramìe — that are rarely found in the U.S. market.",
      status: CompanyStatus.APPROVED,
      isFoundingProducer: false,
      ownerId: adminUser.id,
      foundedYear: 2012,
      sustainablePractices: 'Certified organic, biodynamically inspired',
      contentStatus: 'DRAFT',
      shortDescription: "Women-led certified organic estate producing Timorasso, Bonarda, and Ramìe from the Piemonte Alps near Mount Monviso.",
      story: "Women-led certified organic estate on the Piemonte Alps near Mount Monviso. Elisa Camusso produces Timorasso (a rare Piemontese white making a comeback), native Bonarda, and Ramìe — a historic alpine wine with almost no U.S. presence.",
      winemakerName: 'Elisa Camusso',
      winemakerBio: "Elisa Camusso leads the estate, championing native varietals — Timorasso, Bonarda, and Ramìe — that are rarely found outside Italy.",
    },
    {
      id: 'longanesi',
      name: 'Longanesi',
      slug: 'longanesi',
      contactEmail: 'info@longanesi.it',
      region: 'Sicily',
      country: 'Italy',
      description: 'Sicilian producer of organic extra virgin olive oil and artisanal vinegar from local grapes.',
      bio: 'Sicilian family producer specializing in organic extra virgin olive oils and red wine vinegar made from local Longanesi grapes.',
      status: CompanyStatus.APPROVED,
      isFoundingProducer: false,
      ownerId: adminUser.id,
      foundedYear: 1988,
      sustainablePractices: 'Certified organic farming and traditional pressing',
      contentStatus: 'LIVE',
      shortDescription: 'Sicilian organic olive oil and red wine vinegar producer rooted in traditional pressing.',
      story: 'Longanesi brings together Sicilian olive groves and vineyard heritage to create oils and vinegars that express the island’s sun, soil, and culinary traditions.',
    },
  ]

  for (const comp of companiesData) {
    await prisma.company.upsert({
      where: { id: comp.id as string },
      update: {} as any,
      create: comp as any,
    })
  }

  console.log('✅ Portfolio winery companies created')

  // ── Portfolio wines as products ─────────────────────────────────────────
  for (const wine of WINES) {
    const producer = PRODUCERS.find((p) => p.id === wine.producerId)
    const isFoundingWine = producer?.collection === 'classical' ? true : false

    await prisma.product.upsert({
      where: { id: wine.id },
      update: {},
      create: {
        id: wine.id,
        slug: wine.slug,
        name: wine.displayName,
        description: wine.description,
        category: ProductCategory.WINE,
        wineStyle: wine.type,
        appellation: wine.appellation ?? null,
        region: wine.region,
        country: 'Italy',
        commerceModel: CommerceModel.WHOLESALE,
        listingOwner: ListingOwner.TERRA,
        wholesalePriceCents: Math.round(wine.internalWholesalePriceEUR * 100),
        retailPriceCents: Math.round(wine.consumerPurchasePriceUSD * 100),
        inventory: 0,
        status: ProductStatus.PENDING,
        isFoundingWine,
        companyId: wine.producerId,
      } as any,
    })
  }

  console.log(`✅ ${WINES.length} portfolio wines seeded as products`)

  const provisionProducts = [
    {
      id: 'organic-olive-oil-sicily-075l',
      slug: 'organic-extra-virgin-olive-oil-sicily-075l',
      name: 'Organic Extra Virgin Olive Oil (Sicily) – 0,75L',
      description: 'Organic extra virgin olive oil from Sicily, cold-pressed and bottled in a 0.75L format.',
      category: ProductCategory.OLIVE_OIL,
      region: 'Sicily',
      country: 'Italy',
      commerceModel: CommerceModel.MARKETPLACE,
      listingOwner: ListingOwner.TERRA,
      retailPriceCents: 2200,
      wholesalePriceCents: 1600,
      inventory: 24,
      status: ProductStatus.APPROVED,
      contentStatus: 'LIVE',
      companyId: 'longanesi',
      bottleSizeMl: 750,
      format: 'bottle',
      producerDisplayName: 'Longanesi',
      isFeatured: true,
    },
    {
      id: 'organic-olive-oil-sicily-05l',
      slug: 'organic-extra-virgin-olive-oil-sicily-05l-bottiglia',
      name: 'Organic Extra Virgin Olive Oil (Sicily) – 0,5L - bottiglia',
      description: 'Organic extra virgin olive oil from Sicily in a 0.5L glass bottle.',
      category: ProductCategory.OLIVE_OIL,
      region: 'Sicily',
      country: 'Italy',
      commerceModel: CommerceModel.MARKETPLACE,
      listingOwner: ListingOwner.TERRA,
      retailPriceCents: 1800,
      wholesalePriceCents: 1300,
      inventory: 18,
      status: ProductStatus.APPROVED,
      contentStatus: 'LIVE',
      companyId: 'longanesi',
      bottleSizeMl: 500,
      format: 'bottle',
      producerDisplayName: 'Longanesi',
    },
    {
      id: 'organic-spicy-olive-oil-sicily-025l',
      slug: 'organic-spicy-extra-virgin-olive-oil-sicily-025l',
      name: 'Organic Spicy Extra Virgin Olive Oil (Sicily) – 0,25L',
      description: 'Organic spicy extra virgin olive oil from Sicily, crafted for finishing and pairing.',
      category: ProductCategory.OLIVE_OIL,
      region: 'Sicily',
      country: 'Italy',
      commerceModel: CommerceModel.MARKETPLACE,
      listingOwner: ListingOwner.TERRA,
      retailPriceCents: 1200,
      wholesalePriceCents: 900,
      inventory: 15,
      status: ProductStatus.APPROVED,
      contentStatus: 'LIVE',
      companyId: 'longanesi',
      bottleSizeMl: 250,
      format: 'bottle',
      producerDisplayName: 'Longanesi',
    },
    {
      id: 'red-wine-vinegar-longanesi-025l',
      slug: 'red-wine-vinegar-longanesi-025l',
      name: 'Red wine vinegar from Longanesi grapes 9% - 0,25',
      description: 'Red wine vinegar made from Longanesi grapes with a bright, structured 9% acidity.',
      category: ProductCategory.RED_WINE_VINEGAR,
      region: 'Sicily',
      country: 'Italy',
      commerceModel: CommerceModel.MARKETPLACE,
      listingOwner: ListingOwner.TERRA,
      retailPriceCents: 1400,
      wholesalePriceCents: 1000,
      inventory: 12,
      status: ProductStatus.APPROVED,
      contentStatus: 'LIVE',
      companyId: 'longanesi',
      bottleSizeMl: 250,
      format: 'bottle',
      producerDisplayName: 'Longanesi',
    },
  ] as const

  for (const product of provisionProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        region: product.region,
        country: product.country,
        commerceModel: product.commerceModel,
        listingOwner: product.listingOwner,
        retailPriceCents: product.retailPriceCents,
        wholesalePriceCents: product.wholesalePriceCents,
        inventory: product.inventory,
        status: product.status,
        contentStatus: product.contentStatus,
        companyId: product.companyId,
        bottleSizeMl: product.bottleSizeMl,
        format: product.format,
        producerDisplayName: product.producerDisplayName,
        isFeatured: product.isFeatured,
      } as any,
    })
  }

  console.log(`✅ ${provisionProducts.length} provision products seeded as catalog items`)

  // ── Pickup location ──────────────────────────────────────────────────────
  await (prisma as any).pickupLocation.upsert({
    where: { id: 'pickup-boston' },
    update: {},
    create: {
      id: 'pickup-boston',
      name: 'Terra Trionfo — Boston (Charles Street)',
      address: '100 Charles Street',
      city: 'Boston',
      state: 'MA',
      zipCode: '02114',
      isActive: true,
    },
  })

  console.log('✅ Pickup location seeded')

  // ── Delivery Zones ───────────────────────────────────────────────────────
  const zonesData = [
    { id: 'zone-greater-boston', code: 'GREATER_BOSTON', name: 'Greater Boston', description: 'Boston metro area, Cambridge, Somerville, Brookline, and surrounding communities' },
    { id: 'zone-north-shore', code: 'NORTH_SHORE', name: 'North Shore', description: 'Salem, Beverly, Gloucester, Newburyport, and coastal communities north of Boston' },
    { id: 'zone-cape-and-islands', code: 'CAPE_AND_ISLANDS', name: 'Cape & Islands', description: 'Cape Cod, Martha\'s Vineyard, and Nantucket' },
    { id: 'zone-western-massachusetts', code: 'WESTERN_MASSACHUSETTS', name: 'Western Massachusetts', description: 'Springfield, Northampton, Amherst, and the Pioneer Valley' },
  ]

  for (const zone of zonesData) {
    await (prisma as any).deliveryZone.upsert({
      where: { id: zone.id },
      update: { name: zone.name, description: zone.description },
      create: { id: zone.id, code: zone.code, name: zone.name, description: zone.description, isActive: true },
    })
  }

  console.log('✅ Delivery zones seeded')

  // ── Delivery Routes (day 0=Sun, 1=Mon, ..., 6=Sat) ──────────────────────
  // Wed=3 Greater Boston, Fri=5 North Shore, Sat=6 Cape & Islands, Sun=0 Western MA
  const routesData = [
    { id: 'route-gb-wed', zoneId: 'zone-greater-boston', deliveryDay: 3 },
    { id: 'route-ns-fri', zoneId: 'zone-north-shore', deliveryDay: 5 },
    { id: 'route-ci-sat', zoneId: 'zone-cape-and-islands', deliveryDay: 6 },
    { id: 'route-wm-sun', zoneId: 'zone-western-massachusetts', deliveryDay: 0 },
  ]

  for (const route of routesData) {
    await (prisma as any).deliveryRoute.upsert({
      where: { id: route.id },
      update: { deliveryDay: route.deliveryDay, isActive: true },
      create: { id: route.id, zoneId: route.zoneId, deliveryDay: route.deliveryDay, isActive: true },
    })
  }

  console.log('✅ Delivery routes seeded')

  // ── Pickup Schedules (Thursday=4, Saturday=6) ────────────────────────────
  const schedulesData = [
    { id: 'sched-boston-thu', locationId: 'pickup-boston', pickupDay: 4 },
    { id: 'sched-boston-sat', locationId: 'pickup-boston', pickupDay: 6 },
  ]

  for (const sched of schedulesData) {
    await (prisma as any).pickupSchedule.upsert({
      where: { id: sched.id },
      update: { pickupDay: sched.pickupDay, isActive: true },
      create: { id: sched.id, locationId: sched.locationId, pickupDay: sched.pickupDay, isActive: true },
    })
  }

  console.log('✅ Pickup schedules seeded')

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
