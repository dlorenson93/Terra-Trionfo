import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        products: true,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Get company error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company' },
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

    const body = await request.json()

    // Check permissions
    const company = await prisma.company.findUnique({
      where: { id: params.id },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Admin can update status, vendor can update own company details
    if (
      session.user.role !== 'ADMIN' &&
      company.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Whitelist updatable fields to prevent privilege escalation
    // Vendors cannot change status or ownerId — only admins can
    const {
      name, contactEmail, phone, address, description, bio, region, country, website, heroImageUrl,
      // New storytelling fields
      shortDescription, story, subregion, galleryImages, locationLat, locationLng,
      sustainablePractices, winemakerName, winemakerBio, foodPairingNotes, foundedYear,
    } = body
    const vendorData: any = {
      name, contactEmail, phone, address, description, bio, region, country, website, heroImageUrl,
      shortDescription, story, subregion, galleryImages, locationLat, locationLng,
      sustainablePractices, winemakerName, winemakerBio, foodPairingNotes, foundedYear,
    }
    // Remove undefined keys so Prisma ignores them
    Object.keys(vendorData).forEach((k) => vendorData[k] === undefined && delete vendorData[k])

    const adminData = session.user.role === 'ADMIN'
      ? { status: body.status, isFoundingProducer: body.isFoundingProducer, contentStatus: body.contentStatus, ...vendorData }
      : vendorData

    const updatedCompany = await prisma.company.update({
      where: { id: params.id },
      data: adminData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error('Update company error:', error)
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    )
  }
}
