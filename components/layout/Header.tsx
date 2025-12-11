'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-olive-700"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-olive-200 py-4">
            <div className="flex flex-col space-y-4">
              {session && (
                <div className="px-4 py-2 bg-olive-50 rounded-lg">
                  <p className="text-sm font-medium text-olive-900">{session.user.name}</p>
                  <p className="text-xs text-olive-600">{session.user.email}</p>
                </div>
              )}

              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 text-sm font-medium ${
                  isActive('/products') ? 'text-olive-800 bg-olive-50' : 'text-olive-600'
                }`}
              >
                Shop Products
              </Link>

              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 text-sm font-medium ${
                  isActive('/about') ? 'text-olive-800 bg-olive-50' : 'text-olive-600'
                }`}
              >
                Our Story
              </Link>

              {session && (
                <>
                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-2 text-sm font-medium ${
                        isActive('/dashboard/admin') ? 'text-olive-800 bg-olive-50' : 'text-olive-600'
                      }`}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {session.user.role === 'VENDOR' && (
                    <Link
                      href="/dashboard/vendor"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-2 text-sm font-medium ${
                        isActive('/dashboard/vendor') ? 'text-olive-800 bg-olive-50' : 'text-olive-600'
                      }`}
                    >
                      Vendor Dashboard
                    </Link>
                  )}

                  {session.user.role === 'CONSUMER' && (
                    <Link
                      href="/account/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-2 text-sm font-medium ${
                        isActive('/account/orders') ? 'text-olive-800 bg-olive-50' : 'text-olive-600'
                      }`}
                    >
                      My Orders
                    </Link>
                  )}

                  <Link
                    href="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 text-sm font-medium ${
                      isActive('/cart') ? 'text-olive-800 bg-olive-50' : 'text-olive-600'
                    }`}
                  >
                    Shopping Cart
                  </Link>

                  <button
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="px-4 py-2 text-sm font-medium text-olive-600 text-left"
                  >
                    Sign Out
                  </button>
                </>
              )}

              {!session && (
                <>
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mx-4 btn-primary text-sm text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-olive-600"
                  >
                    Partner With Us
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
