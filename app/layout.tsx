import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { AuthProvider } from '@/components/providers/AuthProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Terra Trionfo — Italian Wines & Olive Oils, Curated at the Source',
  description: 'A private selection of artisan Italian producers. Each estate, wine, and olive oil personally reviewed before joining the Terra Trionfo marketplace.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-parchment-100 text-olive-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
