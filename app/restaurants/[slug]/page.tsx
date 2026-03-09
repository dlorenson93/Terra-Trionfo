'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface RestaurantWine {
  id: string
  servingType: string
  notes?: string | null
  product: {
    id: string
    name: string
    slug?: string | null
    category: string
    imageUrl?: string | null
    vintage?: number | null
    appellation?: string | null
    grapeVarietals: string[]
    tastingNotesShort?: string | null
    retailPriceCents: number
  }
}

interface Restaurant {
  id: string
  name: string
  slug: string
  description?: string | null
  website?: string | null
  address: string
  city: string
  state: string
  zipCode: string
  heroImageUrl?: string | null
  galleryImages: string[]
  cuisineType?: string | null
  priceRange?: string | null
  isFeatured: boolean
  wines: RestaurantWine[]
}

export default function RestaurantProfilePage({ params }: { params: { slug: string } }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/restaurants/${params.slug}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then((data) => { if (data) setRestaurant(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-700" />
        </div>
        <Footer />
      </div>
    )
  }

  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-olive-900 mb-2">Restaurant Not Found</h2>
            <p className="text-olive-600 mb-6">This restaurant is not in our directory.</p>
            <Link href="/restaurants" className="btn-primary">View All Restaurants</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const byGlass = restaurant.wines.filter((w) => w.servingType === 'BY_GLASS')
  const bottleList = restaurant.wines.filter((w) => w.servingType === 'BOTTLE_LIST')

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">

        {/* Hero */}
        <div className="relative bg-olive-900 overflow-hidden">
          {restaurant.heroImageUrl ? (
            <div className="absolute inset-0">
              <img src={restaurant.heroImageUrl} alt={restaurant.name} className="w-full h-full object-cover opacity-30" />
            </div>
          ) : (
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(ellipse at 60% 50%, #d4a853 0%, transparent 70%)' }}
            />
          )}
          <div className="relative max-w-5xl mx-auto px-4 py-20">
            {/* Breadcrumb */}
            <nav className="text-sm text-olive-400 mb-6 flex items-center gap-2">
              <Link href="/restaurants" className="hover:text-parchment-200 transition-colors">Restaurants</Link>
              <span>›</span>
              <span className="text-parchment-200">{restaurant.name}</span>
            </nav>

            {restaurant.isFeatured && (
              <p className="text-[9px] font-medium tracking-[0.14em] uppercase text-amber-400 bg-amber-900/40 border border-amber-700/50 inline-block px-2 py-0.5 mb-4">
                Featured Partner
              </p>
            )}

            <h1 className="text-4xl md:text-5xl font-serif font-bold text-parchment-100 mb-3 leading-tight">
              {restaurant.name}
            </h1>

            <p className="text-olive-300 text-lg mb-6">
              {restaurant.city}, {restaurant.state}
              {restaurant.cuisineType && <> · {restaurant.cuisineType}</>}
              {restaurant.priceRange && <> · {restaurant.priceRange}</>}
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${restaurant.address}, ${restaurant.city}, ${restaurant.state} ${restaurant.zipCode}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-olive-300 hover:text-parchment-100 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {restaurant.address}
              </a>
              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-olive-300 hover:text-parchment-100 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* About */}
        {restaurant.description && (
          <div className="bg-parchment-50 border-b border-parchment-300 py-14 px-4">
            <div className="max-w-3xl mx-auto">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-4">ABOUT</p>
              <p className="text-lg text-olive-800 leading-relaxed">{restaurant.description}</p>
            </div>
          </div>
        )}

        {/* Wines Served */}
        {restaurant.wines.length > 0 && (
          <div className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                TERRA TRIONFO WINES
              </p>
              <h2 className="text-3xl font-serif font-bold text-olive-900 mb-10">
                Wines Served Here
              </h2>

              <div className="grid md:grid-cols-2 gap-10">
                {byGlass.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-500">By the Glass</span>
                      <div className="flex-1 h-px bg-olive-200" />
                    </div>
                    <div className="space-y-4">
                      {byGlass.map((rw) => (
                        <WineEntry key={rw.id} rw={rw} />
                      ))}
                    </div>
                  </div>
                )}

                {bottleList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-500">Bottle List</span>
                      <div className="flex-1 h-px bg-olive-200" />
                    </div>
                    <div className="space-y-4">
                      {bottleList.map((rw) => (
                        <WineEntry key={rw.id} rw={rw} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CTA — purchase */}
        {restaurant.wines.length > 0 && (
          <div className="bg-olive-900 py-16 px-4">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-amber-400/80 mb-4">
                THE MARKETPLACE
              </p>
              <h2 className="text-3xl font-serif font-bold text-parchment-100 mb-4">
                Take a Bottle Home
              </h2>
              <p className="text-olive-300 mb-8 leading-relaxed">
                Wines served at {restaurant.name} are available to purchase through Terra Trionfo for local collection or delivery in Massachusetts.
              </p>
              <Link href="/products" className="btn-primary inline-block px-8 py-3">
                Browse Available Wines
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

function WineEntry({ rw }: { rw: RestaurantWine }) {
  const p = rw.product
  return (
    <Link
      href={`/products/${p.slug || p.id}`}
      className="flex gap-4 group hover:bg-parchment-50 -mx-3 px-3 py-3 transition-colors"
    >
      <div className="w-12 h-14 bg-parchment-200 flex-shrink-0 overflow-hidden">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-olive-100 to-olive-200">
            <svg className="w-5 h-5 text-olive-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v11a3 3 0 006 0V3M6 3h12" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-serif font-semibold text-olive-900 group-hover:text-olive-700 leading-snug">
          {p.name} {p.vintage && <span className="font-sans font-normal text-sm">{p.vintage}</span>}
        </p>
        {p.appellation && (
          <p className="text-xs text-olive-500 mt-0.5">{p.appellation}</p>
        )}
        {p.grapeVarietals.length > 0 && (
          <p className="text-xs text-olive-500 italic mt-0.5">{p.grapeVarietals.join(', ')}</p>
        )}
        {rw.notes && (
          <p className="text-xs text-olive-600 mt-1 italic">"{rw.notes}"</p>
        )}
      </div>
      <div className="text-xs text-olive-400 flex-shrink-0 self-start pt-0.5">
        ${(p.retailPriceCents / 100).toFixed(0)}
      </div>
    </Link>
  )
}
