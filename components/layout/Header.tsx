'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <>
    <header className="bg-white border-b border-olive-200 sticky top-0 z-50">
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/products"
              className={`text-sm font-medium transition-colors ${
                isActive('/products') ? 'text-olive-900' : 'text-olive-600 hover:text-olive-900'
              }`}
            >
              Browse
            </Link>
            <Link
              href="/producers"
              className={`text-sm font-medium transition-colors ${
                isActive('/producers') ? 'text-olive-900' : 'text-olive-600 hover:text-olive-900'
              }`}
            >
              Producers
            </Link>

            {session ? (
              <>
                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/dashboard/admin"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/dashboard/admin') ? 'text-olive-900' : 'text-olive-600 hover:text-olive-900'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                {session.user.role === 'VENDOR' && (
                  <Link
                    href="/dashboard/vendor"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/dashboard/vendor') ? 'text-olive-900' : 'text-olive-600 hover:text-olive-900'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
                {session.user.role === 'CONSUMER' && (
                  <Link
                    href="/cart"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/cart') ? 'text-olive-900' : 'text-olive-600 hover:text-olive-900'
                    }`}
                  >
                    Cart
                  </Link>
                )}
                <Link
                  href="/account/orders"
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith('/account') ? 'text-olive-900' : 'text-olive-600 hover:text-olive-900'
                  }`}
                >
                  Account
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm text-olive-600 hover:text-olive-900 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signup/vendor" className="text-sm font-medium text-olive-600 hover:text-olive-900 transition-colors">
                  Sell With Us
                </Link>
                <Link href="/auth/signin" className="btn-primary text-sm">
                  Sign In
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] hover:bg-olive-50 transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span
              className={`block h-px w-5 bg-olive-800 transition-all duration-300 origin-center ${
                mobileMenuOpen ? 'translate-y-[6px] rotate-45' : ''
              }`}
            />
            <span
              className={`block h-px w-5 bg-olive-800 transition-all duration-300 ${
                mobileMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-px w-5 bg-olive-800 transition-all duration-300 origin-center ${
                mobileMenuOpen ? '-translate-y-[6px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </header>

    {/* Mobile menu backdrop */}
    <div
      className={`fixed inset-0 z-40 bg-olive-900/40 md:hidden transition-opacity duration-300 ${
        mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setMobileMenuOpen(false)}
      aria-hidden="true"
    />

    {/* Mobile menu drawer — slides in from top */}
    <div
      className={`fixed top-16 left-0 right-0 z-40 md:hidden bg-white border-b border-olive-200 transition-all duration-300 ease-in-out overflow-hidden ${
        mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <nav className="px-4 py-2 pb-6 flex flex-col overflow-y-auto max-h-[calc(80vh-1px)]">

        {/* Signed-in user identity */}
        {session && (
          <div className="py-4 border-b border-olive-100 mb-2">
            <p className="text-sm font-semibold text-olive-900">{session.user.name}</p>
            <p className="text-xs text-olive-500 mt-0.5">{session.user.email}</p>
          </div>
        )}

        {/* Primary nav links */}
        <MobileLink href="/products" active={isActive('/products')} onClose={() => setMobileMenuOpen(false)}>
          Browse
        </MobileLink>
        <MobileLink href="/producers" active={isActive('/producers')} onClose={() => setMobileMenuOpen(false)}>
          Producers
        </MobileLink>

        {session && (
          <>
            <div className="h-px bg-olive-100 my-2" />

            {session.user.role === 'ADMIN' && (
              <MobileLink href="/dashboard/admin" active={isActive('/dashboard/admin')} onClose={() => setMobileMenuOpen(false)}>
                Admin Dashboard
              </MobileLink>
            )}
            {session.user.role === 'VENDOR' && (
              <MobileLink href="/dashboard/vendor" active={isActive('/dashboard/vendor')} onClose={() => setMobileMenuOpen(false)}>
                Vendor Dashboard
              </MobileLink>
            )}
            {session.user.role === 'CONSUMER' && (
              <MobileLink href="/cart" active={isActive('/cart')} onClose={() => setMobileMenuOpen(false)}>
                Cart
              </MobileLink>
            )}
            <MobileLink href="/account/orders" active={pathname.startsWith('/account')} onClose={() => setMobileMenuOpen(false)}>
              Account
            </MobileLink>

            <div className="h-px bg-olive-100 my-2" />

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                signOut({ callbackUrl: '/' })
              }}
              className="w-full text-left py-3 px-1 text-sm font-medium text-olive-500 hover:text-olive-800 transition-colors"
            >
              Sign Out
            </button>
          </>
        )}

        {!session && (
          <>
            <div className="h-px bg-olive-100 my-2" />
            <MobileLink href="/auth/signup/vendor" active={false} onClose={() => setMobileMenuOpen(false)}>
              Sell With Us
            </MobileLink>
            <MobileLink href="/auth/signup" active={false} onClose={() => setMobileMenuOpen(false)}>
              Create Account
            </MobileLink>
            <div className="mt-4">
              <Link
                href="/auth/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full btn-primary text-sm text-center py-3"
              >
                Sign In
              </Link>
            </div>
          </>
        )}
      </nav>
    </div>
    </>
  )
}

function MobileLink({
  href,
  active,
  onClose,
  children,
}: {
  href: string
  active: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center justify-between py-3 px-1 text-sm font-medium border-b border-olive-50 transition-colors ${
        active
          ? 'text-olive-900'
          : 'text-olive-600 hover:text-olive-900'
      }`}
    >
      {children}
      {active && (
        <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
      )}
    </Link>
  )
}

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
                isActive('/products') ? 'text-olive-800' : 'text-olive-600 hover:text-olive-800'
              }`}
            >
              Browse
            </Link>
            <Link
              href="/producers"
              className={`text-sm font-medium transition-colors ${
                isActive('/producers') ? 'text-olive-800' : 'text-olive-600 hover:text-olive-800'
              }`}
            >
              Producers
            </Link>

            {session ? (
              <>
                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/dashboard/admin"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/dashboard/admin') ? 'text-olive-800' : 'text-olive-600 hover:text-olive-800'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                {session.user.role === 'VENDOR' && (
                  <Link
                    href="/dashboard/vendor"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/dashboard/vendor') ? 'text-olive-800' : 'text-olive-600 hover:text-olive-800'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
                {session.user.role === 'CONSUMER' && (
                  <Link
                    href="/cart"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/cart') ? 'text-olive-800' : 'text-olive-600 hover:text-olive-800'
                    }`}
                  >
                    Cart
                  </Link>
                )}
                <Link
                  href="/account/orders"
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith('/account') ? 'text-olive-800' : 'text-olive-600 hover:text-olive-800'
                  }`}
                >
                  Account
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm text-olive-600 hover:text-olive-800"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signup/vendor" className="text-sm font-medium text-olive-600 hover:text-olive-800">
                  Sell With Us
                </Link>
                <Link href="/auth/signin" className="btn-primary text-sm">
                  Sign In
                </Link>
              </>
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
                className="px-4 py-2 text-sm font-medium text-olive-600"
              >
                Browse
              </Link>

              <Link
                href="/producers"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-sm font-medium text-olive-600"
              >
                Producers
              </Link>

              {session && (
                <>
                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-olive-600"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {session.user.role === 'VENDOR' && (
                    <Link
                      href="/dashboard/vendor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-olive-600"
                    >
                      Vendor Dashboard
                    </Link>
                  )}
                  {session.user.role === 'CONSUMER' && (
                    <Link
                      href="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-olive-600"
                    >
                      Cart
                    </Link>
                  )}

                  <Link
                    href="/account/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-olive-600"
                  >
                    Account
                  </Link>

                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' })
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
                    href="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-olive-600"
                  >
                    Create Account
                  </Link>
                  <Link
                    href="/auth/signup/vendor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-olive-600"
                  >
                    Sell With Us
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
