import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { REGION_LIST } from '@/lib/regions'
import { PRODUCERS } from '@/data/producers'
import { WINES } from '@/data/wines'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Italian Wine Regions | Terra Trionfo',
  description:
    'Explore Piedmont, Lombardy, Trentino–Alto Adige, and Emilia-Romagna — the Italian wine regions at the heart of the Terra Trionfo portfolio.',
  openGraph: {
    title: 'Italian Wine Regions | Terra Trionfo',
    description:
      'Discover the terroir, appellations, and producers behind every Terra Trionfo selection.',
  },
}

const ItalyMap = dynamic(() => import('@/components/maps/ItalyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[280/430] bg-olive-800/30 animate-pulse flex items-center justify-center">
      <p className="text-parchment-400/30 text-xs uppercase tracking-widest">Loading map…</p>
    </div>
  ),
})

export default function RegionsIndexPage() {
  const portfolioProducersInRegion = (slug: string) =>
    PRODUCERS.filter((p) => p.regionSlug === slug)

  const portfolioWineCountInRegion = (slug: string) =>
    WINES.filter((w) =>
      portfolioProducersInRegion(slug).some((p) => p.id === w.producerId)
    ).length

  const activeRegions = REGION_LIST.filter(
    (r) => portfolioProducersInRegion(r.slug).length > 0
  )
  const forthcomingRegions = REGION_LIST.filter(
    (r) => portfolioProducersInRegion(r.slug).length === 0
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="bg-olive-900 pt-16 pb-0 px-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='4' fill='%23fff'/%3E%3Crect width='4' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
              backgroundSize: '4px 4px',
            }}
          />

          <div className="relative max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <Link
              href="/products"
              className="text-parchment-400/40 text-xs uppercase tracking-widest hover:text-parchment-300/60 transition-colors inline-flex items-center gap-2 mb-10"
            >
              ← Terra Trionfo
            </Link>

            <div className="grid lg:grid-cols-2 gap-12 items-end pb-0">
              {/* Left: header copy */}
              <div className="pb-16">
                <p className="text-[9px] font-medium text-amber-400/60 uppercase tracking-[0.3em] mb-4">
                  Italian Provenance
                </p>
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-parchment-100 mb-5 leading-none">
                  Wine<br />Regions
                </h1>
                <p className="text-parchment-300/65 text-base leading-relaxed max-w-sm">
                  Italy&apos;s wine heritage is written in its landscape. Each region
                  carries a singular identity — shaped by altitude, soil, and the
                  varieties cultivated there for centuries.
                </p>
                <p className="text-parchment-400/45 text-sm leading-relaxed max-w-sm mt-3">
                  Terra Trionfo currently sources from four active regions across
                  northern and central Italy, with further estates under evaluation.
                  Select a region below to explore appellations, wine styles, and
                  portfolio selections.
                </p>
              </div>

              {/* Right: Italy map */}
              <div className="w-full max-w-[260px] mx-auto lg:ml-auto pt-6">
                <ItalyMap activeRegionSlugs={activeRegions.map((r) => r.slug)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Region cards ──────────────────────────────────────────────── */}
        <section className="bg-parchment-50 border-t border-parchment-200 py-20 px-6">
          <div className="max-w-5xl mx-auto">

            {/* Active portfolio regions */}
            <div className="mb-4">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-1">
                Active Portfolio
              </p>
              <h2 className="text-2xl font-serif font-bold text-olive-900 mb-8">
                Our Sourcing Regions
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {activeRegions.map((region) => {
                const wineCount = portfolioWineCountInRegion(region.slug)
                return (
                  <Link
                    key={region.slug}
                    href={`/regions/${region.slug}`}
                    className="group bg-white border border-parchment-300 hover:border-olive-500 p-8 flex flex-col transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <p className="text-[9px] font-medium text-amber-500/70 uppercase tracking-[0.3em]">
                        {region.subtitle}
                      </p>
                      <span className="text-[9px] font-medium text-olive-500 uppercase tracking-wider bg-olive-50 border border-olive-200 px-2 py-0.5 rounded-sm">
                        {wineCount} wine{wineCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-olive-900 mb-2 leading-tight group-hover:text-olive-700 transition-colors">
                      {region.name}
                    </h2>
                    <div className="h-px w-10 bg-olive-300 mb-4" />
                    <p className="text-sm text-olive-600 leading-relaxed flex-grow">
                      {region.heroLine}
                    </p>

                    {/* Regional grapes */}
                    <div className="flex flex-wrap gap-1.5 mt-5 mb-4">
                      {region.grapes.slice(0, 4).map((g) => (
                        <span key={g} className="text-[9px] border border-olive-200 text-olive-500 px-2 py-0.5 rounded-sm">
                          {g}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-parchment-200">
                      <span className="text-[10px] text-olive-500 uppercase tracking-wider">
                        {region.portfolioFocus.length} portfolio focus{region.portfolioFocus.length !== 1 ? 'es' : ''}
                      </span>
                      <span className="text-[10px] text-olive-600 group-hover:text-olive-900 transition-colors uppercase tracking-wider">
                        Explore →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Forthcoming regions */}
            {forthcomingRegions.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-grow bg-parchment-200" />
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-300">
                    On Our Radar
                  </p>
                  <div className="h-px flex-grow bg-parchment-200" />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {forthcomingRegions.map((region) => (
                    <Link
                      key={region.slug}
                      href={`/regions/${region.slug}`}
                      className="group border border-parchment-200 hover:border-parchment-300 bg-white/40 p-6 flex flex-col transition-all duration-200"
                    >
                      <p className="text-[9px] font-medium text-parchment-400/60 uppercase tracking-[0.3em] mb-3">
                        {region.subtitle}
                      </p>
                      <h2 className="text-lg font-serif font-semibold text-olive-500/80 mb-2 leading-tight group-hover:text-olive-700 transition-colors">
                        {region.name}
                      </h2>
                      <p className="text-xs text-olive-400/80 leading-relaxed flex-grow mb-4">
                        {region.heroLine}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {region.grapes.slice(0, 3).map((g) => (
                          <span key={g} className="text-[9px] border border-parchment-300 text-parchment-400 px-2 py-0.5 rounded-sm">
                            {g}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-parchment-200/60">
                        <span className="text-[9px] text-parchment-400 uppercase tracking-wider">
                          Estates under evaluation
                        </span>
                        <span className="text-[9px] text-parchment-400 group-hover:text-olive-600 transition-colors uppercase tracking-wider">
                          Learn more →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── About the atlas ───────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-white border-t border-parchment-200">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                The Importer&apos;s Lens
              </p>
              <h2 className="text-3xl font-serif font-bold text-olive-900 mb-5 leading-snug">
                Geography is Everything
              </h2>
              <p className="text-olive-600 leading-relaxed text-sm">
                Italy contains more native grape varieties than any country on earth. Its
                geography — from the Alpine north to the Mediterranean south — creates
                a mosaic of microclimates, each expressing wine in a distinct voice. The
                two active sourcing regions in the Terra Trionfo portfolio were
                selected because they represent a compelling range — from the
                structured nobility of Piedmont Nebbiolo to the alpine precision
                of Alto Adige whites and native varieties.
              </p>
              <p className="text-olive-500 leading-relaxed text-sm mt-4">
                Every estate in our portfolio was identified through direct producer
                relationships. We import only what we have tasted, evaluated, and
                believe represents genuine value and provenance.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                  Active Portfolio Regions
                </p>
                <p className="text-2xl font-serif font-bold text-olive-900">{activeRegions.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                  Country of Origin
                </p>
                <p className="text-base font-serif text-olive-700">Italy</p>
              </div>
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                  Distribution
                </p>
                <p className="text-sm text-olive-600 leading-relaxed">
                  Massachusetts — Boston, North Shore, Cape &amp; Islands, and Western Mass
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-12 px-6 bg-olive-900 border-t border-olive-800">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-parchment-100 font-serif text-lg">
              Ready to explore the wines?
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/products"
                className="border border-parchment-400/30 text-parchment-300/80 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-parchment-400/60 hover:text-parchment-100 transition-colors"
              >
                Browse All Wines
              </Link>
              <Link
                href="/partner/onboarding"
                className="border border-amber-400/30 text-amber-300/70 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-amber-400/60 hover:text-amber-200 transition-colors"
              >
                Producer Applications
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
