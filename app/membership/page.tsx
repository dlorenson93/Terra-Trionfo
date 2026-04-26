'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

type MembershipTier = 'APERTURA' | 'COLLEZIONE' | 'RISERVA'

const MEMBERSHIP_TIERS: Array<{ id: MembershipTier; label: string; bottles: number; description: string }> = [
  {
    id: 'APERTURA',
    label: 'Apertura',
    bottles: 2,
    description: 'A refined introduction membership with two thoughtfully selected bottles each month.',
  },
  {
    id: 'COLLEZIONE',
    label: 'Collezione',
    bottles: 3,
    description: 'A collector-focused membership with three premium bottles curated for discovery.',
  },
  {
    id: 'RISERVA',
    label: 'Riserva',
    bottles: 4,
    description: 'A reserve membership for discerning members with four standout bottles monthly.',
  },
]

export default function MembershipPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<MembershipTier>('APERTURA')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const joinMembership = async (tier: MembershipTier) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/memberships/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Unable to start membership checkout')
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start membership checkout')
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-parchment-100">
      <Header />
      <main className="flex-grow">
        <section className="bg-olive-900 text-parchment-100 py-20 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-olive-200 mb-4">Memberships</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold">Curated Wine Membership</h1>
            <p className="mt-4 text-base text-olive-100 max-w-3xl mx-auto">Join an importer-led membership program built around editorial curation, discovery, and quality inventory assurance.</p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid gap-6 lg:grid-cols-3">
            {MEMBERSHIP_TIERS.map((tier) => (
              <div key={tier.id} className="rounded-3xl border border-olive-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-olive-900">{tier.label}</h2>
                    <p className="text-sm uppercase tracking-[0.18em] text-olive-500">{tier.bottles} bottles / month</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-olive-700 bg-olive-50 rounded-full px-3 py-1">Curated</span>
                </div>
                <p className="text-sm text-olive-600 leading-relaxed mb-6">{tier.description}</p>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => joinMembership(tier.id)}
                    className={`w-full rounded-2xl py-3 text-sm font-semibold transition-colors ${selectedTier === tier.id ? 'bg-olive-900 text-parchment-100' : 'bg-olive-700 text-parchment-100 hover:bg-olive-800'}`}
                  >
                    Join {tier.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTier(tier.id)}
                    className="w-full rounded-2xl border border-olive-200 py-3 text-sm text-olive-700 hover:bg-parchment-50"
                  >
                    Select this tier
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-olive-900 text-parchment-100 rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-3">How it works</h2>
            <ul className="space-y-3 text-sm leading-relaxed text-olive-100 list-disc list-inside">
              <li>Choose the membership tier that fits your tasting goals.</li>
              <li>Check out using Stripe subscription checkout.</li>
              <li>Membership shipments are curated monthly by our importer team.</li>
              <li>Manage your membership from your account and contact us for custom handling.</li>
            </ul>
          </div>

          {error && (
            <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="mt-6 text-sm text-olive-700">Redirecting to checkout…</div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
