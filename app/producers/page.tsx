import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'

interface ProducerRow {
  id: string
  name: string
  slug: string | null
  heroImageUrl: string | null
  region: string | null
  country: string | null
  shortDescription?: string | null
  isFoundingProducer?: boolean
}

export default async function ProducersPage() {
  const rawProducers = await prisma.company.findMany({
    where: { status: 'APPROVED', contentStatus: 'LIVE' },
    orderBy: { name: 'asc' },
  })
  // Cast to access new fields (available after migration + prisma generate)
  const producers = rawProducers as unknown as ProducerRow[]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-olive-900 mb-3">
              Our Producers
            </h1>
            <p className="text-lg text-olive-700">
              Artisan families and estates, curated for provenance, quality, and trust.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {producers.length === 0 ? (
            <p className="text-olive-600 text-center py-12">No producers listed yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {producers.map((p) => (
                <Link
                  key={p.id}
                  href={`/producers/${p.slug || p.id}`}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative h-44 bg-olive-200 overflow-hidden">
                    {p.heroImageUrl ? (
                      <img
                        src={p.heroImageUrl}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gradient-to-br from-olive-700 to-olive-900">
                        <span className="text-4xl font-serif font-bold text-parchment-200 opacity-30">
                          {p.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {p.isFoundingProducer && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-amber-400 text-olive-900 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                          Founding Producer
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-serif font-semibold text-olive-900 group-hover:text-olive-700 mb-1">
                      {p.name}
                    </h3>
                    {(p.region || p.country) && (
                      <p className="text-xs text-olive-500 uppercase tracking-wider mb-2">
                        {[p.region, p.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {p.shortDescription && (
                      <p className="text-sm text-olive-700 line-clamp-2">{p.shortDescription}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
