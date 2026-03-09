'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/products/ProductCard'
import WineCard from '@/components/wines/WineCard'
import { VISIBLE_CATEGORIES, CATEGORY_LABELS } from '@/config/marketplace'
import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'
import type { WineType } from '@/types/wine'

// Derive unique wine types from the portfolio in a stable order
const TYPE_ORDER: WineType[] = ['Red', 'White', 'Sparkling', 'Sparkling Rosé', 'Rosé']
const PORTFOLIO_TYPES: WineType[] = TYPE_ORDER.filter((t) =>
  WINES.some((w) => w.type === t)
)

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
  const [collectionFilter, setCollectionFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const categories = ['All', ...VISIBLE_CATEGORIES.map((c) => CATEGORY_LABELS[c] ?? c)]

  // Filtered portfolio wines derived from both filter dimensions
  const filteredWines = useMemo(() => {
    return WINES.filter((w) => {
      const matchesType = typeFilter === 'all' || w.type === typeFilter
      if (!matchesType) return false
      if (collectionFilter === 'all') return true
      const p = PRODUCERS.find((prod) => prod.id === w.producerId)
      return p?.collection === collectionFilter
    })
  }, [typeFilter, collectionFilter])

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
            // No live products yet — show the incoming portfolio wines inline
            <div>
              {/* Section header */}
              <div className="mb-6">
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                  Incoming Portfolio
                </p>
                <h2 className="text-2xl font-serif font-bold text-olive-900 mb-1">
                  Wines Under Evaluation
                </h2>
                <p className="text-sm text-olive-500 max-w-2xl leading-relaxed">
                  Estates and wines currently being tasted for U.S. import.
                  Pricing available to on-trade partners upon request.
                </p>
              </div>

              {/* Filter bar — wine type + collection */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8 pb-6 border-b border-parchment-200">
                {/* Wine type */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-olive-400 uppercase tracking-widest mr-1">Type</span>
                  {(['all', ...PORTFOLIO_TYPES] as string[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 border transition-colors rounded-sm ${
                        typeFilter === t
                          ? 'border-olive-700 text-olive-900 bg-olive-50'
                          : 'border-parchment-300 text-olive-500 hover:border-olive-400 hover:text-olive-700 bg-white'
                      }`}
                    >
                      {t === 'all' ? 'All Types' : t}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <span className="hidden sm:block w-px h-4 bg-parchment-300" />

                {/* Collection */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-olive-400 uppercase tracking-widest mr-1">Collection</span>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'classical', label: 'Classical' },
                    { value: 'alternative-next-generation', label: 'Alternative' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setCollectionFilter(f.value)}
                      className={`text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 border transition-colors rounded-sm ${
                        collectionFilter === f.value
                          ? 'border-olive-700 text-olive-900 bg-olive-50'
                          : 'border-parchment-300 text-olive-500 hover:border-olive-400 hover:text-olive-700 bg-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Result count */}
                <span className="ml-auto text-[10px] text-olive-400 tabular-nums">
                  {filteredWines.length} wine{filteredWines.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Wine grid */}
              {filteredWines.length === 0 ? (
                <div className="py-16 text-center text-olive-400 text-sm">
                  No wines match the selected filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredWines.map((wine) => {
                    const producer = PRODUCERS.find((p) => p.id === wine.producerId)
                    return (
                      <WineCard key={wine.id} wine={wine} producer={producer} />
                    )
                  })}
                </div>
              )}
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
