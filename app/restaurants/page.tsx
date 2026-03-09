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
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-olive-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-olive-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-olive-900 mb-3">Restaurant Partnerships Coming Soon</h2>
              <p className="text-olive-600 max-w-md mx-auto">
                We are establishing our restaurant network. Venues serving Terra Trionfo wines will appear here.
              </p>
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
