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
    const isFoundingProducer = searchParams.get('isFoundingProducer')
    const forcePublic = searchParams.get('public') === 'true'
    const q = searchParams.get('q')?.trim() || ''
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1',  10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)))
    const skip  = (page - 1) * limit

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

    if (q) {
      where.OR = [
        { name:        { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { region:      { contains: q, mode: 'insensitive' } },
        { country:     { contains: q, mode: 'insensitive' } },
      ]
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ])

    return NextResponse.json({ companies, total, page, limit, pages: Math.ceil(total / limit) })
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
