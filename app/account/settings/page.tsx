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

export default function AccountSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetch('/api/account/profile')
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data)
        setFirstName(data.firstName ?? '')
        setLastName(data.lastName ?? '')
        setPhone(data.phone ?? '')
        setDob(data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '')
      })
      .finally(() => setLoading(false))
  }, [session])

  if (!session) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSavedMsg('')

    const res = await fetch('/api/account/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, phone, dateOfBirth: dob || null }),
    })
    const data = await res.json()

    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'Failed to save profile.')
    } else {
      setProfile(data)
      setSavedMsg('Profile saved.')
      setTimeout(() => setSavedMsg(''), 3000)
    }
  }

  const ageStatus = profile?.ageVerificationStatus ?? 'UNVERIFIED'
  const ageBadge = {
    UNVERIFIED: { label: 'Not yet verified', cls: 'text-amber-700' },
    ELIGIBLE: { label: '21+ — Eligible to order', cls: 'text-green-700' },
    INELIGIBLE: { label: 'Under 21 — Cannot order', cls: 'text-red-700' },
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/account"
              className="text-[10px] uppercase tracking-widest text-olive-400 hover:text-olive-700 transition-colors inline-flex items-center gap-1 mb-4"
            >
              ← My Account
            </Link>
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
              Account
            </p>
            <h1 className="text-3xl font-serif font-bold text-olive-900">Settings</h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-olive-700" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-10">

              {/* Profile Information */}
              <section>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-5 border-b border-parchment-200 pb-3">
                  Profile Information
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-olive-700 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border border-parchment-300 px-3 py-2.5 text-sm text-olive-900 focus:outline-none focus:border-olive-500 bg-white transition-colors"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-olive-700 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border border-parchment-300 px-3 py-2.5 text-sm text-olive-900 focus:outline-none focus:border-olive-500 bg-white transition-colors"
                      placeholder="Last name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-olive-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email ?? ''}
                      disabled
                      className="w-full border border-parchment-200 px-3 py-2.5 text-sm text-olive-400 bg-parchment-50 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-olive-400 mt-1">
                      Email cannot be changed here.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-olive-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-parchment-300 px-3 py-2.5 text-sm text-olive-900 focus:outline-none focus:border-olive-500 bg-white transition-colors"
                      placeholder="(617) 000-0000"
                    />
                    <p className="text-[10px] text-olive-400 mt-1">
                      Required for order coordination.
                    </p>
                  </div>
                </div>
              </section>

              {/* Age Eligibility */}
              <section>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-5 border-b border-parchment-200 pb-3">
                  Age Eligibility
                </p>
                <div className="sm:max-w-xs">
                  <label className="block text-xs font-medium text-olive-700 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full border border-parchment-300 px-3 py-2.5 text-sm text-olive-900 focus:outline-none focus:border-olive-500 bg-white transition-colors"
                  />
                  <p className="text-[10px] text-olive-400 mt-1.5 leading-relaxed">
                    Date of birth is required to place alcohol orders. You must be 21 or older to
                    order from Terra Trionfo.
                  </p>
                  {profile?.dateOfBirth && (
                    <p className={`text-xs font-medium mt-2 ${ageBadge[ageStatus].cls}`}>
                      {ageBadge[ageStatus].label}
                    </p>
                  )}
                </div>
              </section>

              {/* Submit */}
              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3">
                  {error}
                </p>
              )}
              {savedMsg && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3">
                  {savedMsg}
                </p>
              )}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
                <Link
                  href="/account/addresses"
                  className="text-xs text-olive-500 hover:text-olive-800 transition-colors underline underline-offset-2"
                >
                  Manage saved addresses
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
