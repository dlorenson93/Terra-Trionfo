'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Producer {
  id: string
  name: string
  slug?: string
  heroImageUrl?: string
}

export default function FeaturedProducers() {
  const [producers, setProducers] = useState<Producer[]>([])

  useEffect(() => {
    fetch('/api/companies?approved=true&limit=6')
      .then((r) => r.json())
      .then((data) => setProducers(data || []))
      .catch(console.error)
  }, [])

  if (!Array.isArray(producers) || producers.length === 0) return null

  return (
    <section className="py-16 px-4 bg-parchment-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-olive-900 mb-8">
          Featured Producers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {producers.map((p) => (
            <Link
              key={p.id}
              href={`/producers/${p.slug || p.id}`}
              className="group block bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
            >
              {p.heroImageUrl && (
                <img
                  src={p.heroImageUrl}
                  alt={p.name}
                  className="h-40 w-full object-cover group-hover:scale-105 transition-transform"
                />
              )}
              <div className="p-4">
                <h3 className="text-xl font-medium text-olive-800 group-hover:text-olive-900">
                  {p.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
