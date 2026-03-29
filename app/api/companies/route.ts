import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // public visitors can list approved producers, so don't require auth

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined
    const isFoundingProducer = searchParams.get('isFoundingProducer')
    const forcePublic = searchParams.get('public') === 'true'

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (isFoundingProducer === 'true') {
      where.isFoundingProducer = true
    }

    // if no session (public), consumer, or explicitly requesting public view → only approved + LIVE
    if (forcePublic || !session || session.user.role === 'CONSUMER') {
      where.status = 'APPROVED'
      where.contentStatus = 'LIVE'
    }

    // Vendors can only see their own companies even if approved/editable
    if (session && session.user.role === 'VENDOR') {
      where.ownerId = session.user.id
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(limit ? { take: limit } : {}),
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Get companies error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, contactEmail, phone, address, description, region, country, website, bio } = body

    if (!name || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const companyData: any = {
      name,
      contactEmail,
      phone,
      address,
      description,
      region,
      country,
      website,
      bio,
      ownerId: session.user.id,
    }

    // Admins can pre-approve companies they create directly
    if (session.user.role === 'ADMIN') {
      companyData.status = body.status ?? 'APPROVED'
    }

    const company = await prisma.company.create({
      data: companyData,
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

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('Create company error:', error)
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    )
  }
}
