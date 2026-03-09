import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'
import { PRODUCERS } from '@/data/producers'

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

        {/* ── Portfolio ──────────────────────────────────────────── */}
        <section className="bg-parchment-50 border-t border-parchment-200 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
              Terra Trionfo Portfolio
            </p>
            <h2 className="text-3xl font-serif font-bold text-olive-900 mb-3">
              Initial Producer Selection
            </h2>
            <p className="text-olive-500 text-sm leading-relaxed mb-14 max-w-xl">
              Six Italian estates currently under evaluation for U.S. import — sourced directly from
              Italy&apos;s most distinctive wine regions.
            </p>

            {/* Classical */}
            <div className="mb-14">
              <p className="text-[9px] font-medium text-amber-600/60 uppercase tracking-[0.3em] mb-6 border-b border-parchment-300 pb-3">
                Classical Selection
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {PRODUCERS.filter((p) => p.collection === 'classical').map((p) => (
                  <Link
                    key={p.id}
                    href={`/producers/${p.slug}`}
                    className="group border border-parchment-300 hover:border-olive-400 bg-white hover:bg-parchment-50 transition-all duration-200 p-7 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-medium text-amber-600/60 uppercase tracking-[0.3em]">
                        Classical
                      </span>
                      <span className="text-[9px] text-olive-400 uppercase tracking-wider">
                        {p.region}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-olive-900 text-xl leading-snug mb-1 group-hover:text-olive-700 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-olive-500 mb-4">{p.subregion}</p>
                    <p className="text-sm text-olive-600 leading-relaxed line-clamp-3 flex-grow">
                      {p.summary}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {p.keywords.slice(0, 3).map((kw) => (
                        <span key={kw} className="text-[9px] border border-olive-200 text-olive-500 px-2 py-0.5">
                          {kw}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-olive-400 group-hover:text-olive-600 mt-4 transition-colors uppercase tracking-wider">
                      View estate →
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Alternative & Next Generation */}
            <div>
              <p className="text-[9px] font-medium text-olive-500/60 uppercase tracking-[0.3em] mb-6 border-b border-parchment-300 pb-3">
                Alternative &amp; Next Generation
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {PRODUCERS.filter((p) => p.collection === 'alternative-next-generation').map((p) => (
                  <Link
                    key={p.id}
                    href={`/producers/${p.slug}`}
                    className="group border border-parchment-300 hover:border-olive-400 bg-white hover:bg-parchment-50 transition-all duration-200 p-7 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-medium text-olive-500/60 uppercase tracking-[0.3em]">
                        Alt / Next Gen
                      </span>
                      <span className="text-[9px] text-olive-400 uppercase tracking-wider">
                        {p.region}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-olive-900 text-xl leading-snug mb-1 group-hover:text-olive-700 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-olive-500 mb-4">{p.subregion}</p>
                    <p className="text-sm text-olive-600 leading-relaxed line-clamp-3 flex-grow">
                      {p.summary}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {p.keywords.slice(0, 3).map((kw) => (
                        <span key={kw} className="text-[9px] border border-olive-200 text-olive-500 px-2 py-0.5">
                          {kw}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-olive-400 group-hover:text-olive-600 mt-4 transition-colors uppercase tracking-wider">
                      View estate →
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Live on Platform ───────────────────────────────────────── */}
        {producers.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-6">
              Live on Terra Trionfo
            </p>
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
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
