import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PROFORMA_DATA } from '../../../../../data/proforma'

export const dynamic = 'force-dynamic'

/**
 * Phase 27A Alignment Orchestration
 * Provides admin with step-by-step workflow to align database with Phase 27A proforma.
 * 
 * Process Flow:
 * 1. GET this endpoint — review the workflow
 * 2. POST /api/admin/inventory/cleanup-duplicates — remove duplicate products
 * 3. POST /api/admin/inventory/sync-proforma — sync 27 wines with exact data
 */

interface AlignmentStep {
  step: number
  title: string
  endpoint: string
  method: 'GET' | 'POST'
  description: string
  expectedOutcome: string
}

interface AlignmentGuide {
  phase: string
  title: string
  objective: string
  workflow: AlignmentStep[]
  summary: {
    totalWines: number
    producers: string[]
    expectedDuplicateRemoval: string
    expectedSKUAssignment: string
  }
}

export async function GET(request: Request) {
  try {
    // ADMIN-ONLY ACCESS
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const guide: AlignmentGuide = {
      phase: 'Phase 27A',
      title: 'Master Inventory Realignment — Proforma Sync',
      objective:
        'Align database with verified supplier proforma data (27 wines across 6 producers). Removes duplicates, assigns SKUs, and recalculates pricing from EUR cost basis.',
      workflow: [
        {
          step: 1,
          title: 'Cleanup Duplicates',
          endpoint: '/api/admin/inventory/cleanup-duplicates',
          method: 'POST',
          description:
            'Removes duplicate products (multiple entries with same producer + name). Identifies out-of-scope wines not in Phase 27A proforma.',
          expectedOutcome:
            'Report showing: duplicates removed, out-of-scope products flagged (not deleted), preserved products count.',
        },
        {
          step: 2,
          title: 'Sync Proforma',
          endpoint: '/api/admin/inventory/sync-proforma',
          method: 'POST',
          description:
            'For each of the 27 wines: matches to existing product, assigns deterministic SKU (TT-PRODUCER-WINE-VINTAGE-FORMAT), overwrites inventory with exact quantity, aligns cost (EUR), recalculates pricing via pricing engine, updates release status.',
          expectedOutcome:
            'Report showing: products updated (target: 27), unmatched entries (0 if all found), pricing changes detailed.',
        },
      ],
      summary: {
        totalWines: PROFORMA_DATA.length,
        producers: Array.from(new Set(PROFORMA_DATA.map((entry) => entry.producerId))),
        expectedDuplicateRemoval:
          'Any products with duplicate producer+name combinations (e.g., "Barolo Leonardo" appearing twice)',
        expectedSKUAssignment: 'All 27 matched products will receive SKU in format TT-{PRODUCER}-{WINE}-{VINTAGE}-{FORMAT}',
      },
    }

    return NextResponse.json(
      {
        success: true,
        guide,
        instructions: [
          '1. Review this workflow guide',
          '2. Execute Step 1: POST /api/admin/inventory/cleanup-duplicates',
          '3. Review duplicate report',
          '4. Execute Step 2: POST /api/admin/inventory/sync-proforma',
          '5. Review sync report and verify 27 products updated',
          '6. Confirm all admin dashboards reflect updated inventory/pricing/SKUs',
        ],
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[alignment-guide] Error:', err)
    return NextResponse.json(
      {
        error: 'Failed to retrieve alignment guide',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
