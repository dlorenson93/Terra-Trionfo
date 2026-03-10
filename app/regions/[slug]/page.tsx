import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { REGIONS } from '@/lib/regions'
import { PRODUCERS } from '@/data/producers'
import { WINES } from '@/data/wines'
import WineCard from '@/components/wines/WineCard'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const region = REGIONS[params.slug]
  if (!region) return { title: 'Region Not Found | Terra Trionfo' }
  return {
    title: `${region.name} Wine Region — ${region.subtitle} | Terra Trionfo`,
    description: region.description.slice(0, 160),
    openGraph: {
      title: `${region.name} Wine Region | Terra Trionfo`,
      description: region.description.slice(0, 160),
    },
  }
}

export default async function RegionPage({ params }: Props) {
  const region = REGIONS[params.slug]
  if (!region) notFound()

  // Find producers whose region field matches any of our keywords
  const rawProducers = await prisma.company.findMany({
    where: {
      status: 'APPROVED',
      contentStatus: 'LIVE',
      OR: region.dbKeywords.map((kw) => ({
        region: { contains: kw, mode: 'insensitive' as const },
      })),
    },
    orderBy: { name: 'asc' },
  })
  const producers = rawProducers as any[]

  // Portfolio producers mapped to this region
  const portfolioProducers = PRODUCERS.filter((p) => p.regionSlug === params.slug)

  // Portfolio wines from those producers
  const portfolioWines = WINES.filter((w) =>
    portfolioProducers.some((p) => p.id === w.producerId)
  )

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${region.name} Wine Region`,
    alternateName: region.subtitle,
    description: region.description,
    containedInPlace: {
      '@type': 'Country',
      name: 'Italy',
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Principal Grapes', value: region.grapes.join(', ') },
      { '@type': 'PropertyValue', name: 'Key Appellations', value: region.appellations.join(', ') },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="flex-grow">
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <div className="bg-olive-900 py-20 px-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='4' fill='%23fff'/%3E%3Crect width='4' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
              backgroundSize: '4px 4px',
            }}
          />
          <div className="relative max-w-5xl mx-auto">
            <Link
              href="/regions"
              className="text-parchment-400/50 text-xs uppercase tracking-widest hover:text-parchment-300/70 transition-colors mb-8 inline-flex items-center gap-2"
            >
              ← Wine Regions
            </Link>
            <p className="text-[9px] font-medium text-amber-400/60 uppercase tracking-[0.3em] mb-4">
              {region.subtitle}
            </p>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-parchment-100 mb-5 leading-none">
              {region.name}
            </h1>
            <p className="text-parchment-300/70 text-lg max-w-2xl leading-relaxed">
              {region.heroLine}
            </p>
          </div>
        </div>

        {/* ── Editorial description ──────────────────────────────────── */}
        <section className="py-16 px-6 bg-parchment-50 border-t border-parchment-200">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-4">
                About the Region
              </p>
              <p className="text-olive-700 leading-relaxed text-base">{region.description}</p>
              <p className="text-olive-500 text-sm mt-4 leading-relaxed italic">{region.climateNote}</p>
            </div>
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                  Key Appellations
                </p>
                <ul className="space-y-1">
                  {region.appellations.map((a) => (
                    <li key={a} className="text-sm text-olive-700 flex items-start gap-2">
                      <span className="text-amber-500/50 mt-1">·</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                  Principal Grapes
                </p>
                <div className="flex flex-wrap gap-2">
                  {region.grapes.map((g) => (
                    <span
                      key={g}
                      className="text-xs border border-olive-300 text-olive-600 px-2 py-0.5"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Producers from this region ─────────────────────────────── */}
        <section className="py-16 px-6 bg-white border-t border-parchment-200">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
              Terra Trionfo Portfolio
            </p>
            <h2 className="text-3xl font-serif font-bold text-olive-900 mb-10">
              {region.name} Producers
            </h2>

            {portfolioProducers.length === 0 && producers.length === 0 ? (
              <div className="border border-parchment-300 py-16 text-center">
                <p className="text-olive-400 text-sm italic mb-4">
                  We are currently evaluating estates from {region.name} for portfolio inclusion.
                </p>
                <Link href="/producers" className="text-olive-600 text-xs underline underline-offset-4 hover:text-olive-800">
                  Explore active portfolio →
                </Link>
              </div>
            ) : (
              <>
                {/* Portfolio producers */}
                {portfolioProducers.length > 0 && (
                  <div className={producers.length > 0 ? 'mb-12' : ''}>
                    {producers.length > 0 && (
                      <p className="text-[9px] font-medium text-amber-500/60 uppercase tracking-[0.3em] mb-5">
                        Incoming Portfolio
                      </p>
                    )}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {portfolioProducers.map((p) => (
                        <Link
                          key={p.id}
                          href={`/producers/${p.slug}`}
                          className="group border border-parchment-300 hover:border-olive-400 bg-parchment-50 hover:bg-white transition-all duration-200 p-7 flex flex-col"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[9px] font-medium uppercase tracking-[0.3em] ${
                              p.collection === 'classical' ? 'text-amber-600/60' : 'text-olive-500/60'
                            }`}>
                              {p.collection === 'classical' ? 'Classical' : 'Alt / Next Gen'}
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-olive-900 text-xl leading-snug mb-1 group-hover:text-olive-700 transition-colors">
                            {p.name}
                          </h3>
                          <p className="text-xs text-olive-500 mb-3">{p.subregion}</p>
                          <p className="text-sm text-olive-600 leading-relaxed line-clamp-3 flex-grow">
                            {p.summary}
                          </p>
                          <p className="text-[10px] text-olive-400 group-hover:text-olive-600 mt-4 transition-colors uppercase tracking-wider">
                            View estate →
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* DB live producers */}
                {producers.length > 0 && (
                  <div>
                    {portfolioProducers.length > 0 && (
                      <p className="text-[9px] font-medium text-parchment-400/50 uppercase tracking-[0.3em] mb-5">
                        Live on Terra Trionfo
                      </p>
                    )}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {producers.map((producer) => (
                        <Link
                          key={producer.id}
                          href={`/producers/${producer.slug || producer.id}`}
                          className="group border border-parchment-300 hover:border-olive-400 bg-parchment-50 hover:bg-white transition-all duration-200 p-7 flex flex-col"
                        >
                          {producer.isFoundingProducer && (
                            <span className="text-[9px] font-medium text-amber-500/70 uppercase tracking-[0.3em] mb-3">
                              Founding Producer
                            </span>
                          )}
                          <h3 className="font-serif font-bold text-olive-900 text-xl leading-snug mb-2 group-hover:text-olive-700 transition-colors">
                            {producer.name}
                          </h3>
                          <p className="text-xs text-olive-500 mb-3">
                            {[producer.subregion, producer.region, producer.country].filter(Boolean).join(', ')}
                            {producer.foundedYear ? ` · Est. ${producer.foundedYear}` : ''}
                          </p>
                          {producer.shortDescription && (
                            <p className="text-sm text-olive-600 leading-relaxed line-clamp-3 flex-grow">
                              {producer.shortDescription}
                            </p>
                          )}
                          <p className="text-xs text-olive-400 group-hover:text-olive-600 mt-4 transition-colors">
                            View estate →
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── Portfolio wines from this region ─────────────────────── */}
        {portfolioWines.length > 0 && (
          <section className="py-16 px-6 bg-parchment-50 border-t border-parchment-200">
            <div className="max-w-5xl mx-auto">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                Portfolio Wines
              </p>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-olive-900 mb-1">
                    {region.name} Selection
                  </h2>
                  <p className="text-sm text-olive-500 max-w-xl leading-relaxed">
                    Wines from {region.name} currently under evaluation for U.S. import.
                    Pricing available to on-trade partners upon request.
                  </p>
                </div>
                <Link
                  href="/products"
                  className="text-[10px] uppercase tracking-[0.12em] text-olive-500 border border-olive-300 px-4 py-2 hover:border-olive-600 hover:text-olive-800 transition-colors flex-shrink-0"
                >
                  All Portfolio Wines →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {portfolioWines.map((wine) => {
                  const producer = portfolioProducers.find((p) => p.id === wine.producerId)
                  return <WineCard key={wine.id} wine={wine} producer={producer} />
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Browse wines from region ──────────────────────────────────── */}
        {portfolioWines.length > 0 ? (
          <section className="py-12 px-6 bg-olive-900 border-t border-olive-800">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-parchment-300/60 text-xs uppercase tracking-wider mb-1">
                  Explore Further
                </p>
                <p className="text-parchment-100 font-serif text-lg">
                  Discover all {region.name} wines in the portfolio.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/products"
                  className="border border-parchment-400/30 text-parchment-300/80 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-parchment-400/60 hover:text-parchment-100 transition-colors"
                >
                  Browse Portfolio Wines
                </Link>
                <Link
                  href="/producers"
                  className="border border-parchment-400/20 text-parchment-400/60 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-parchment-400/40 hover:text-parchment-300/80 transition-colors"
                >
                  All Producers
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="py-12 px-6 bg-parchment-100 border-t border-parchment-200">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-olive-600 font-serif text-base">
                Explore the active portfolio while we evaluate {region.name} producers.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/producers"
                  className="border border-olive-300 text-olive-600 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-olive-500 hover:text-olive-800 transition-colors"
                >
                  Our Producers
                </Link>
                <Link
                  href="/products"
                  className="border border-olive-200 text-olive-500 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-olive-400 hover:text-olive-700 transition-colors"
                >
                  Portfolio Wines
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
