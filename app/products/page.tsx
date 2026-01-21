'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/products/ProductCard'

interface Product {
  id: string
  name: string
  imageUrl?: string
  category: string
  consumerPrice: number
  isMarketplace: boolean
  isWholesale: boolean
  company: {
    id: string
    name: string
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const categories = [
    'All',
    'Oils & Vinegars',
    'Wines',
    'Pasta & Grains',
    'Canned Goods',
    'Specialty',
  ]

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const url =
        selectedCategory && selectedCategory !== 'All'
          ? `/api/products?category=${encodeURIComponent(selectedCategory)}`
          : '/api/products'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setProducts(data)
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
                No products found
              </h3>
              <p className="text-olive-600 mt-2">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  imageUrl={product.imageUrl}
                  category={product.category}
                  consumerPrice={product.consumerPrice}
                  companyName={product.company.name}
                  isMarketplace={product.isMarketplace}
                  isWholesale={product.isWholesale}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
