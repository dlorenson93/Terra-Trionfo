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

import { PrismaClient, UserRole, CompanyStatus, ProductStatus, OrderStatus, CommerceModel, ListingOwner, FulfillmentType, ProductCategory } from '@prisma/client'
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

  // Create sample producer companies
  const companiesData = [
    {
      id: 'sample-company',
      name: 'Famiglia Rossi Farms',
      slug: 'famiglia-rossi',
      contactEmail: 'vendor@example.com',
      phone: '+39 123 456 7890',
      address: 'Via delle Vigne 42, Tuscany, Italy',
      description: 'Family-owned farm producing organic olive oil and wines since 1890',
      bio: 'We are a multi-generational Tuscany farm, passionate about sustainable agriculture and fine foods.',
      region: 'Tuscany',
      country: 'Italy',
      website: 'https://famigliarossi.example.com',
      heroImageUrl: 'https://images.unsplash.com/photo-1506801310323-534be5e7bbfd?w=1200',
      status: CompanyStatus.APPROVED,
      ownerId: vendorUser.id,
    },
    {
      id: 'sample-company-2',
      name: 'Vini del Sud',
      slug: 'vini-del-sud',
      contactEmail: 'vendor2@example.com',
      phone: '+39 098 765 4321',
      address: 'Via del Vino 10, Puglia, Italy',
      description: 'Specializing in organic red wines from the heel of Italy.',
      bio: 'Crafted with care from our vineyards in Puglia, our wines celebrate southern Italian terroir.',
      region: 'Puglia',
      country: 'Italy',
      website: 'https://vinidelsud.example.com',
      heroImageUrl: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200',
      status: CompanyStatus.APPROVED,
      ownerId: vendorUser.id,
    },
    {
      id: 'sample-company-3',
      name: 'La Pasta Perfetta',
      slug: 'la-pasta-perfetta',
      contactEmail: 'vendor3@example.com',
      phone: '+39 111 222 3333',
      address: 'Via della Farina 5, Emilia-Romagna, Italy',
      description: 'Handmade artisanal pasta made daily in the heart of Emilia-Romagna.',
      bio: 'Our nonna taught us to make pasta by hand, and we continue the tradition with love.',
      region: 'Emilia-Romagna',
      country: 'Italy',
      website: 'https://pastaperfetta.example.com',
      heroImageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f4a8d0a76c?w=1200',
      status: CompanyStatus.APPROVED,
      ownerId: vendorUser.id,
    },
  ]

  const companies = []
  for (const comp of companiesData) {
    const created = await prisma.company.upsert({
      where: { id: comp.id as string },
      update: { contentStatus: 'DRAFT' } as any,
      create: comp as any,
    })
    companies.push(created)
  }

  console.log('✅ Companies created')

  // Create products
  const products: any[] = [
    {
      id: 'prod-1',
      name: 'Extra Virgin Olive Oil',
      description: 'Cold-pressed from Tuscan olives, perfect for salads and finishing dishes',
      category: ProductCategory.OLIVE_OIL,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800',
      commerceModel: 'MARKETPLACE',
      listingOwner: 'VENDOR',
      vendorPriceCents: 2400,
      retailPriceCents: 2999,
      inventory: 50,
      status: ProductStatus.APPROVED,
      companyId: companies[0].id,
    },
    {
      id: 'prod-2',
      name: 'Chianti Classico DOCG 2020',
      description: 'Full-bodied red wine with notes of cherry and violet',
      category: ProductCategory.WINE,
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
      commerceModel: 'WHOLESALE',
      listingOwner: 'TERRA',
      wholesalePriceCents: 1200,
      retailPriceCents: 3599,
      inventory: 30,
      status: ProductStatus.APPROVED,
      companyId: companies[1].id,
    },
    {
      id: 'prod-3',
      name: 'Artisan Pasta Variety Pack',
      description: 'Handmade pasta including pappardelle, tagliatelle, and fettuccine',
      category: ProductCategory.FOOD,
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
      commerceModel: 'HYBRID',
      listingOwner: 'VENDOR',
      vendorPriceCents: 1800,
      wholesalePriceCents: 800,
      retailPriceCents: 2160,
      inventory: 75,
      status: ProductStatus.APPROVED,
      companyId: companies[2].id,
    },
    {
      id: 'prod-4',
      name: 'Aged Balsamic Vinegar',
      description: '25-year aged balsamic from Modena, perfect for gourmet dishes',
      category: ProductCategory.OLIVE_OIL,
      imageUrl: 'https://images.unsplash.com/photo-1452251889946-8ff5ea7b27ab?w=800',
      commerceModel: 'MARKETPLACE',
      listingOwner: 'VENDOR',
      vendorPriceCents: 4500,
      retailPriceCents: 5400,
      inventory: 20,
      status: ProductStatus.APPROVED,
      companyId: companies[0].id,
    },
    {
      id: 'prod-5',
      name: 'San Marzano Tomatoes',
      description: 'DOP certified tomatoes from the volcanic soil of Mount Vesuvius',
      category: ProductCategory.FOOD,
      imageUrl: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=800',
      commerceModel: 'WHOLESALE',
      listingOwner: 'TERRA',
      wholesalePriceCents: 350,
      retailPriceCents: 899,
      inventory: 100,
      status: ProductStatus.APPROVED,
      companyId: companies[1].id,
    },
    {
      id: 'prod-6',
      name: 'Truffle-Infused Honey',
      description: 'Rare black truffle honey, perfect for cheese and charcuterie',
      category: ProductCategory.FOOD,
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784099?w=800',
      commerceModel: 'MARKETPLACE',
      listingOwner: 'VENDOR',
      vendorPriceCents: 3200,
      retailPriceCents: 3840,
      inventory: 15,
      status: ProductStatus.PENDING,
      companyId: companies[2].id,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: { contentStatus: 'DRAFT' } as any,
      create: product,
    })
  }

  console.log('✅ Products created')

  // Create a sample order
  const order = await prisma.order.create({
    data: {
      userId: consumerUser.id,
      total: 68.98,
      status: OrderStatus.DELIVERED,
      fulfillmentType: 'PICKUP',
      deliveryFeeCents: 0,
      orderItems: {
        create: [
          {
            productId: 'prod-1',
            quantity: 1,
            unitPrice: 29.99,
            commerceModel: 'MARKETPLACE',
          },
          {
            productId: 'prod-5',
            quantity: 2,
            unitPrice: 8.99,
            commerceModel: 'WHOLESALE',
          },
          {
            productId: 'prod-3',
            quantity: 1,
            unitPrice: 21.60,
            commerceModel: 'MARKETPLACE',
          },
        ] as any,
      },
    } as any,
  })

  console.log('✅ Sample order created')

  // ── Enrich founding producer companies ──────────────────────────────────
  await prisma.company.update({
    where: { id: 'sample-company' },
    data: {
      isFoundingProducer: true,
      contentStatus: 'DRAFT',
      shortDescription: 'Multi-generational Tuscan farm producing estate olive oil and wine since 1890.',
      story:
        'Founded by Nonno Giovanni Rossi in 1890, our family has tended these Tuscan hills through every harvest. Today, the fourth generation maintains the same organic principles and hand-harvesting techniques that have defined our oils and wines for over a century.',
      winemakerName: 'Marco Rossi',
      winemakerBio:
        'Marco studied enology in Florence and returned to modernize the cellar while preserving the traditional blending methods his grandfather used.',
      foundedYear: 1890,
      sustainablePractices:
        'Certified organic since 1998. Rain-fed vineyards, no synthetic pesticides. Pomace compost returns nutrients to the soil.',
    } as any,
  })

  await prisma.company.update({
    where: { id: 'sample-company-2' },
    data: {
      isFoundingProducer: true,
      contentStatus: 'DRAFT',
      shortDescription: "Organic red wines from the sun-drenched terroir of Puglia's Salento peninsula.",
      story:
        "Vini del Sud was born from a belief that Puglia's Primitivo and Negroamaro deserve the same reverence as Barolo or Brunello. Our small-batch approach keeps each vintage limited and expressive.",
      winemakerName: 'Lucia De Santis',
      winemakerBio:
        "Lucia trained under a master enologist in Lecce, then returned to her family's land to craft wines that reflect Puglia's warmth and mineral complexity.",
      foundedYear: 2003,
      sustainablePractices:
        'Dry-farmed bush vines averaging 40 years old. Minimal-intervention winemaking with indigenous yeasts. No additives.',
    } as any,
  })

  console.log('✅ Companies enriched with founding producer data')

  // ── Enrich wine and olive oil products ──────────────────────────────────
  await prisma.product.update({
    where: { id: 'prod-2' },
    data: {
      slug: 'chianti-classico-docg-2020',
      contentStatus: 'DRAFT',
      vintage: 2020,
      appellation: 'Chianti Classico DOCG',
      designation: 'Riserva',
      country: 'Italy',
      region: 'Tuscany',
      subregion: 'Gaiole in Chianti',
      grapeVarietals: ['Sangiovese', 'Canaiolo'],
      wineStyle: 'Red',
      body: 'Full',
      acidity: 'High',
      tannin: 'Medium-High',
      abv: 13.5,
      bottleSizeMl: 750,
      tastingNotesShort:
        'Vibrant cherry, dried violet, and earthy tobacco on the nose — silky on the palate with a long, spice-laced finish.',
      aromaNotes: 'Fresh cherry, dried violet, subtle tobacco, and a hint of leather.',
      palateNotes:
        'Rounded tannins, bright acidity, flavors of sour cherry, spice, and earthy mineral notes.',
      finishNotes: 'Long and persistent with lingering dried fruit and a touch of cedar.',
      vinification:
        'Fermented on skins for 14 days in stainless steel, gently pressed and aged in Slovenian oak.',
      aging: '24 months in large Slavonian oak casks, followed by 6 months in bottle.',
      servingTemperature: '16–18 °C (62–64 °F)',
      decantingNotes: 'Decant 30 minutes before serving to soften tannins.',
      foodPairings: ['Bistecca alla Fiorentina', 'Aged Pecorino', 'Wild boar ragu', 'Mushroom risotto'],
      sustainabilityNotes: 'Organic viticulture. Estate-bottled. Gravity-flow winery.',
      producerStoryExcerpt:
        'Our Chianti Classico comes from a single block of Sangiovese vines planted in 2003 at 380 metres altitude, where cool nights preserve aromatic intensity and natural acidity.',
      isFoundingWine: true,
    } as any,
  })

  await prisma.product.update({
    where: { id: 'prod-1' },
    data: {
      slug: 'extra-virgin-olive-oil-tuscany',
      contentStatus: 'DRAFT',
      country: 'Italy',
      region: 'Tuscany',
      sustainabilityNotes:
        'Hand-harvested from our certified organic grove. Cold-pressed within 24 hours of picking.',
      producerStoryExcerpt:
        'This oil comes from the same grove my grandfather planted in 1952. Each bottle is numbered by hand and represents a single harvest.',
      isFeatured: true,
    } as any,
  })

  console.log('✅ Products enriched with wine and editorial data')

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
