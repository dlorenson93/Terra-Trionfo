import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Diagnostic endpoint to understand alignment issues
 * Returns detailed info about companies and wine products
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get all companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    })

    // Get all wine products with full details
    const wines = await prisma.product.findMany({
      where: { category: 'WINE' },
      select: {
        id: true,
        name: true,
        vintage: true,
        bottleSizeMl: true,
        format: true,
        inventory: true,
        costEUR: true,
        retailPriceCents: true,
        sku: true,
        status: true,
        company: { select: { name: true, slug: true } },
      },
      orderBy: { name: 'asc' },
    })

    // Group wines by company
    const winesByCompany = wines.reduce(
      (acc, wine) => {
        const companyName = wine.company.name
        if (!acc[companyName]) {
          acc[companyName] = []
        }
        acc[companyName].push(wine)
        return acc
      },
      {} as Record<string, typeof wines>
    )

    return NextResponse.json(
      {
        summary: {
          totalCompanies: companies.length,
          totalWines: wines.length,
          companiesWithWines: Object.keys(winesByCompany).length,
        },
        companies: companies.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          productCount: c._count.products,
          wineCount: winesByCompany[c.name]?.length || 0,
        })),
        winesByCompany,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[diagnose] Error:', err)
    return NextResponse.json(
      {
        error: 'Failed to retrieve diagnostic info',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
