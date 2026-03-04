'use client'

import { useState, useEffect } from 'react'
import ProductCard from '@/components/products/ProductCard'

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

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/products?limit=8')
      .then((res) => res.json())
      .then((data) => setProducts(data || []))
      .catch(console.error)
  }, [])

  if (products.length === 0) return null

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-olive-900 mb-8">
          Featured Products
        </h2>
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
