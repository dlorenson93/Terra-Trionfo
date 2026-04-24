'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { getInquiry, removeFromInquiry, clearInquiry } from '@/lib/cart'

interface InquiryItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export default function InquiryPage() {
  const [items, setItems] = useState<InquiryItem[]>([])
  const [mounted, setMounted] = useState(false)

  // Form
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [accountType, setAccountType] = useState<'CONSUMER' | 'TRADE'>('CONSUMER')
  const [message, setMessage] = useState('')

  // State
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    setItems(getInquiry())
  }, [])

  const handleRemove = (productId: string) => {
    removeFromInquiry(productId)
    setItems(getInquiry())
    window.dispatchEvent(new Event('inquiryUpdated'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ name: i.name, slug: i.productId, quantity: i.quantity })),
          firstName: firstName.trim(),
          email: email.trim(),
          accountType,
          message: message.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to submit inquiry. Please try again.')
        return
      }

      clearInquiry()
      window.dispatchEvent(new Event('inquiryUpdated'))
      setSubmitted(true)
    } catch {
      setError('Unable to submit — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center bg-parchment-50 px-4 py-24">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 border border-parchment-300 rounded-full flex items-center justify-center mx-auto mb-8 bg-parchment-50">
              <svg className="w-8 h-8 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.25em] mb-3">Inquiry Submitted</p>
            <h1 className="text-4xl font-serif font-bold text-olive-900 mb-4">
              Thank you, {firstName}.
            </h1>
            <p className="text-olive-700 leading-relaxed mb-10 text-base">
              Your inquiry has been received. Our team will follow up soon with details about the wines you've selected.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products" className="btn-primary text-sm px-6 py-2.5">
                Continue Exploring
              </Link>
              <Link href="/" className="btn-secondary text-sm px-6 py-2.5">
                Return Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero band */}
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-16 px-4 border-b border-parchment-300">
          <div className="max-w-7xl mx-auto">
            <div className="mb-3">
              <p className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.25em]">
                Pre-Import Portfolio & Wine Requests
              </p>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-olive-900 mb-4 leading-tight">
              Your Wine Inquiry
            </h1>
            <p className="text-olive-700 max-w-2xl text-base leading-relaxed">
              Share your interest in wines under evaluation for U.S. import. Our team will follow up with availability, pricing, and next steps.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16">
          {items.length === 0 ? (
            /* Empty state */
            <div className="text-center py-20">
              <div className="w-16 h-16 border border-parchment-300 rounded-full flex items-center justify-center mx-auto mb-8 bg-parchment-50">
                <svg className="w-7 h-7 text-olive-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.25em] mb-2">Empty Inquiry</p>
              <h2 className="text-2xl font-serif font-bold text-olive-900 mb-3">No wines added yet</h2>
              <p className="text-olive-600 mb-10 text-base max-w-md mx-auto leading-relaxed">
                Browse our incoming portfolio and click "Add to Inquiry" on wines that interest you.
              </p>
              <Link href="/products" className="btn-primary inline-block px-8 py-3">
                Explore the Portfolio
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-12">
              {/* Wine list — left 3 cols */}
              <div className="lg:col-span-3">
                <h2 className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.25em] mb-6">
                  Wines In Your Inquiry
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                      {/* Wine bottle icon placeholder */}
                      <div className="flex items-center gap-4 flex-grow">
                        <div className="w-14 h-18 bg-gradient-to-b from-olive-100 to-olive-200 rounded flex-shrink-0 flex items-center justify-center">
                          <svg className="w-5 h-5 text-olive-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25}
                              d="M8 3v2.5c0 1.5-.5 2.5-1 3.5S6 11 6 13v6a1 1 0 001 1h10a1 1 0 001-1v-6c0-2-.5-2.5-1-3.5S16 7 16 5.5V3M8 3h8" />
                          </svg>
                        </div>

                        <div className="flex-grow">
                          <h3 className="font-serif font-semibold text-olive-900 text-base leading-snug">
                            {item.name}
                          </h3>
                          <p className="text-xs text-olive-500 mt-1.5">
                            <span className="inline-block bg-olive-50 border border-olive-200 px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.1em] font-medium">
                              Qty: {item.quantity}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="text-[11px] font-medium text-olive-400 hover:text-red-600 uppercase tracking-[0.12em] transition-colors flex-shrink-0 ml-4"
                        aria-label={`Remove ${item.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-4 mt-6">
                  <p className="text-xs text-olive-600 leading-relaxed">
                    Wines in your inquiry represent our incoming Italian portfolio under active consideration for U.S. import. We'll confirm availability and pricing in our follow-up.
                  </p>
                </div>
              </div>

              {/* Contact form — right 2 cols */}
              <div className="lg:col-span-2">
                <div className="card p-8 sticky top-20">
                  <h2 className="text-lg font-serif font-bold text-olive-900 mb-6">
                    Tell Us About Yourself
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-olive-800 mb-2">
                        First Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="input-field w-full"
                        placeholder="Your first name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-olive-800 mb-2">
                        Email Address <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="input-field w-full"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-olive-800 mb-3">
                        I am a <span className="text-red-600">*</span>
                      </label>
                      <div className="space-y-2">
                        {([['CONSUMER', 'Wine Enthusiast'], ['TRADE', 'Trade Buyer']] as const).map(([val, label]) => (
                          <label key={val} className="flex items-center gap-3 cursor-pointer p-2.5 rounded hover:bg-parchment-100 transition-colors">
                            <input
                              type="radio"
                              name="accountType"
                              value={val}
                              checked={accountType === val}
                              onChange={() => setAccountType(val)}
                              className="form-radio accent-olive-700"
                            />
                            <span className="text-sm text-olive-700 font-medium">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-olive-800 mb-2">
                        Message <span className="text-olive-500 text-xs font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="input-field w-full resize-none"
                        placeholder="Any questions, specific quantities, or interests…"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || items.length === 0}
                      className="btn-primary w-full py-3 disabled:opacity-50 text-base font-medium"
                    >
                      {loading ? 'Submitting…' : 'Submit Inquiry'}
                    </button>

                    <p className="text-xs text-olive-600 leading-relaxed text-center bg-parchment-100 rounded-lg p-3">
                      Our team will follow up with availability, pricing, and import timeline.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
