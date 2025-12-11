import { PrismaClient, UserRole } from '@prisma/client'
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

  // Create company
  const company = await prisma.company.upsert({
    where: { id: 'sample-company' },
    update: {},
    create: {
      id: 'sample-company',
      name: 'Famiglia Rossi Farms',
      contactEmail: 'vendor@example.com',
      phone: '+39 123 456 7890',
      address: 'Via delle Vigne 42, Tuscany, Italy',
      description: 'Family-owned farm producing organic olive oil and wines since 1890',
      status: 'APPROVED',
      ownerId: vendorUser.id,
    },
  })

  console.log('✅ Company created')

  // Create products
  const products = [
    {
      id: 'prod-1',
      name: 'Extra Virgin Olive Oil',
      description: 'Cold-pressed from Tuscan olives, perfect for salads and finishing dishes',
      category: 'Oils & Vinegars',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800',
      isMarketplace: true,
      isWholesale: false,
      basePrice: 24.99,
      consumerPrice: 29.99, // 20% markup
      inventory: 50,
      status: 'APPROVED',
      companyId: company.id,
    },
    {
      id: 'prod-2',
      name: 'Chianti Classico DOCG 2020',
      description: 'Full-bodied red wine with notes of cherry and violet',
      category: 'Wines',
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
      isMarketplace: false,
      isWholesale: true,
      wholesaleCost: 12.00,
      consumerPrice: 35.99,
      inventory: 30,
      status: 'APPROVED',
      companyId: company.id,
    },
    {
      id: 'prod-3',
      name: 'Artisan Pasta Variety Pack',
      description: 'Handmade pasta including pappardelle, tagliatelle, and fettuccine',
      category: 'Pasta & Grains',
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
      isMarketplace: true,
      isWholesale: true,
      basePrice: 18.00,
      wholesaleCost: 8.00,
      consumerPrice: 21.60, // Using marketplace pricing
      inventory: 75,
      status: 'APPROVED',
      companyId: company.id,
    },
    {
      id: 'prod-4',
      name: 'Aged Balsamic Vinegar',
      description: '25-year aged balsamic from Modena, perfect for gourmet dishes',
      category: 'Oils & Vinegars',
      imageUrl: 'https://images.unsplash.com/photo-1452251889946-8ff5ea7b27ab?w=800',
      isMarketplace: true,
      isWholesale: false,
      basePrice: 45.00,
      consumerPrice: 54.00,
      inventory: 20,
      status: 'APPROVED',
      companyId: company.id,
    },
    {
      id: 'prod-5',
      name: 'San Marzano Tomatoes',
      description: 'DOP certified tomatoes from the volcanic soil of Mount Vesuvius',
      category: 'Canned Goods',
      imageUrl: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=800',
      isMarketplace: false,
      isWholesale: true,
      wholesaleCost: 3.50,
      consumerPrice: 8.99,
      inventory: 100,
      status: 'APPROVED',
      companyId: company.id,
    },
    {
      id: 'prod-6',
      name: 'Truffle-Infused Honey',
      description: 'Rare black truffle honey, perfect for cheese and charcuterie',
      category: 'Specialty',
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784099?w=800',
      isMarketplace: true,
      isWholesale: false,
      basePrice: 32.00,
      consumerPrice: 38.40,
      inventory: 15,
      status: 'PENDING',
      companyId: company.id,
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
      status: 'DELIVERED',
      orderItems: {
        create: [
          {
            productId: 'prod-1',
            quantity: 1,
            unitPrice: 29.99,
            modelType: 'MARKETPLACE',
          },
          {
            productId: 'prod-5',
            quantity: 2,
            unitPrice: 8.99,
            modelType: 'WHOLESALE',
          },
          {
            productId: 'prod-3',
            quantity: 1,
            unitPrice: 21.60,
            modelType: 'MARKETPLACE',
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
