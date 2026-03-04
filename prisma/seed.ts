import { PrismaClient, UserRole, CompanyStatus, ProductStatus, OrderStatus, ModelType } from '@prisma/client'
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
      update: {},
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
      category: 'Oils & Vinegars',
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
      category: 'Wines',
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
      category: 'Pasta & Grains',
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
      category: 'Oils & Vinegars',
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
      category: 'Canned Goods',
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
      category: 'Specialty',
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
      update: {},
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
        ],
      },
    },
  })

  console.log('✅ Sample order created')

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
