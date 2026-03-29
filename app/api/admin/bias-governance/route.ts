/**
 * /api/admin/bias-governance
 *
 * GET  — Return the current BiasGovernance singleton + computed sufficiency.
 * PATCH — Update biasEnabled and/or biasMode.
 *
 * ADMIN-only. The singleton row is upserted on first read if it doesn't exist.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import {
  deriveBiasDataSufficiency,
  isBiasSafeToApply,
}                                    from '@/lib/deriveBiasDataSufficiency'

export const dynamic = 'force-dynamic'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Ensure the singleton row exists and return it with a computed sufficiency. */
async function getGovernance() {
  // Upsert: if no row exists, create with defaults
  const row = await (prisma as any).biasGovernance.upsert({
    where:  { id: 'singleton' },
    create: {
      id:          'singleton',
      biasEnabled: false,
      biasMode:    'OBSERVE_ONLY',
      updatedAt:   new Date(),
    },
    update: {},  // No-op update so upsert returns existing row unchanged
  })

  // Derive current sufficiency from last known measured count
  const total       = row.totalMeasuredAtLastCompute ?? 0
  const sufficiency = deriveBiasDataSufficiency(total)
  const safeToApply = isBiasSafeToApply(total, row.biasEnabled, row.biasMode)

  return { ...row, computedSufficiencyStatus: sufficiency, safeToApply }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const governance = await getGovernance()
  return NextResponse.json(governance)
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let body: { biasEnabled?: boolean; biasMode?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { biasEnabled, biasMode } = body

  // Validate biasMode if provided
  const validModes = ['OFF', 'OBSERVE_ONLY', 'APPLY_TO_CONFIDENCE']
  if (biasMode !== undefined && !validModes.includes(biasMode)) {
    return NextResponse.json({ error: `biasMode must be one of: ${validModes.join(', ')}` }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { updatedByUserId: session.user.id }
  if (biasEnabled !== undefined) updateData.biasEnabled = biasEnabled
  if (biasMode    !== undefined) updateData.biasMode    = biasMode

  // If transitioning to APPLY_TO_CONFIDENCE, record application timestamp
  if (biasMode === 'APPLY_TO_CONFIDENCE' || biasEnabled === true) {
    const current = await (prisma as any).biasGovernance.findUnique({ where: { id: 'singleton' } })
    const wouldApply = isBiasSafeToApply(
      current?.totalMeasuredAtLastCompute ?? 0,
      biasEnabled ?? current?.biasEnabled ?? false,
      biasMode    ?? current?.biasMode    ?? 'OBSERVE_ONLY',
    )
    if (wouldApply) {
      updateData.biasLastAppliedAt = new Date()
    }
  }

  await (prisma as any).biasGovernance.upsert({
    where:  { id: 'singleton' },
    create: {
      id:          'singleton',
      biasEnabled: biasEnabled ?? false,
      biasMode:    biasMode    ?? 'OBSERVE_ONLY',
      updatedAt:   new Date(),
      ...updateData,
    },
    update: updateData,
  })

  const governance = await getGovernance()
  return NextResponse.json(governance)
}
