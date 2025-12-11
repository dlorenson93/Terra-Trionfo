'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <header className="bg-white border-b border-olive-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img
              src="/images/ChatGPT Image Dec 10, 2025, 09_43_23 PM.png"
              alt="Terra Trionfo Logo"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-serif font-bold text-olive-900">
                Terra Trionfo
              </h1>
              <p className="text-xs text-olive-600 italic">Born of the Land</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/products"
              className={`text-sm font-medium transition-colors ${
                isActive('/products')
                  ? 'text-olive-800'
                  : 'text-olive-600 hover:text-olive-800'
              }`}
            >
              Shop Products
            </Link>

            <Link
              href="/about"
              className={`text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'text-olive-800'
                  : 'text-olive-600 hover:text-olive-800'
              }`}
            >
              Our Story
            </Link>

            {!session && (
              <Link
                href="/auth/signin"
                className={`text-sm font-medium transition-colors ${
                  isActive('/auth/signin')
                    ? 'text-olive-800'
                    : 'text-olive-600 hover:text-olive-800'
                }`}
              >
                Partner With Us
              </Link>
            )}

            {session && (
              <>
                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/dashboard/admin"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/dashboard/admin')
                        ? 'text-olive-800'
                        : 'text-olive-600 hover:text-olive-800'
                    }`}
                  >
                    Admin
                  </Link>
                )}

                {session.user.role === 'VENDOR' && (
                  <Link
                    href="/dashboard/vendor"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/dashboard/vendor')
                        ? 'text-olive-800'
                        : 'text-olive-600 hover:text-olive-800'
                    }`}
                  >
                    Vendor Dashboard
                  </Link>
                )}

                {session.user.role === 'CONSUMER' && (
                  <Link
                    href="/account/orders"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/account/orders')
                        ? 'text-olive-800'
                        : 'text-olive-600 hover:text-olive-800'
                    }`}
                  >
                    My Orders
                  </Link>
                )}

                <Link href="/cart" className="relative">
                  <svg
                    className="w-6 h-6 text-olive-700"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </Link>

                <div className="flex items-center space-x-3">
                  <span className="text-sm text-olive-700">
                    {session.user.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-olive-600 hover:text-olive-800"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}

            {!session && (
              <Link href="/auth/signin" className="btn-primary text-sm">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
