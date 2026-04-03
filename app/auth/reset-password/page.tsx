'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="card p-8 text-center space-y-4">
        <p className="text-red-700 font-medium">Invalid or missing reset token.</p>
        <Link href="/auth/forgot-password" className="btn-primary inline-block px-6 py-2 text-sm">
          Request a new link
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/auth/signin'), 2500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-olive-800 font-medium">Password updated successfully</p>
        <p className="text-sm text-olive-600">Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <div className="card p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="password" className="label">New password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="input-field"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm new password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {loading ? 'Updating...' : 'Set New Password'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-parchment-100 to-parchment-200 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img
              src="/images/ChatGPT Image Dec 10, 2025, 09_43_23 PM.png"
              alt="Terra Trionfo Logo"
              className="h-20 w-auto mx-auto mb-4"
            />
          </Link>
          <h1 className="text-3xl font-serif font-bold text-olive-900 mb-2">Set New Password</h1>
          <p className="text-olive-700">Choose a strong password for your account</p>
        </div>

        <Suspense fallback={<div className="card p-8 text-center text-olive-600">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="text-center mt-6">
          <Link href="/auth/signin" className="text-sm text-olive-700 hover:text-olive-900">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
