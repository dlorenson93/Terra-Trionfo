'use client'

import { useState, useEffect } from 'react'

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + '='))
    ?.split('=')[1]
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setDate(expires.getDate() + days)
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

export default function AgeGate() {
  // Start as false to avoid SSR mismatch — set to true only in effect if cookie absent
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getCookie('tt_age_verified')) {
      setVisible(true)
    }
  }, [])

  const handleEnter = () => {
    setCookie('tt_age_verified', 'true', 30)
    setVisible(false)
  }

  const handleExit = () => {
    window.location.href = 'https://www.google.com'
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(47, 55, 40, 0.97)' }}
    >
      {/* Subtle linen texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'%3E%3Crect width=\'4\' height=\'4\' fill=\'%23000000\' fill-opacity=\'0\'/%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'0.5\' fill=\'%23fdfcfb\' fill-opacity=\'0.04\'/%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'0.5\' fill=\'%23fdfcfb\' fill-opacity=\'0.04\'/%3E%3C/svg%3E")',
        }}
      />

      {/* Card */}
      <div className="relative z-10 max-w-sm w-full text-center px-8 py-14">
        {/* Eyebrow */}
        <p
          className="text-[9px] font-medium uppercase tracking-[0.3em] mb-5"
          style={{ color: 'rgba(215, 204, 183, 0.35)' }}
        >
          Terra Trionfo
        </p>

        {/* Hairline rule */}
        <div
          className="w-10 h-px mx-auto mb-8"
          style={{ backgroundColor: 'rgba(215, 204, 183, 0.15)' }}
        />

        {/* Headline */}
        <h1 className="font-serif text-[1.75rem] font-bold leading-snug mb-3" style={{ color: '#f5f0e8' }}>
          Welcome to Terra Trionfo
        </h1>

        {/* Subheadline */}
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: 'rgba(215, 204, 183, 0.55)' }}
        >
          A curated importer of Italian wine and olive oil.
        </p>

        {/* Legal gate statement */}
        <p className="text-sm font-medium mb-2" style={{ color: '#ede5d6' }}>
          You must be 21 years of age or older to enter.
        </p>

        {/* Affirmation copy */}
        <p
          className="text-xs leading-relaxed mb-10 max-w-[260px] mx-auto"
          style={{ color: 'rgba(215, 204, 183, 0.40)' }}
        >
          By continuing, you confirm that you are of legal drinking age in your jurisdiction.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <button
            onClick={handleEnter}
            className="px-10 py-3 text-xs font-medium tracking-[0.12em] uppercase transition-all duration-200"
            style={{
              backgroundColor: '#445037',
              color: '#f5f0e8',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#556542'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#445037'
            }}
          >
            Enter
          </button>
          <button
            onClick={handleExit}
            className="px-10 py-3 text-xs font-medium tracking-[0.12em] uppercase transition-all duration-200"
            style={{
              border: '1px solid rgba(215, 204, 183, 0.18)',
              color: 'rgba(215, 204, 183, 0.40)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = 'rgba(215, 204, 183, 0.35)'
              el.style.color = 'rgba(215, 204, 183, 0.65)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = 'rgba(215, 204, 183, 0.18)'
              el.style.color = 'rgba(215, 204, 183, 0.40)'
            }}
          >
            Exit
          </button>
        </div>

        {/* Enjoy responsibly microcopy */}
        <p
          className="text-[9px] uppercase tracking-[0.25em]"
          style={{ color: 'rgba(215, 204, 183, 0.18)' }}
        >
          Please enjoy responsibly.
        </p>
      </div>
    </div>
  )
}
