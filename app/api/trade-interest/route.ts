import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const VALID_ACCOUNT_TYPES = ['restaurant', 'retailer', 'distributor', 'other']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, business, email, accountType, region, caseInterest, notes, productId } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }
    if (!business || typeof business !== 'string' || business.trim().length < 2) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }
    if (!accountType || !VALID_ACCOUNT_TYPES.includes(accountType)) {
      return NextResponse.json(
        { error: `accountType must be one of: ${VALID_ACCOUNT_TYPES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'productId is required.' }, { status: 400 })
    }

    // Verify product exists
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'APPROVED' },
      select: { id: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    // Sanitise
    const entry = await (prisma as any).tradeInterest.create({
      data: {
        name: name.trim().slice(0, 200),
        business: business.trim().slice(0, 200),
        email: email.trim().toLowerCase().slice(0, 254),
        accountType,
        region: region ? String(region).trim().slice(0, 100) : null,
        caseInterest: caseInterest ? Math.max(0, Math.min(10000, parseInt(caseInterest, 10))) : null,
        notes: notes ? String(notes).trim().slice(0, 1000) : null,
        productId,
      },
      select: { id: true, createdAt: true },
    })

    return NextResponse.json({ success: true, id: entry.id }, { status: 201 })
  } catch (error) {
    console.error('[Trade Interest API]', error)
    return NextResponse.json({ error: 'Failed to record interest.' }, { status: 500 })
  }
}
