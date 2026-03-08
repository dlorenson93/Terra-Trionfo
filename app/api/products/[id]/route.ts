import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
            description: true,
            status: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
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
