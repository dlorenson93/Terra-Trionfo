'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VendorSignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'VENDOR',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      // Send vendor to sign in first, then they'll be directed to vendor dashboard to set up their company
      router.push('/auth/signin?registered=true&vendor=true')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-parchment-100 to-parchment-200 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img
              src="/images/ChatGPT Image Dec 10, 2025, 09_43_23 PM.png"
              alt="Terra Trionfo Logo"
              className="h-20 w-auto mx-auto mb-4"
            />
          </Link>
          <h1 className="text-3xl font-serif font-bold text-olive-900 mb-2">
            Join as a Producer
          </h1>
          <p className="text-olive-700">List your products on Terra Trionfo</p>
        </div>

        {/* Info banner */}
        <div className="bg-olive-50 border border-olive-200 rounded-lg px-4 py-3 mb-6 text-sm text-olive-800">
          <p className="font-medium mb-1">🌿 Vendor accounts include:</p>
          <ul className="list-disc list-inside space-y-1 text-olive-700">
            <li>Your own company profile page</li>
            <li>Product listing management</li>
            <li>Marketplace &amp; wholesale options</li>
            <li>Order &amp; inventory tracking</li>
          </ul>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="label">Your Name</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input-field"
                placeholder="Maria Rossi"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">Business Email</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="input-field"
                placeholder="contact@yourcompany.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Vendor Account'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-olive-700">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-olive-800 font-medium hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-olive-600">
              Just want to shop?{' '}
              <Link href="/auth/signup/consumer" className="text-olive-700 font-medium hover:underline">
                Create a shopper account →
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/auth/signup" className="text-sm text-olive-700 hover:text-olive-900">
            ← Back to account type
          </Link>
        </div>
      </div>
    </div>
  )
}
