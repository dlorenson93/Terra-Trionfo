import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get counts
    const [
      totalVendors,
      totalProducts,
      totalOrders,
      pendingCompanies,
      pendingProducts,
    ] = await Promise.all([
      prisma.company.count({ where: { status: 'APPROVED' } }),
      prisma.product.count({ where: { status: 'APPROVED' } }),
      prisma.order.count(),
      prisma.company.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { status: 'PENDING' } }),
    ])

    // Calculate revenue
    const orders = await prisma.order.findMany({
      where: { status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } },
    })
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.total, 0)

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      totalVendors,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingCompanies,
      pendingProducts,
      recentOrders,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    // Return default stats on error to prevent dashboard crash
    return NextResponse.json(
      {
        totalVendors: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingCompanies: 0,
        pendingProducts: 0,
        recentOrders: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    )
  }
}
