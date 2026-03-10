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
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3.5">
            <img
              src="/images/ChatGPT Image Dec 10, 2025, 09_43_23 PM.png"
              alt="Terra Trionfo Logo"
              className="h-14 w-auto"
            />
            <div>
              <h1 className="text-2xl font-serif font-bold text-olive-900 leading-tight">
                Terra Trionfo
              </h1>
              <p className="text-[11px] text-olive-500 italic tracking-wide">Born of the Land</p>
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
                pathname.startsWith('/producers') ? 'text-olive-900' : 'text-olive-600 hover:text-olive-900'
              }`}
            >
              Producers
            </Link>
            <Link
              href="/regions"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith('/regions') ? 'text-olive-900' : 'text-olive-600 hover:text-olive-900'
              }`}
            >
              Regions
            </Link>
            <Link
              href="/restaurants"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith('/restaurants') ? 'text-olive-900' : 'text-olive-600 hover:text-olive-900'
              }`}
            >
              Restaurants
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
                  href="/account"
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
      className={`fixed inset-0 z-40 bg-olive-900/50 md:hidden transition-opacity duration-300 ${
        mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setMobileMenuOpen(false)}
      aria-hidden="true"
    />

    {/* Mobile menu drawer — slides down from below the header */}
    <div
      className={`fixed top-20 left-0 right-0 z-40 md:hidden bg-white shadow-xl border-b border-olive-100 transition-all duration-300 ease-in-out overflow-hidden ${
        mobileMenuOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="overflow-y-auto max-h-[calc(85vh-1px)]">

        {/* Signed-in user identity */}
        {session && (
          <div className="px-6 py-5 bg-olive-50 border-b border-olive-100">
            <p className="text-xs font-medium text-olive-400 uppercase tracking-widest mb-1">Signed in as</p>
            <p className="text-sm font-semibold text-olive-900 leading-tight">{session.user.name}</p>
            <p className="text-xs text-olive-500 mt-0.5">{session.user.email}</p>
          </div>
        )}

        {/* Primary nav links */}
        <nav className="px-6 pt-4 pb-2">
          <p className="text-[9px] font-semibold text-olive-400 uppercase tracking-[0.18em] mb-3">Explore</p>
          <MobileLink href="/products" active={isActive('/products')} onClose={() => setMobileMenuOpen(false)}>
            Browse Wines
          </MobileLink>
          <MobileLink href="/producers" active={pathname.startsWith('/producers')} onClose={() => setMobileMenuOpen(false)}>
            Producers
          </MobileLink>
          <MobileLink href="/regions" active={pathname.startsWith('/regions')} onClose={() => setMobileMenuOpen(false)}>
            Wine Regions
          </MobileLink>
          <MobileLink href="/restaurants" active={pathname.startsWith('/restaurants')} onClose={() => setMobileMenuOpen(false)}>
            Restaurants
          </MobileLink>
          <MobileLink href="/contact" active={isActive('/contact')} onClose={() => setMobileMenuOpen(false)}>
            Contact Us
          </MobileLink>
        </nav>

        {/* Account section */}
        {session && (
          <nav className="px-6 pt-5 pb-2 border-t border-olive-100 mt-2">
            <p className="text-[9px] font-semibold text-olive-400 uppercase tracking-[0.18em] mb-3">Account</p>
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
            <MobileLink href="/account" active={pathname.startsWith('/account')} onClose={() => setMobileMenuOpen(false)}>
              My Account
            </MobileLink>
            <button
              onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }) }}
              className="w-full text-left py-3.5 text-sm font-medium text-olive-400 hover:text-olive-700 transition-colors border-b border-olive-50"
            >
              Sign Out
            </button>
          </nav>
        )}

        {/* Unauthenticated CTAs */}
        {!session && (
          <div className="px-6 pt-5 pb-6 border-t border-olive-100 mt-2 space-y-3">
            <p className="text-[9px] font-semibold text-olive-400 uppercase tracking-[0.18em] mb-3">Account</p>
            <Link
              href="/auth/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full bg-olive-900 text-parchment-100 text-sm font-medium py-3.5 tracking-wide hover:bg-olive-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full border border-olive-200 text-olive-700 text-sm font-medium py-3.5 tracking-wide hover:border-olive-400 hover:text-olive-900 transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/auth/signup/vendor"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center text-xs text-olive-500 hover:text-olive-700 pt-1 transition-colors"
            >
              Sell with Terra Trionfo →
            </Link>
          </div>
        )}

        {/* Bottom brand tag */}
        <div className="px-6 py-4 border-t border-olive-100 bg-olive-50">
          <p className="text-[9px] text-olive-400 italic tracking-wide">Terra Trionfo · Born of the Land</p>
        </div>
      </div>
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
      className={`flex items-center justify-between py-3.5 text-sm font-medium border-b border-olive-50 transition-colors pl-3 ${
        active
          ? 'text-olive-900 border-l-2 border-l-amber-500 -ml-3 pl-3'
          : 'text-olive-600 hover:text-olive-900 border-l-2 border-l-transparent -ml-3 pl-3'
      }`}
    >
      {children}
      {active && (
        <svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 6 6">
          <circle cx="3" cy="3" r="3" />
        </svg>
      )}
    </Link>
  )
}
