import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VISIBLE_CATEGORIES } from '@/config/marketplace'
import { getAllowedCommerceModelsForCategory, isCategoryEligibleForCommerceModel } from '@/lib/productCommerceRules'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const companyId = searchParams.get('companyId')
    const status = searchParams.get('status')
    const forcePublic = searchParams.get('public') === 'true'
    const q = searchParams.get('q')?.trim() || ''
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1',  10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '48', 10)))
    const skip  = (page - 1) * limit

    const where: any = {}

    // Public consumers see only approved + LIVE products from approved companies
    const session = await getServerSession(authOptions)
    if (forcePublic || !session || session.user.role === 'CONSUMER') {
      where.status = 'APPROVED'
      where.contentStatus = 'LIVE'
      where.company = { status: 'APPROVED' }
      // Only show currently visible categories to public
      where.category = { in: VISIBLE_CATEGORIES as unknown as string[] }
    }

    if (status && session && session.user.role !== 'CONSUMER') {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (companyId) {
      where.companyId = companyId
    }

    if (q) {
      where.OR = [
        { name:        { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { appellation: { contains: q, mode: 'insensitive' } },
        { region:      { contains: q, mode: 'insensitive' } },
        { producerDisplayName: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Vendors can only see their own products
    if (session && session.user.role === 'VENDOR') {
      const companies = await prisma.company.findMany({
        where: { ownerId: session.user.id },
        select: { id: true },
      })
      where.companyId = { in: companies.map((c: { id: string }) => c.id) }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          company: {
            select: { id: true, name: true, slug: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({ products, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Get products error:', error)
    // Return empty products list instead of 500 to prevent dashboard crash
    return NextResponse.json(
      { products: [], total: 0, page: 1, limit: 48, pages: 0, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      companyId,
      name,
      description,
      category,
      imageUrl,
      commerceModel,
      listingOwner,
      vendorPrice,
      wholesalePrice,
      retailPrice, // dollars
      retailPriceCents: providedRetailPriceCents, // optional
      inventory,
    } = body

    if (!companyId || !name || !category || !commerceModel || !listingOwner) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!isCategoryEligibleForCommerceModel(category, commerceModel)) {
      const allowedModels = getAllowedCommerceModelsForCategory(category).join(', ')
      return NextResponse.json(
        { error: `Category ${category} can only be listed under: ${allowedModels}` },
        { status: 400 }
      )
    }

    // Verify company ownership
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company || company.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (company.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Company must be approved first' },
        { status: 400 }
      )
    }

    // convert prices to cents
    const vendorPriceCents = vendorPrice ? Math.round(vendorPrice * 100) : null
    const wholesalePriceCents = wholesalePrice ? Math.round(wholesalePrice * 100) : null
    let retailPriceCents: number | null = null

    if (providedRetailPriceCents != null) {
      retailPriceCents = providedRetailPriceCents
    } else if (retailPrice != null) {
      retailPriceCents = Math.round(retailPrice * 100)
    }

    // if marketplace and no retail price given, apply default markup
    if (!retailPriceCents && commerceModel === 'MARKETPLACE' && vendorPriceCents) {
      const settings = await prisma.settings.findFirst()
      const markup = settings?.defaultMarketplaceMarkupPercent || 20
      retailPriceCents = Math.round(vendorPriceCents * (1 + markup / 100))
    }

    const product = await prisma.product.create({
      data: {
        companyId,
        name,
        description,
        category,
        imageUrl,
        commerceModel,
        listingOwner,
        vendorPriceCents,
        wholesalePriceCents,
        retailPriceCents: retailPriceCents || 0,
        inventory: inventory || 0,
      } as any,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
