import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const companyId = searchParams.get('companyId')
    const status = searchParams.get('status')

    const where: any = {}

    // Public users only see approved products from approved companies
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'CONSUMER') {
      where.status = 'APPROVED'
      where.company = {
        status: 'APPROVED',
      }
    }

    // Filter by status for admin/vendor views
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
      where.companyId = { in: companies.map((c) => c.id) }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

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
      isMarketplace,
      isWholesale,
      basePrice,
      wholesaleCost,
      consumerPrice,
      inventory,
    } = body

    if (!companyId || !name || !category) {
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

    // Calculate consumer price if not provided
    let finalConsumerPrice = consumerPrice
    if (!finalConsumerPrice && isMarketplace && basePrice) {
      const settings = await prisma.settings.findFirst()
      const markup = settings?.defaultMarketplaceMarkupPercent || 20
      finalConsumerPrice = basePrice * (1 + markup / 100)
    }

    const product = await prisma.product.create({
      data: {
        companyId,
        name,
        description,
        category,
        imageUrl,
        isMarketplace: isMarketplace || false,
        isWholesale: isWholesale || false,
        basePrice: isMarketplace ? basePrice : null,
        wholesaleCost: isWholesale ? wholesaleCost : null,
        consumerPrice: finalConsumerPrice || 0,
        inventory: inventory || 0,
      },
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
