import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

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
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
