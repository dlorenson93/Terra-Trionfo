import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, productId, notes } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'productId is required.' }, { status: 400 })
    }

    // Verify product exists and is visible
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'APPROVED' },
      select: { id: true, name: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    // Sanitise inputs
    const cleanEmail = email.trim().toLowerCase().slice(0, 254)
    const cleanNotes = notes ? String(notes).trim().slice(0, 500) : null

    const entry = await (prisma as any).waitlist.create({
      data: {
        email: cleanEmail,
        notes: cleanNotes,
        productId,
      },
      select: { id: true, createdAt: true },
    })

    return NextResponse.json({ success: true, id: entry.id }, { status: 201 })
  } catch (error) {
    console.error('[Waitlist API]', error)
    return NextResponse.json({ error: 'Failed to record interest.' }, { status: 500 })
  }
}
