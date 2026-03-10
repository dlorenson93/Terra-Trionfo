'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface RestaurantWine {
  id: string
  servingType: string
  product: {
    id: string
    name: string
    vintage?: number | null
    appellation?: string | null
  }
}

interface Restaurant {
  id: string
  name: string
  slug: string
  description?: string | null
  city: string
  state: string
  cuisineType?: string | null
  priceRange?: string | null
  heroImageUrl?: string | null
  isFeatured: boolean
  wines: RestaurantWine[]
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/restaurants')
      .then((r) => r.json())
      .then((data) => setRestaurants(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const featured = restaurants.filter((r) => r.isFeatured)
  const all = restaurants

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">

        {/* Hero */}
        <div className="relative bg-olive-900 py-24 px-4 overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(ellipse at 60% 50%, #d4a853 0%, transparent 70%)' }}
          />
          <div className="relative max-w-4xl mx-auto text-center">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-amber-400/80 mb-4">
              THE NETWORK
            </p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-parchment-100 mb-4 leading-tight">
              Restaurants Serving<br />Terra Trionfo Wines
            </h1>
            <p className="text-olive-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Experience our wines at these carefully selected restaurants and wine bars across Massachusetts.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-16">

          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-olive-700" />
            </div>
          )}

          {!loading && all.length === 0 && (
            <div>
              {/* Network narrative */}
              <div className="max-w-3xl mx-auto mb-14">
                <div className="grid md:grid-cols-3 gap-8 mb-10">
                  {[
                    {
                      icon: (
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      ),
                      title: 'Introduce the Portfolio',
                      body: 'Partner restaurants are the first venue where their local guests can encounter Terra Trionfo wines — by the glass, by the bottle, or through curated flights.',
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ),
                      title: 'Build the Network',
                      body: 'Restaurant partners become part of a carefully curated group of venues across Massachusetts. Each venue is selected for alignment with the Terra Trionfo ethos: quality, story, provenance.',
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      ),
                      title: 'Grow Together',
                      body: 'On-trade partnerships create recurring purchase patterns, producer visibility, and consumer discovery — driving both restaurant wine program success and importer volume.',
                    },
                  ].map((item) => (
                    <div key={item.title} className="bg-parchment-50 border border-parchment-200 p-6">
                      <div className="mb-4">{item.icon}</div>
                      <h3 className="font-serif font-semibold text-olive-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-olive-600 leading-relaxed">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Empty state CTA */}
              <div className="text-center py-12 border-t border-parchment-200">
                <div className="w-16 h-16 rounded-full bg-olive-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-olive-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-olive-900 mb-3">Restaurant Partnerships Coming Soon</h2>
                <p className="text-olive-600 max-w-md mx-auto mb-8 leading-relaxed">
                  We are establishing our Massachusetts restaurant network. Venues serving Terra Trionfo wines by the glass and bottle will appear here.
                </p>
                <Link
                  href="/contact"
                  className="inline-block bg-olive-900 text-parchment-100 text-sm font-medium px-7 py-3 hover:bg-olive-800 transition-colors uppercase tracking-wider"
                >
                  Restaurant Partnership Inquiry
                </Link>
              </div>
            </div>
          )}

          {!loading && all.length > 0 && (
            <>
              {/* Featured section */}
              {featured.length > 0 && (
                <div className="mb-16">
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-500 mb-6">
                    FEATURED PARTNERS
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    {featured.map((r) => (
                      <RestaurantCard key={r.id} restaurant={r} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* Full grid */}
              <div>
                {featured.length > 0 && (
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-500 mb-6">
                    ALL PARTNER RESTAURANTS
                  </p>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {all.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function RestaurantCard({ restaurant: r, featured }: { restaurant: Restaurant; featured?: boolean }) {
  const winePreview = r.wines.slice(0, 2)

  return (
    <Link
      href={`/restaurants/${r.slug}`}
      className={`group block bg-white border border-olive-200 hover:border-olive-400 transition-all duration-200 hover:shadow-md ${featured ? 'p-8' : 'p-6'}`}
    >
      {r.heroImageUrl && (
        <div className="relative w-full h-40 bg-parchment-200 overflow-hidden mb-5">
          <img src={r.heroImageUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}

      {r.isFeatured && (
        <p className="text-[9px] font-medium tracking-[0.14em] uppercase text-amber-700 bg-amber-50 border border-amber-200 inline-block px-2 py-0.5 mb-3">
          Featured Partner
        </p>
      )}

      <h2 className={`font-serif font-bold text-olive-900 group-hover:text-olive-700 mb-1 ${featured ? 'text-2xl' : 'text-xl'}`}>
        {r.name}
      </h2>

      <p className="text-sm text-olive-500 mb-3">
        {r.city}, {r.state}
        {r.cuisineType && <> · {r.cuisineType}</>}
        {r.priceRange && <> · {r.priceRange}</>}
      </p>

      {r.description && (
        <p className="text-sm text-olive-700 leading-relaxed mb-4 line-clamp-3">{r.description}</p>
      )}

      {winePreview.length > 0 && (
        <div className="border-t border-olive-100 pt-4 mt-auto">
          <p className="text-[10px] uppercase tracking-wider text-olive-400 mb-2">Wines on the list</p>
          <ul className="space-y-1">
            {winePreview.map((w) => (
              <li key={w.id} className="flex items-center gap-2 text-xs text-olive-700">
                <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                {w.product.name}
                {w.product.vintage && ` ${w.product.vintage}`}
                <span className="ml-auto text-olive-400 capitalize">
                  {w.servingType === 'BY_GLASS' ? 'By the Glass' : 'Bottle List'}
                </span>
              </li>
            ))}
          </ul>
          {r.wines.length > 2 && (
            <p className="text-xs text-olive-400 mt-2">+{r.wines.length - 2} more wines</p>
          )}
        </div>
      )}
    </Link>
  )
}
