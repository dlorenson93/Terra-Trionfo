'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Clear cart on successful payment
    if (sessionId) {
      localStorage.removeItem('cart')
    }
  }, [sessionId])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>

              <h1 className="text-3xl font-serif font-bold text-olive-900 mb-4">
                Payment Successful!
              </h1>
              <p className="text-lg text-olive-700 mb-8">
                Thank you for your order. We've received your payment and will
                begin processing your order shortly.
              </p>

              <div className="space-y-4">
                <Link
                  href="/account/orders"
                  className="btn-primary inline-block px-8 py-3"
                >
                  View Order Details
                </Link>
                <Link
                  href="/products"
                  className="btn-outline inline-block px-8 py-3 ml-4"
                >
                  Continue Shopping
                </Link>
              </div>

              <p className="text-sm text-olive-600 mt-8">
                You will receive an order confirmation email shortly.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
