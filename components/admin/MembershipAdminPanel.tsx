'use client'

import { useEffect, useState } from 'react'

type MembershipTier = 'APERTURA' | 'COLLEZIONE' | 'RISERVA'

const MEMBERSHIP_TIERS: Array<{ id: MembershipTier; label: string; bottles: number; description: string }> = [
  {
    id: 'APERTURA',
    label: 'Apertura',
    bottles: 2,
    description: 'Monthly curated selection of 2 premium bottles for entry-level members.',
  },
  {
    id: 'COLLEZIONE',
    label: 'Collezione',
    bottles: 3,
    description: 'Monthly curated selection of 3 special-release wines for collectors.',
  },
  {
    id: 'RISERVA',
    label: 'Riserva',
    bottles: 4,
    description: 'Monthly curated selection of 4 of our finest reserve bottlings.',
  },
]

interface TierSummary {
  tier: string
  activeSubscriptions: number
  requiredBottles: number
  activeBottles: number
  issues: string[]
}

interface SubscriptionRecord {
  id: string
  tier: string
  status: string
  stripeSubscriptionId: string | null
  currentPeriodEnd: string | null
  user: { name: string | null; email: string }
}

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  details: any
  createdAt: string
}

export default function MembershipAdminPanel() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [tier, setTier] = useState<MembershipTier>('APERTURA')
  const [statusData, setStatusData] = useState<{ tierSummaries: TierSummary[]; memberships: SubscriptionRecord[] } | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/memberships/status?month=${month}&year=${year}`)
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Unable to fetch membership status')
      }
      const data = await res.json()
      setStatusData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch membership status')
      setStatusData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchAudit = async () => {
    try {
      const res = await fetch('/api/admin/memberships/audit?limit=12')
      if (!res.ok) return
      const data = await res.json()
      setAuditLogs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load audit logs', err)
    }
  }

  const generateShipments = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/memberships/shipments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, month, year }),
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || payload?.message || 'Failed to generate shipments')
      }
      setMessage(payload.message || 'Shipments generated successfully')
      fetchStatus()
      fetchAudit()
    } catch (err: any) {
      setError(err.message || 'Shipment generation failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [month, year])

  useEffect(() => {
    fetchAudit()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white border border-olive-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-olive-900">Membership Operations</h2>
            <p className="text-sm text-olive-500 mt-1">
              Control curated selections, validate tier fulfillment, and generate subscription shipments for the current period.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchStatus}
              className="btn-outline"
              type="button"
            >
              Refresh status
            </button>
            <button
              onClick={fetchAudit}
              className="btn-outline"
              type="button"
            >
              Load audit log
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {statusData?.tierSummaries?.map((summary) => (
            <div key={summary.tier} className="bg-parchment-50 border border-olive-200 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-olive-500 mb-2">{summary.tier}</p>
              <p className="text-2xl font-serif font-bold text-olive-900">{summary.activeSubscriptions}</p>
              <p className="text-sm text-olive-600">Active subscriptions</p>
              <p className="text-sm text-olive-700 mt-3">{summary.requiredBottles} bottles required</p>
              <p className="text-sm text-olive-700">{summary.activeBottles} bottles committed</p>
              {summary.issues?.length > 0 && (
                <p className="text-xs text-amber-700 mt-3">{summary.issues.length} issue(s) found</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3 items-end">
          <label className="block">
            <span className="text-sm font-medium text-olive-700">Tier</span>
            <select
              value={tier}
              onChange={(event) => setTier(event.target.value as MembershipTier)}
              className="input-field mt-2"
            >
              {MEMBERSHIP_TIERS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-olive-700">Month</span>
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="input-field mt-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-olive-700">Year</span>
            <input
              type="number"
              min={2024}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="input-field mt-2"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={generateShipments}
            disabled={loading}
            className="btn-primary"
            type="button"
          >
            {loading ? 'Generating…' : 'Generate shipments'}
          </button>
          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-amber-700">{error}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white border border-olive-200 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-olive-900">Active Subscriptions</h3>
              <p className="text-sm text-olive-500">Latest membership subscribers and billing state.</p>
            </div>
            <button onClick={fetchStatus} className="text-sm text-olive-700 hover:text-olive-900">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-olive-200 text-olive-500 uppercase tracking-[0.14em] text-[10px]">
                  <th className="py-3">Member</th>
                  <th className="py-3">Tier</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Renewal</th>
                </tr>
              </thead>
              <tbody>
                {statusData?.memberships?.length ? (
                  statusData.memberships.map((subscription) => (
                    <tr key={subscription.id} className="border-b border-olive-100 last:border-0">
                      <td className="py-3 text-sm text-olive-700">
                        {subscription.user.name || subscription.user.email}
                        <div className="text-xs text-olive-500">{subscription.user.email}</div>
                      </td>
                      <td className="py-3 text-sm text-olive-700">{subscription.tier}</td>
                      <td className="py-3 text-sm text-olive-700">{subscription.status}</td>
                      <td className="py-3 text-sm text-olive-700">{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-olive-400">No active membership subscriptions for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-olive-200 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-olive-900">Audit Log</h3>
              <p className="text-sm text-olive-500">Recent membership actions and shipment events.</p>
            </div>
            <button onClick={fetchAudit} className="text-sm text-olive-700 hover:text-olive-900">Reload</button>
          </div>
          <div className="space-y-3">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-olive-100 bg-parchment-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-olive-900">{log.action}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-olive-500">{new Date(log.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs text-olive-500 mt-2">{log.entityType} · {log.entityId}</p>
                  <pre className="mt-3 overflow-x-auto text-xs text-olive-600 bg-white border border-olive-100 rounded-xl p-3">{JSON.stringify(log.details, null, 2)}</pre>
                </div>
              ))
            ) : (
              <p className="text-sm text-olive-400">No audit records available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
