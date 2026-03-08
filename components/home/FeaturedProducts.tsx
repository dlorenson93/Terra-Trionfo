'use client'

import { useState, useEffect } from 'react'
import ProductCard from '@/components/products/ProductCard'
import Link from 'next/link'
import { VISIBLE_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS } from '@/config/marketplace'

interface Product {
  id: string
  name: string
  imageUrl?: string
  category: string
  retailPriceCents: number
  commerceModel: 'MARKETPLACE' | 'WHOLESALE' | 'HYBRID'
  listingOwner: string
  company: {
    id: string
    name: string
    slug?: string
  }
}

function CategorySection({ category }: { category: string }) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch(`/api/products?category=${encodeURIComponent(category)}&limit=4`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [category])

  if (products.length === 0) return null

  const label = CATEGORY_LABELS[category] ?? category
  const icon = CATEGORY_ICONS[category] ?? ''

  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-olive-900">
            {icon} Featured {label}
          </h2>
          <Link
            href={`/products?category=${encodeURIComponent(label)}`}
            className="text-sm font-medium text-olive-600 hover:text-olive-900"
          >
            View all {label} →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              imageUrl={p.imageUrl}
              category={p.category}
              retailPrice={p.retailPriceCents / 100}
              companyName={p.company.name}
              commerceModel={p.commerceModel}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function FeaturedProducts() {
  return (
    <div className="bg-white">
      {VISIBLE_CATEGORIES.map((cat) => (
        <CategorySection key={cat} category={cat} />
      ))}
    </div>
  )
}
