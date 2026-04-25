import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PROFORMA_DATA, PROFORMA_COUNTS_BY_PRODUCER } from '../../../../../data/proforma'

export const dynamic = 'force-dynamic'

/**
 * Generate portfolio inventory guidance from the canonical Phase 27A proforma dataset.
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

    return NextResponse.json(
      {
        message: 'Canonical Phase 27A proforma portfolio generated from shared data',
        wineCount: PROFORMA_DATA.length,
        targetByProducer: PROFORMA_COUNTS_BY_PRODUCER,
        wines: PROFORMA_DATA,
        instructions: [
          'Use PROFORMA_DATA as the canonical Phase 27A wine source for inventory alignment.',
          'Enrich these entries with UI-specific fields as needed for data/wines.ts or product seed data.',
          'Run POST /api/admin/inventory/sync-proforma to align matched products with proforma inventory and pricing.',
          'Use POST /api/admin/inventory/match-analysis to inspect any unmatched proforma entries.',
        ],
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[portfolio-generator] Error:', err)
    return NextResponse.json(
      {
        error: 'Failed to generate portfolio wines',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
