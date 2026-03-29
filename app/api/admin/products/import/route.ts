import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      slug,
      name,
      description,
      type,
      appellation,
      region,
      producerId,
      internalWholesalePriceEUR,
      consumerPurchasePriceUSD,
      isFoundingWine,
    } = body

    if (!id || !slug || !name || !producerId || consumerPurchasePriceUSD == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the producer company exists — producerId from the wine data
    // is the producer's slug (e.g. "stroppiana"), not the DB cuid
    const company = await prisma.company.findFirst({ where: { slug: producerId } })
    if (!company) {
      return NextResponse.json({ error: `Producer company '${producerId}' not found in DB` }, { status: 404 })
    }

    const product = await (prisma.product as any).upsert({
      where: { id },
      update: {},
      create: {
        id,
        slug,
        name,
        description: description ?? null,
        category: 'WINE',
        wineStyle: type ?? null,
        appellation: appellation ?? null,
        region: region ?? null,
        country: 'Italy',
        commerceModel: 'WHOLESALE',
        listingOwner: 'TERRA',
        wholesalePriceCents: Math.round((internalWholesalePriceEUR ?? 0) * 100),
        retailPriceCents: Math.round(consumerPurchasePriceUSD * 100),
        inventory: 0,
        status: 'PENDING',
        isFoundingWine: isFoundingWine ?? false,
        companyId: company.id,
      },
      include: {
        company: { select: { id: true, name: true, slug: true, status: true } },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A product with this slug already exists under a different ID' },
        { status: 409 }
      )
    }
    console.error('Import wine error:', error)
    return NextResponse.json({ error: 'Failed to import wine' }, { status: 500 })
  }
}
