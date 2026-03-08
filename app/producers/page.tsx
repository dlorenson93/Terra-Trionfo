import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface Producer {
  id: string
  name: string
  slug?: string
  heroImageUrl?: string
  region?: string
}

export default async function ProducersPage() {
  // fetch approved companies
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/companies?status=APPROVED`, { cache: 'no-store' })
  const data = await res.json()
  const producers: Producer[] = Array.isArray(data) ? data : []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 bg-parchment-100">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-serif font-bold text-olive-900 mb-6">
            Producers
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.isArray(producers) ? producers.map((p) => (
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
                  {p.region && <p className="text-sm text-olive-600">{p.region}</p>}
                </div>
              </Link>
            )) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
