'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface Profile {
  name: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  dateOfBirth?: string | null
  ageVerificationStatus: 'UNVERIFIED' | 'ELIGIBLE' | 'INELIGIBLE'
}

export default function AccountPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetch('/api/account/profile')
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session])

  if (!session) return null

  const isOrderReady =
    profile?.ageVerificationStatus === 'ELIGIBLE' &&
    profile?.phone &&
    (profile?.firstName || profile?.name)

  const ageBadge = {
    UNVERIFIED: { label: 'Age Unverified', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    ELIGIBLE: { label: '21+ Verified', cls: 'bg-green-50 text-green-700 border border-green-200' },
    INELIGIBLE: { label: 'Under 21 — Cannot Order', cls: 'bg-red-50 text-red-700 border border-red-200' },
  }

  const status = profile?.ageVerificationStatus ?? 'UNVERIFIED'
  const badge = ageBadge[status]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Page header */}
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
              My Account
            </p>
            <h1 className="text-4xl font-serif font-bold text-olive-900 mb-1">
              {profile?.firstName
                ? `Welcome, ${profile.firstName}`
                : session.user?.name ?? 'My Account'}
            </h1>
            <p className="text-sm text-olive-500">{session.user?.email}</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-olive-700" />
            </div>
          ) : (
            <>
              {/* Order readiness banner */}
              {!isOrderReady && (
                <div className="bg-amber-50 border border-amber-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-grow">
                    <p className="text-sm font-semibold text-amber-800 mb-1">
                      Complete your account to place orders
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      {!profile?.dateOfBirth
                        ? 'Date of birth is required to place alcohol orders. You must be 21 or older to order from Terra Trionfo.'
                        : status === 'INELIGIBLE'
                        ? 'You must be 21 or older to order from Terra Trionfo.'
                        : 'Add your phone number and name to complete ordering setup.'}
                    </p>
                  </div>
                  <Link
                    href="/account/settings"
                    className="shrink-0 text-[10px] uppercase tracking-[0.12em] px-4 py-2 border border-amber-600 text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    Complete Profile
                  </Link>
                </div>
              )}

              {/* Status grid */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="border border-parchment-200 bg-white p-5">
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                    Age Eligibility
                  </p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-sm ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {status === 'UNVERIFIED' && (
                    <p className="text-[10px] text-olive-400 mt-2 leading-relaxed">
                      Provide your date of birth in Settings to unlock ordering.
                    </p>
                  )}
                </div>

                <div className="border border-parchment-200 bg-white p-5">
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                    Contact
                  </p>
                  {profile?.phone ? (
                    <p className="text-sm text-olive-800">{profile.phone}</p>
                  ) : (
                    <p className="text-xs text-olive-400 italic">No phone number saved</p>
                  )}
                </div>

                <div className="border border-parchment-200 bg-white p-5">
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                    Account Status
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-sm ${
                      isOrderReady
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-parchment-100 text-olive-500 border border-parchment-300'
                    }`}
                  >
                    {isOrderReady ? 'Order Ready' : 'Incomplete'}
                  </span>
                </div>
              </div>

              {/* Navigation cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Link
                  href="/account/orders"
                  className="group border border-parchment-200 bg-white hover:border-olive-400 hover:bg-parchment-50 transition-all p-6 flex flex-col"
                >
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                    Order History
                  </p>
                  <h2 className="font-serif font-semibold text-olive-900 group-hover:text-olive-700 text-lg mb-1">
                    My Orders
                  </h2>
                  <p className="text-xs text-olive-500 leading-relaxed flex-grow">
                    View past orders and track current delivery or pickup status.
                  </p>
                  <p className="text-[10px] text-olive-400 group-hover:text-olive-600 mt-4 uppercase tracking-wider transition-colors">
                    View orders →
                  </p>
                </Link>

                <Link
                  href="/account/addresses"
                  className="group border border-parchment-200 bg-white hover:border-olive-400 hover:bg-parchment-50 transition-all p-6 flex flex-col"
                >
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                    Delivery
                  </p>
                  <h2 className="font-serif font-semibold text-olive-900 group-hover:text-olive-700 text-lg mb-1">
                    Saved Addresses
                  </h2>
                  <p className="text-xs text-olive-500 leading-relaxed flex-grow">
                    Manage delivery addresses for Massachusetts local delivery.
                  </p>
                  <p className="text-[10px] text-olive-400 group-hover:text-olive-600 mt-4 uppercase tracking-wider transition-colors">
                    Manage addresses →
                  </p>
                </Link>

                <Link
                  href="/account/settings"
                  className="group border border-parchment-200 bg-white hover:border-olive-400 hover:bg-parchment-50 transition-all p-6 flex flex-col"
                >
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                    Profile
                  </p>
                  <h2 className="font-serif font-semibold text-olive-900 group-hover:text-olive-700 text-lg mb-1">
                    Settings
                  </h2>
                  <p className="text-xs text-olive-500 leading-relaxed flex-grow">
                    Update name, phone, and date of birth for order eligibility.
                  </p>
                  <p className="text-[10px] text-olive-400 group-hover:text-olive-600 mt-4 uppercase tracking-wider transition-colors">
                    Edit settings →
                  </p>
                </Link>
              </div>

              {/* Quick browse links */}
              <div className="border-t border-parchment-200 pt-8">
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-4">
                  Explore the Portfolio
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { href: '/products', label: 'Browse Wines' },
                    { href: '/producers', label: 'Explore Producers' },
                    { href: '/regions', label: 'Discover Regions' },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="text-[10px] uppercase tracking-[0.12em] px-4 py-2 border border-parchment-300 text-olive-600 hover:border-olive-400 hover:text-olive-800 transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
