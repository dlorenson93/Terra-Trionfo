import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscriptions = await prisma.subscription.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      shipments: {
        orderBy: { year: 'desc' },
        include: {
          orders: { select: { id: true, total: true, status: true, createdAt: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ subscriptions })
}
