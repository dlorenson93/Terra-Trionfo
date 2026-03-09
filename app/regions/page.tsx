import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { REGION_LIST } from '@/lib/regions'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Italian Wine Regions | Terra Trionfo',
  description:
    'Explore Piedmont, Tuscany, Veneto, and Alto Adige — the Italian wine regions at the heart of the Terra Trionfo portfolio.',
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

export default async function RegionsIndexPage() {
  // Fetch LIVE producer counts keyed by region slug
  const producers = await prisma.company.findMany({
    where: { status: 'APPROVED', contentStatus: 'LIVE' },
    select: { region: true },
  })

  const producerCount = (slug: string): number => {
    const region = REGION_LIST.find((r) => r.slug === slug)
    if (!region) return 0
    return producers.filter(
      (p) =>
        p.region &&
        region.dbKeywords.some((kw) => p.region!.toLowerCase().includes(kw))
    ).length
  }

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
                  Terra Trionfo works directly with estates in four key regions.
                  Click any point on the map or select a region below to explore
                  producers, appellations, and wines.
                </p>
              </div>

              {/* Right: Italy map */}
              <div className="w-full max-w-[260px] mx-auto lg:ml-auto pt-6">
                <ItalyMap />
              </div>
            </div>
          </div>
        </div>

        {/* ── Region cards ──────────────────────────────────────────────── */}
        <section className="bg-parchment-50 border-t border-parchment-200 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-10">
              Select a Region
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {REGION_LIST.map((region) => {
                const count = producerCount(region.slug)
                return (
                  <Link
                    key={region.slug}
                    href={`/regions/${region.slug}`}
                    className="group bg-white border border-parchment-300 hover:border-olive-400 p-8 flex flex-col transition-all duration-200 hover:shadow-sm"
                  >
                    <p className="text-[9px] font-medium text-amber-500/60 uppercase tracking-[0.3em] mb-4">
                      {region.subtitle}
                    </p>
                    <h2 className="text-xl font-serif font-bold text-olive-900 mb-3 leading-tight group-hover:text-olive-700 transition-colors">
                      {region.name}
                    </h2>
                    <div className="h-px w-8 bg-olive-300 mb-4" />
                    <p className="text-xs text-olive-600 leading-relaxed flex-grow">
                      {region.heroLine}
                    </p>

                    {/* Grape tags */}
                    <div className="flex flex-wrap gap-1.5 mt-5 mb-4">
                      {region.grapes.slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="text-[9px] border border-olive-200 text-olive-500 px-2 py-0.5 rounded-sm"
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-parchment-200">
                      <span className="text-[10px] text-olive-400 uppercase tracking-wider">
                        {count > 0
                          ? `${count} producer${count !== 1 ? 's' : ''}`
                          : 'Producers forthcoming'}
                      </span>
                      <span className="text-[10px] text-olive-500 group-hover:text-olive-800 transition-colors uppercase tracking-wider">
                        Explore →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
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
                regions in the Terra Trionfo portfolio were selected because they
                represent the structural, aromatic, and cultural diversity of Italian
                wine at its most compelling.
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
                  Regions
                </p>
                <p className="text-2xl font-serif font-bold text-olive-900">{REGION_LIST.length}</p>
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
