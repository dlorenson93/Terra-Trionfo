import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllowedCommerceModelsForCategory, isCategoryEligibleForCommerceModel } from '@/lib/productCommerceRules'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const isPublic = !session || session.user.role === 'CONSUMER'

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        ...(isPublic ? { status: 'APPROVED', contentStatus: 'LIVE' } : {}),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            status: true,
            region: true,
            country: true,
            shortDescription: true,
          },
        },
        restaurantWines: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
                city: true,
                state: true,
                cuisineType: true,
                priceRange: true,
                isFeatured: true,
                website: true,
              },
            },
          },
          ...(isPublic ? {
            where: {
              restaurant: { status: 'APPROVED', contentStatus: 'LIVE' },
            },
          } : {}),
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Related wines — same estate (exclude this product)
    const relatedByEstate = await prisma.product.findMany({
      where: {
        companyId: product.companyId,
        id: { not: product.id },
        status: 'APPROVED',
        contentStatus: 'LIVE',
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        category: true,
        retailPriceCents: true,
        vintage: true,
        appellation: true,
        grapeVarietals: true,
        tastingNotesShort: true,
        isFoundingWine: true,
        isLimitedAllocation: true,
        company: { select: { id: true, name: true, slug: true } },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    })

    // Related wines — scored by grape overlap, style, price band, region
    const companyRegion = (product.company as any).region as string | null
    const productGrapes = Array.isArray(product.grapeVarietals)
      ? (product.grapeVarietals as string[])
      : product.grapeVarietals
        ? [product.grapeVarietals as string]
        : []
    const priceLow = product.retailPriceCents ? Math.round(product.retailPriceCents * 0.6) : 0
    const priceHigh = product.retailPriceCents ? Math.round(product.retailPriceCents * 1.4) : 99999999

    const candidates = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        companyId: { not: product.companyId },
        status: 'APPROVED',
        contentStatus: 'LIVE',
        company: { status: 'APPROVED' },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        category: true,
        retailPriceCents: true,
        vintage: true,
        appellation: true,
        grapeVarietals: true,
        wineStyle: true,
        tastingNotesShort: true,
        isFoundingWine: true,
        isLimitedAllocation: true,
        company: { select: { id: true, name: true, slug: true, region: true } },
      },
    })

    const relatedByRegion = candidates
      .map((c) => {
        let score = 0
        const candidateRegion = (c.company as any)?.region as string | undefined
        if (companyRegion && candidateRegion?.toLowerCase().includes(companyRegion.toLowerCase())) {
          score += 2
        }
        if (product.wineStyle && c.wineStyle && product.wineStyle === c.wineStyle) {
          score += 2
        }
        const candidateGrapes = Array.isArray(c.grapeVarietals)
          ? (c.grapeVarietals as string[])
          : c.grapeVarietals
            ? [c.grapeVarietals as string]
            : []
        if (productGrapes.some((g) => candidateGrapes.some((cg) => cg.toLowerCase() === g.toLowerCase()))) {
          score += 3
        }
        if (c.retailPriceCents && c.retailPriceCents >= priceLow && c.retailPriceCents <= priceHigh) {
          score += 1
        }
        return { score, product: c }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ product: c }) => c)

    return NextResponse.json({ ...product, relatedByEstate, relatedByRegion })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json()

    // Get product with company info
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { company: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (
      session.user.role !== 'ADMIN' &&
      product.company.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Whitelist updatable fields to prevent privilege escalation
    // Vendors cannot change status, companyId, or listingOwner — only admins can
    const {
      name, description, category, imageUrl, commerceModel,
      retailPriceCents, wholesalePriceCents, vendorPriceCents, inventory,
      // Wine / editorial fields
      slug, producerDisplayName, vintage, appellation, designation,
      country, region, subregion, grapeVarietals, wineStyle, body: wineBody,
      acidity, tannin, abv, bottleSizeMl, tastingNotesShort, tastingNotesFull,
      aromaNotes, palateNotes, finishNotes, vinification, aging, vineyardNotes,
      servingTemperature, decantingNotes, foodPairings, sustainabilityNotes,
      producerStoryExcerpt, isLimitedAllocation, isFeatured, isFoundingWine, badgeText,
    } = requestBody
    if (commerceModel && category && !isCategoryEligibleForCommerceModel(category, commerceModel)) {
      const allowedModels = getAllowedCommerceModelsForCategory(category).join(', ')
      return NextResponse.json(
        { error: `Category ${category} can only be listed under: ${allowedModels}` },
        { status: 400 }
      )
    }

    const vendorData: any = {
      name, description, category, imageUrl, commerceModel,
      retailPriceCents, wholesalePriceCents, vendorPriceCents, inventory,
      slug, producerDisplayName, vintage, appellation, designation,
      country, region, subregion, grapeVarietals, wineStyle, body: wineBody,
      acidity, tannin, abv, bottleSizeMl, tastingNotesShort, tastingNotesFull,
      aromaNotes, palateNotes, finishNotes, vinification, aging, vineyardNotes,
      servingTemperature, decantingNotes, foodPairings, sustainabilityNotes,
      producerStoryExcerpt, isLimitedAllocation, isFeatured, isFoundingWine, badgeText,
    }
    Object.keys(vendorData).forEach((k) => vendorData[k] === undefined && delete vendorData[k])

    const adminData = session.user.role === 'ADMIN'
      ? { status: requestBody.status, listingOwner: requestBody.listingOwner, contentStatus: requestBody.contentStatus, ...vendorData }
      : vendorData

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: adminData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { company: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (
      session.user.role !== 'ADMIN' &&
      product.company.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
