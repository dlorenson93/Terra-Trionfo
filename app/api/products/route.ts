import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VISIBLE_CATEGORIES } from '@/config/marketplace'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const companyId = searchParams.get('companyId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '0', 10)
    const forcePublic = searchParams.get('public') === 'true'

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

    // Vendors can only see their own products
    if (session && session.user.role === 'VENDOR') {
      const companies = await prisma.company.findMany({
        where: { ownerId: session.user.id },
        select: { id: true },
      })
      where.companyId = { in: companies.map((c: { id: string }) => c.id) }
    }

    const queryOptions: any = {
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }
    if (limit > 0) queryOptions.take = limit

    const products = await prisma.product.findMany(queryOptions)

    return NextResponse.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
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
