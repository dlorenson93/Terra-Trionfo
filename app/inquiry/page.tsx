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
            <div className="w-14 h-14 border border-olive-300 flex items-center justify-center mx-auto mb-8">
              <svg className="w-6 h-6 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[11px] font-medium text-olive-400 uppercase tracking-[0.25em] mb-4">Inquiry Received</p>
            <h1 className="text-3xl font-serif font-bold text-olive-900 mb-5">
              Thank you, {firstName}.
            </h1>
            <p className="text-olive-600 leading-relaxed mb-8">
              Your inquiry has been received. A member of our team will be in touch regarding the wines you've selected.
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
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-12 px-4 border-b border-parchment-300">
          <div className="max-w-7xl mx-auto">
            <p className="text-[11px] font-medium text-olive-400 uppercase tracking-[0.25em] mb-3">
              Pre-Import Portfolio
            </p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-olive-900 mb-3">
              Your Wine Inquiry
            </h1>
            <p className="text-olive-600 max-w-lg text-base leading-relaxed">
              These wines are under active consideration for U.S. import. Submit your inquiry and our team will be in touch.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-14">
          {items.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16">
              <div className="w-12 h-12 border border-olive-200 flex items-center justify-center mx-auto mb-6">
                <svg className="w-5 h-5 text-olive-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[11px] font-medium text-olive-400 uppercase tracking-[0.2em] mb-3">Nothing here yet</p>
              <h2 className="text-xl font-serif text-olive-900 mb-4">Your inquiry is empty</h2>
              <p className="text-olive-600 mb-8 text-sm">
                Browse the portfolio and click "Add to Inquiry" on any wine that interests you.
              </p>
              <Link href="/products" className="btn-primary text-sm px-6 py-2.5">
                Explore the Portfolio
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-10">
              {/* Wine list — left 3 cols */}
              <div className="lg:col-span-3">
                <h2 className="text-[11px] font-medium text-olive-400 uppercase tracking-[0.2em] mb-5">
                  Selected Wines
                </h2>
                <div className="divide-y divide-parchment-200">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-start gap-5 py-5">
                      {/* Wine bottle icon placeholder */}
                      <div className="w-12 h-16 bg-gradient-to-b from-olive-100 to-olive-200 flex-shrink-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-olive-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25}
                            d="M8 3v2.5c0 1.5-.5 2.5-1 3.5S6 11 6 13v6a1 1 0 001 1h10a1 1 0 001-1v-6c0-2-.5-2.5-1-3.5S16 7 16 5.5V3M8 3h8" />
                        </svg>
                      </div>

                      <div className="flex-grow">
                        <h3 className="font-serif font-semibold text-olive-900 leading-snug">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-olive-400 uppercase tracking-[0.12em] mt-1">
                          Pre-Import Inquiry
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="text-[10px] font-medium text-olive-400 hover:text-red-600 uppercase tracking-[0.12em] transition-colors pt-1 flex-shrink-0"
                        aria-label={`Remove ${item.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-olive-500 mt-5 leading-relaxed">
                  These wines represent our forthcoming Italian portfolio. Prices and availability will be confirmed upon successful U.S. import approval.
                </p>
              </div>

              {/* Contact form — right 2 cols */}
              <div className="lg:col-span-2">
                <div className="bg-parchment-50 border border-parchment-200 p-7">
                  <h2 className="text-[11px] font-medium text-olive-400 uppercase tracking-[0.2em] mb-5">
                    Your Details
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-medium text-olive-700 uppercase tracking-[0.12em] mb-1.5">
                        First Name *
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
                      <label className="block text-xs font-medium text-olive-700 uppercase tracking-[0.12em] mb-1.5">
                        Email Address *
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
                      <label className="block text-xs font-medium text-olive-700 uppercase tracking-[0.12em] mb-2">
                        I am a *
                      </label>
                      <div className="flex gap-4">
                        {([['CONSUMER', 'Wine Enthusiast'], ['TRADE', 'Trade Buyer']] as const).map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="accountType"
                              value={val}
                              checked={accountType === val}
                              onChange={() => setAccountType(val)}
                              className="form-radio accent-olive-700"
                            />
                            <span className="text-sm text-olive-700">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-olive-700 uppercase tracking-[0.12em] mb-1.5">
                        Message <span className="text-olive-400 normal-case tracking-normal font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        className="input-field w-full resize-none"
                        placeholder="Any questions, quantities, or specific interests…"
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || items.length === 0}
                      className="btn-primary w-full py-3 disabled:opacity-50"
                    >
                      {loading ? 'Submitting…' : 'Submit Inquiry'}
                    </button>

                    <p className="text-[10px] text-olive-400 leading-relaxed text-center">
                      No purchase commitment. Our team will follow up with availability, pricing, and fulfillment details.
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
