'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-parchment-100 to-parchment-200 px-4">
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
            Sign In
          </h1>
          <p className="text-olive-700">Welcome back to Terra Trionfo</p>
        </div>

        {/* Sign In Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-olive-700">
              Don't have an account?{' '}
              <Link
                href="/auth/signup"
                className="text-olive-800 font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Test Credentials */}
          <div className="mt-6 pt-6 border-t border-olive-200">
            <p className="text-xs text-olive-600 mb-2 font-medium">
              Test Credentials:
            </p>
            <div className="space-y-1 text-xs text-olive-700">
              <p>Admin: admin@terratrionfo.com / password123</p>
              <p>Vendor: vendor@example.com / password123</p>
              <p>Consumer: consumer@example.com / password123</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-olive-700 hover:text-olive-900"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
