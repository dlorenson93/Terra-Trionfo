'use client'

import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-parchment-100 to-parchment-200 px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <img
              src="/images/ChatGPT Image Dec 10, 2025, 09_43_23 PM.png"
              alt="Terra Trionfo Logo"
              className="h-20 w-auto mx-auto mb-4"
            />
          </Link>
          <h1 className="text-3xl font-serif font-bold text-olive-900 mb-2">
            Join Terra Trionfo
          </h1>
          <p className="text-olive-700">How are you joining us today?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Consumer */}
          <Link
            href="/auth/signup/consumer"
            className="card p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow border-2 border-transparent hover:border-olive-400 group"
          >
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-xl font-serif font-bold text-olive-900 mb-2 group-hover:text-olive-700">
              I'm a Shopper
            </h2>
            <p className="text-sm text-olive-600">
              Browse and purchase artisan Italian goods from our curated producers.
            </p>
            <span className="mt-6 btn-primary text-sm px-5 py-2">
              Shop as Consumer
            </span>
          </Link>

          {/* Vendor */}
          <Link
            href="/auth/signup/vendor"
            className="card p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow border-2 border-transparent hover:border-olive-400 group"
          >
            <div className="text-5xl mb-4">🌿</div>
            <h2 className="text-xl font-serif font-bold text-olive-900 mb-2 group-hover:text-olive-700">
              I'm a Producer
            </h2>
            <p className="text-sm text-olive-600">
              List your products and reach customers through our marketplace.
            </p>
            <span className="mt-6 btn-secondary text-sm px-5 py-2">
              Join as Vendor
            </span>
          </Link>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-olive-700">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-olive-800 font-medium hover:underline">
              Sign in
            </Link>
          </p>
          <Link href="/" className="text-sm text-olive-600 hover:text-olive-900 mt-2 inline-block">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
