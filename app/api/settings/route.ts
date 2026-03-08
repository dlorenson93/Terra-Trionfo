import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'default' } })
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Whitelist settable fields — admins only
    const {
      deliveryAllowedStates,
      deliveryDaysOfWeek,
      deliveryFeeCents,
      defaultMarketplaceMarkupPercent,
    } = body

    const updateData: any = {}
    if (deliveryAllowedStates !== undefined) updateData.deliveryAllowedStates = deliveryAllowedStates
    if (deliveryDaysOfWeek !== undefined) updateData.deliveryDaysOfWeek = deliveryDaysOfWeek
    if (deliveryFeeCents !== undefined) updateData.deliveryFeeCents = deliveryFeeCents
    if (defaultMarketplaceMarkupPercent !== undefined) updateData.defaultMarketplaceMarkupPercent = defaultMarketplaceMarkupPercent

    const updated = await prisma.settings.update({
      where: { id: 'default' },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
