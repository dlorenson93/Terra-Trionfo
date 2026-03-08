'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ProfileSetupPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [role, setRole] = useState<'CONSUMER' | 'VENDOR'>('CONSUMER')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (status === 'loading') return null
  if (!session?.user) {
    // shouldn't happen since protected by middleware, but redirect just in case
    router.push('/auth/signin')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to set up profile')
      } else {
        // Refresh JWT claims so profileCompleted=true is reflected immediately
        await update({ profileCompleted: true, role })
        router.replace(role === 'VENDOR' ? '/dashboard/vendor' : '/')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-parchment-100 to-parchment-200 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-olive-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-olive-700">
              Choose the account type that best describes you.
            </p>
          </div>
          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label block mb-2">Account Type</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="CONSUMER"
                      checked={role === 'CONSUMER'}
                      onChange={() => setRole('CONSUMER')}
                      className="mr-2"
                    />
                    Consumer (shop products)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="VENDOR"
                      checked={role === 'VENDOR'}
                      onChange={() => setRole('VENDOR')}
                      className="mr-2"
                    />
                    Vendor / Producer
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
