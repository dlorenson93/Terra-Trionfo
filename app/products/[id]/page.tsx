'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface Product {
  id: string
  name: string
  description?: string
  imageUrl?: string
  category: string
  retailPriceCents: number
  inventory: number
  commerceModel: string
  allowedFulfillment: string[]
  company: {
    id: string
    name: string
    slug?: string
    description?: string
    region?: string
    country?: string
    shortDescription?: string
  }
  // Wine fields
  vintage?: number | null
  appellation?: string | null
  designation?: string | null
  country?: string | null
  region?: string | null
  subregion?: string | null
  grapeVarietals?: string[]
  wineStyle?: string | null
  body?: string | null
  acidity?: string | null
  tannin?: string | null
  abv?: number | null
  bottleSizeMl?: number | null
  tastingNotesShort?: string | null
  tastingNotesFull?: string | null
  aromaNotes?: string | null
  palateNotes?: string | null
  finishNotes?: string | null
  vinification?: string | null
  aging?: string | null
  vineyardNotes?: string | null
  servingTemperature?: string | null
  decantingNotes?: string | null
  foodPairings?: string[]
  sustainabilityNotes?: string | null
  producerStoryExcerpt?: string | null
  isLimitedAllocation?: boolean
  isFeatured?: boolean
  isFoundingWine?: boolean
  badgeText?: string | null
  contentStatus?: string | null
  restaurantWines?: Array<{
    id: string
    servingType: string
    notes?: string | null
    restaurant: {
      id: string
      name: string
      slug: string
      city: string
      state: string
      cuisineType?: string | null
      priceRange?: string | null
      website?: string | null
      isFeatured: boolean
    }
  }>
}

function StatPill({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="bg-parchment-100 rounded-xl px-4 py-3 text-center">
      <p className="text-xs text-olive-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-semibold text-olive-900 capitalize">{value}</p>
    </div>
  )
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [cartMsg, setCartMsg] = useState<string | null>(null)
  const [pickupLocations, setPickupLocations] = useState<Array<{
    id: string; name: string; address: string; city: string; state: string; partnerType: string
  }>>([])

  useEffect(() => {
    fetchProduct()
    fetch('/api/pickup-locations')
      .then((r) => r.json())
      .then((data) => setPickupLocations(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find((item: any) => item.productId === product?.id)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.push({
        productId: product?.id,
        name: product?.name,
        imageUrl: product?.imageUrl,
        price: product?.retailPriceCents ? product.retailPriceCents / 100 : 0,
        quantity,
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    setCartMsg('Added to cart!')
    setTimeout(() => setCartMsg(null), 2500)
  }

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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-olive-900 mb-2">Product Not Found</h2>
            <p className="text-olive-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const isWine = product.category === 'WINE'
  const badge = product.badgeText || (product.isFoundingWine ? 'Founding Wine' : product.isLimitedAllocation ? 'Limited Allocation' : null)
  const hasWineStats = isWine && (product.body || product.acidity || product.tannin || product.abv || product.wineStyle || product.bottleSizeMl)
  const hasTastingNotes = isWine && (product.aromaNotes || product.palateNotes || product.finishNotes || product.tastingNotesFull)

  // Block non-live products from public view
  if (product.contentStatus && product.contentStatus !== 'LIVE') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <div className="max-w-3xl mx-auto px-4 py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-olive-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-olive-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-serif font-bold text-olive-900 mb-4">Selection in Preparation</h1>
            <p className="text-olive-600 mb-8">We&apos;re carefully vetting every producer and wine before it appears in our marketplace. Check back soon.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/products" className="btn btn-primary">Browse Available Wines</Link>
              <Link href="/partner/onboarding" className="btn btn-secondary">Become a Partner</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero block */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="text-sm text-olive-500 mb-6 flex items-center gap-2">
            <Link href="/products" className="hover:text-olive-700">Products</Link>
            <span>›</span>
            <span className="text-olive-700">{product.name}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Image */}
            <div className="relative aspect-square bg-parchment-200 rounded-2xl overflow-hidden">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-olive-100 to-olive-200">
                  <svg className="w-32 h-32 text-olive-300" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {badge && (
                <div className="absolute top-4 left-4">
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                    product.isFoundingWine ? 'bg-amber-400 text-olive-900' :
                    product.isLimitedAllocation ? 'bg-red-600 text-white' :
                    'bg-olive-700 text-parchment-100'
                  }`}>
                    {badge}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              {/* Category + vintage */}
              <p className="text-xs text-olive-500 uppercase tracking-widest mb-2">
                {product.category}{product.vintage ? ` · ${product.vintage}` : ''}
                {product.appellation ? ` · ${product.appellation}` : ''}
              </p>

              <h1 className="text-4xl font-serif font-bold text-olive-900 mb-1 leading-tight">
                {product.name}
              </h1>

              {product.grapeVarietals && product.grapeVarietals.length > 0 && (
                <p className="text-sm text-olive-600 italic mb-4">{product.grapeVarietals.join(', ')}</p>
              )}

              {/* Tasting note teaser */}
              {product.tastingNotesShort && (
                <p className="text-base text-olive-700 italic mb-6 border-l-4 border-parchment-400 pl-4 leading-relaxed">
                  "{product.tastingNotesShort}"
                </p>
              )}

              {/* Producer link */}
              <div className="mb-6">
                <p className="text-xs text-olive-500 uppercase tracking-wider mb-1">Producer</p>
                <Link
                  href={`/producers/${product.company.slug || product.company.id}`}
                  className="text-lg font-serif font-semibold text-olive-800 hover:text-olive-900 underline underline-offset-4"
                >
                  {product.company.name}
                </Link>
                {(product.company.region || product.company.country) && (
                  <p className="text-sm text-olive-500 mt-0.5">
                    {[product.company.region, product.company.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              {product.description && (
                <p className="text-olive-700 leading-relaxed mb-6">{product.description}</p>
              )}

              {/* Price + CTA */}
              <div className="border-t border-olive-200 pt-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-olive-900">
                    ${(product.retailPriceCents / 100).toFixed(2)}
                  </span>
                  {product.bottleSizeMl && (
                    <span className="text-sm text-olive-500">/ {product.bottleSizeMl}ml</span>
                  )}
                </div>

                <p className="text-sm text-olive-600 mb-5">
                  {product.inventory > 0 ? `${product.inventory} available` : 'Out of stock'}
                </p>

                {product.inventory > 0 && (
                  <div className="flex items-center gap-4 mb-5">
                    <div>
                      <label className="label">Qty</label>
                      <input
                        type="number"
                        min="1"
                        max={product.inventory}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="input-field w-24"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={product.inventory === 0}
                  className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                >
                  {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>

                {cartMsg && (
                  <p className="text-center text-sm text-green-700 font-medium mt-1">{cartMsg}</p>
                )}

                {/* Commerce badges */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {(product.commerceModel === 'MARKETPLACE' || product.commerceModel === 'HYBRID') && (
                    <span className="badge bg-olive-100 text-olive-700 text-xs">Marketplace</span>
                  )}
                  {(product.commerceModel === 'WHOLESALE' || product.commerceModel === 'HYBRID') && (
                    <span className="badge bg-parchment-400 text-olive-800 text-xs">Wholesale</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wine stats + tasting notes */}
        {isWine && (
          <div className="bg-parchment-50 border-t border-parchment-300 py-14 px-4">
            <div className="max-w-5xl mx-auto">

              {hasWineStats && (
                <div className="mb-12">
                  <h2 className="text-2xl font-serif font-bold text-olive-900 mb-6">Wine Profile</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <StatPill label="Style" value={product.wineStyle} />
                    <StatPill label="Body" value={product.body} />
                    <StatPill label="Acidity" value={product.acidity} />
                    <StatPill label="Tannin" value={product.tannin} />
                    {product.abv != null && (
                      <div className="bg-parchment-100 rounded-xl px-4 py-3 text-center">
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-1">ABV</p>
                        <p className="text-sm font-semibold text-olive-900">{product.abv}%</p>
                      </div>
                    )}
                    {product.bottleSizeMl && (
                      <div className="bg-parchment-100 rounded-xl px-4 py-3 text-center">
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-1">Bottle</p>
                        <p className="text-sm font-semibold text-olive-900">{product.bottleSizeMl}ml</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasTastingNotes && (
                <div className="mb-12">
                  <h2 className="text-2xl font-serif font-bold text-olive-900 mb-6">Tasting Notes</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {product.aromaNotes && (
                      <div>
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-2">Aroma</p>
                        <p className="text-olive-800 leading-relaxed">{product.aromaNotes}</p>
                      </div>
                    )}
                    {product.palateNotes && (
                      <div>
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-2">Palate</p>
                        <p className="text-olive-800 leading-relaxed">{product.palateNotes}</p>
                      </div>
                    )}
                    {product.finishNotes && (
                      <div>
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-2">Finish</p>
                        <p className="text-olive-800 leading-relaxed">{product.finishNotes}</p>
                      </div>
                    )}
                  </div>
                  {product.tastingNotesFull && !product.aromaNotes && (
                    <p className="text-olive-800 leading-relaxed">{product.tastingNotesFull}</p>
                  )}
                </div>
              )}

              {/* Winemaking + serving */}
              {(product.vinification || product.aging || product.vineyardNotes) && (
                <div className="mb-12">
                  <h2 className="text-2xl font-serif font-bold text-olive-900 mb-6">Behind the Wine</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {product.vineyardNotes && (
                      <div>
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-2">Vineyard</p>
                        <p className="text-olive-800 text-sm leading-relaxed">{product.vineyardNotes}</p>
                      </div>
                    )}
                    {product.vinification && (
                      <div>
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-2">Vinification</p>
                        <p className="text-olive-800 text-sm leading-relaxed">{product.vinification}</p>
                      </div>
                    )}
                    {product.aging && (
                      <div>
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-2">Aging</p>
                        <p className="text-olive-800 text-sm leading-relaxed">{product.aging}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Serving + pairing */}
              {(product.servingTemperature || product.decantingNotes || (product.foodPairings && product.foodPairings.length > 0)) && (
                <div className="mb-12">
                  <h2 className="text-2xl font-serif font-bold text-olive-900 mb-6">Serving &amp; Pairing</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {product.servingTemperature && (
                      <div>
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-2">Serving Temp</p>
                        <p className="text-olive-800 text-sm">{product.servingTemperature}</p>
                      </div>
                    )}
                    {product.decantingNotes && (
                      <div>
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-2">Decanting</p>
                        <p className="text-olive-800 text-sm">{product.decantingNotes}</p>
                      </div>
                    )}
                    {product.foodPairings && product.foodPairings.length > 0 && (
                      <div>
                        <p className="text-xs text-olive-500 uppercase tracking-wider mb-2">Food Pairings</p>
                        <p className="text-olive-800 text-sm">{product.foodPairings.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fulfillment compliance section */}
        <div className="bg-olive-50 border-t border-olive-200 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">Ordering &amp; Fulfillment</p>
            <h2 className="text-lg font-serif font-semibold text-olive-900 mb-4">How to Receive Your Order</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {product.allowedFulfillment.includes('PICKUP') && (
                <div className="flex gap-3 bg-white rounded-xl p-4 border border-olive-200">
                  <div className="text-2xl">📦</div>
                  <div>
                    <p className="font-semibold text-olive-900 text-sm">Pickup</p>
                    <p className="text-xs text-olive-600 mt-1">
                      Available for pickup through Terra Trionfo at our warehouse location. Pickup is available on select scheduled days.
                    </p>
                  </div>
                </div>
              )}
              {product.allowedFulfillment.includes('LOCAL_DELIVERY') && (
                <div className="flex gap-3 bg-white rounded-xl p-4 border border-olive-200">
                  <div className="text-2xl">🚗</div>
                  <div>
                    <p className="font-semibold text-olive-900 text-sm">Local Delivery</p>
                    <p className="text-xs text-olive-600 mt-1">
                      Local delivery available in select Massachusetts regions on scheduled delivery days. Regions served include Greater Boston, North Shore, Cape &amp; Islands, and Western Massachusetts.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* Trade distribution note */}
            <div className="mt-5 pt-5 border-t border-olive-200">
              <div className="flex gap-3 bg-white rounded-xl p-4 border border-olive-200">
                <div className="text-2xl">🍷</div>
                <div>
                  <p className="font-semibold text-olive-900 text-sm">Trade &amp; Restaurant Availability</p>
                  <p className="text-xs text-olive-600 mt-1">
                    Trade distribution and restaurant placements are supported through the Trionfo Distribution Group network. Contact us for wholesale and on-premise inquiries.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-olive-500 mt-4">
              ⚠️ All alcohol sales comply with Massachusetts state law. Interstate shipping is not available.
            </p>
          </div>
        </div>

        {/* Where to Experience This Wine */}
        {product.restaurantWines && product.restaurantWines.length > 0 && (
          <div className="py-14 px-4 border-t border-parchment-300">
            <div className="max-w-5xl mx-auto">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                THE NETWORK
              </p>
              <h2 className="text-2xl font-serif font-bold text-olive-900 mb-8">
                Where to Experience This Wine
              </h2>

              {/* Group by city */}
              {(() => {
                const byCityMap = new Map<string, typeof product.restaurantWines>()
                product.restaurantWines!.forEach((rw) => {
                  const key = `${rw.restaurant.city}, ${rw.restaurant.state}`
                  if (!byCityMap.has(key)) byCityMap.set(key, [])
                  byCityMap.get(key)!.push(rw)
                })
                return Array.from(byCityMap.entries()).map(([cityKey, wines]) => (
                  <div key={cityKey} className="mb-8 last:mb-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-olive-500 mb-4">{cityKey}</p>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {wines.map((rw) => (
                        <Link
                          key={rw.id}
                          href={`/restaurants/${rw.restaurant.slug}`}
                          className="group flex flex-col gap-1 border border-olive-200 hover:border-olive-400 bg-white p-4 transition-all hover:shadow-sm"
                        >
                          <span className="font-serif font-semibold text-olive-900 group-hover:text-olive-700 text-base leading-snug">
                            {rw.restaurant.name}
                          </span>
                          {rw.restaurant.cuisineType && (
                            <span className="text-xs text-olive-500">{rw.restaurant.cuisineType}</span>
                          )}
                          <span className={`text-xs font-medium mt-1 ${rw.servingType === 'BY_GLASS' ? 'text-amber-700' : 'text-olive-600'}`}>
                            {rw.servingType === 'BY_GLASS' ? 'By the Glass' : 'Bottle List'}
                          </span>
                          {rw.notes && (
                            <span className="text-xs text-olive-500 italic mt-1">"{rw.notes}"</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* Local Pickup Locations */}
        {product.allowedFulfillment.includes('PICKUP') && pickupLocations.length > 0 && (
          <div className="bg-parchment-50 border-t border-parchment-300 py-14 px-4">
            <div className="max-w-5xl mx-auto">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                COLLECTION POINTS
              </p>
              <h2 className="text-2xl font-serif font-bold text-olive-900 mb-8">
                Local Pickup Locations
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pickupLocations.map((loc) => (
                  <div key={loc.id} className="bg-white border border-olive-200 p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-7 h-7 rounded-full bg-olive-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-olive-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-olive-900 text-sm">{loc.name}</p>
                        <p className="text-xs text-olive-500 mt-0.5">{loc.city}, {loc.state}</p>
                        <p className="text-xs text-olive-400 mt-0.5">{loc.address}</p>
                        {loc.partnerType !== 'WAREHOUSE' && (
                          <span className="inline-block mt-2 text-[9px] font-medium tracking-[0.12em] uppercase text-olive-500 bg-olive-50 border border-olive-200 px-1.5 py-0.5">
                            {loc.partnerType === 'RESTAURANT' ? 'Restaurant Partner' : 'Retail Partner'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Producer connection */}
        {product.producerStoryExcerpt && (
          <div className="py-14 px-4">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-xs text-olive-500 uppercase tracking-widest mb-3">The Story Behind This Wine</p>
              <blockquote className="text-xl font-serif italic text-olive-800 leading-relaxed mb-6">
                "{product.producerStoryExcerpt}"
              </blockquote>
              <Link
                href={`/producers/${product.company.slug || product.company.id}`}
                className="btn-outline inline-block"
              >
                Meet {product.company.name} →
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
