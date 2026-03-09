'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/products/ProductCard'
import { VISIBLE_CATEGORIES, CATEGORY_LABELS } from '@/config/marketplace'
import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'

interface Product {
  id: string
  name: string
  imageUrl?: string
  category: string
  retailPriceCents: number
  commerceModel: 'MARKETPLACE' | 'WHOLESALE' | 'HYBRID'
  company: {
    id: string
    name: string
  }
  vintage?: number | null
  appellation?: string | null
  grapeVarietals?: string[]
  tastingNotesShort?: string | null
  isLimitedAllocation?: boolean
  isFeatured?: boolean
  isFoundingWine?: boolean
  badgeText?: string | null
  contentStatus?: string
}

function ProductsContent() {
  const searchParams = useSearchParams()

  // Initialise from URL param ?category=WINE (enum key) on first render
  const initialCategory = (() => {
    const param = searchParams.get('category')
    if (!param) return ''
    // Accept either enum key (WINE) or display label (Wine)
    if (VISIBLE_CATEGORIES.includes(param as any)) return CATEGORY_LABELS[param as keyof typeof CATEGORY_LABELS] ?? ''
    const byLabel = VISIBLE_CATEGORIES.find((c) => CATEGORY_LABELS[c]?.toLowerCase() === param.toLowerCase())
    return byLabel ? CATEGORY_LABELS[byLabel] : ''
  })()

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [portfolioFilter, setPortfolioFilter] = useState<string>('all')
  const categories = ['All', ...VISIBLE_CATEGORIES.map((c) => CATEGORY_LABELS[c] ?? c)]

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // Map display label back to enum key
      const categoryKey = selectedCategory && selectedCategory !== 'All'
        ? VISIBLE_CATEGORIES.find((c) => CATEGORY_LABELS[c] === selectedCategory) ?? selectedCategory
        : ''
      const url = categoryKey
        ? `/api/products?category=${encodeURIComponent(categoryKey)}&public=true`
        : '/api/products?public=true'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      
      // Ensure data is an array; cast items to our Product type
      if (Array.isArray(data)) {
        setProducts(data as Product[])
      } else {
        console.error('API returned non-array data:', data)
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-olive-900 mb-4">
              Shop Products
            </h1>
            <p className="text-lg text-olive-700">
              Authentic artisan products from family farms, winemakers, and
              skilled producers who bring generations of tradition to every bottle and harvest
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Category Filter */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-olive-800 mb-3">
              Filter by Category
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(category === 'All' ? '' : category)
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    (category === 'All' && !selectedCategory) ||
                    selectedCategory === category
                      ? 'bg-olive-700 text-parchment-50'
                      : 'bg-white text-olive-700 border border-olive-300 hover:bg-olive-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-olive-700"></div>
              <p className="text-olive-700 mt-4">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-olive-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-olive-900">
                Our Curated Selection Is Being Prepared
              </h3>
              <p className="text-olive-600 mt-2">
                We&apos;re carefully reviewing producers and their wines. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.isArray(products) ? products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  imageUrl={product.imageUrl}
                  category={product.category}
                  retailPrice={product.retailPriceCents / 100}
                  companyName={product.company.name}
                  commerceModel={product.commerceModel}
                  vintage={product.vintage}
                  appellation={product.appellation}
                  grapeVarietals={product.grapeVarietals}
                  tastingNotesShort={product.tastingNotesShort}
                  isLimitedAllocation={product.isLimitedAllocation}
                  isFeatured={product.isFeatured}
                  isFoundingWine={product.isFoundingWine}
                  badgeText={product.badgeText}
                  contentStatus={product.contentStatus}
                />
              )) : null}
            </div>
          )}
        </div>

        {/* ── Portfolio Preview ────────────────────────────────────── */}
        <section className="bg-olive-900 border-t border-olive-800 py-20 px-4 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='4' fill='%23fff'/%3E%3Crect width='4' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
              backgroundSize: '4px 4px',
            }}
          />
          <div className="relative max-w-7xl mx-auto">
            <p className="text-[10px] font-medium text-amber-400/60 uppercase tracking-[0.14em] mb-3">
              Incoming Portfolio
            </p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-serif font-bold text-parchment-100 mb-2">
                  Wines Under Evaluation
                </h2>
                <p className="text-parchment-300/60 text-sm leading-relaxed max-w-lg">
                  Estates and wines currently being tasted and evaluated for U.S. import. Pricing
                  is available to on-trade partners upon request.
                </p>
              </div>
              {/* Collection filter */}
              <div className="flex gap-2 flex-shrink-0">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'classical', label: 'Classical' },
                  { value: 'alternative-next-generation', label: 'Alternative' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setPortfolioFilter(f.value)}
                    className={`text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 border transition-colors ${
                      portfolioFilter === f.value
                        ? 'border-amber-400/60 text-amber-300'
                        : 'border-parchment-400/20 text-parchment-400/50 hover:border-parchment-400/40 hover:text-parchment-300/70'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {WINES.filter((w) => {
                if (portfolioFilter === 'all') return true
                const p = PRODUCERS.find((prod) => prod.id === w.producerId)
                return p?.collection === portfolioFilter
              }).map((wine) => {
                const producer = PRODUCERS.find((p) => p.id === wine.producerId)
                return (
                  <Link
                    key={wine.id}
                    href={`/wines/${wine.slug}`}
                    className="group border border-parchment-300/10 bg-parchment-100/[0.03] hover:border-amber-400/20 hover:bg-parchment-100/[0.06] transition-colors p-6 flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[9px] font-medium text-parchment-400/55 uppercase tracking-[0.3em]">
                        {wine.type}
                      </span>
                      {wine.criticScore && (
                        <span className="text-[9px] text-amber-400/60 font-medium">★</span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-parchment-100 text-base leading-snug mb-1 group-hover:text-amber-100/90 transition-colors">
                      {wine.displayName}
                    </h3>
                    {wine.appellation && (
                      <p className="text-[10px] text-parchment-400/50 mb-2">{wine.appellation}</p>
                    )}
                    {producer && (
                      <p className="text-[10px] text-parchment-400/40 mb-3 uppercase tracking-wider">
                        {producer.region}
                      </p>
                    )}
                    <p className="text-xs text-parchment-400/55 leading-relaxed line-clamp-3 flex-grow">
                      {wine.description}
                    </p>
                    {wine.criticScore && (
                      <p className="text-[10px] text-amber-400/60 mt-3">{wine.criticScore}</p>
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="mt-10 flex gap-6">
              <Link
                href="/producers"
                className="border border-parchment-400/30 text-parchment-300/80 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-parchment-400/60 hover:text-parchment-100 transition-colors"
              >
                View All Producers
              </Link>
              <Link
                href="/regions"
                className="border border-amber-400/30 text-amber-300/70 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-amber-400/60 hover:text-amber-200 transition-colors"
              >
                Explore by Region
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-700"></div></div>}>
      <ProductsContent />
    </Suspense>
  )
}
