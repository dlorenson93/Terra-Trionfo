import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { REGIONS, REGION_LIST } from '@/lib/regions'
import { PRODUCERS } from '@/data/producers'
import { WINES } from '@/data/wines'
import WineCard from '@/components/wines/WineCard'
import RegionPortfolioStyles from '@/components/regions/RegionPortfolioStyles'
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

export default function RegionPage({ params }: Props) {
  const region = REGIONS[params.slug]
  if (!region) notFound()

  // Portfolio producers used only to resolve portfolio wines
  const portfolioProducers = PRODUCERS.filter((p) => p.regionSlug === params.slug)

  // Portfolio wines from those producers
  const portfolioWines = WINES.filter((w) =>
    portfolioProducers.some((p) => p.id === w.producerId)
  )

  // Other regions for cross-navigation
  const otherRegions = REGION_LIST.filter((r) => r.slug !== params.slug)

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

        {/* ── Terra Trionfo Portfolio — wine style education ───────────── */}
        <RegionPortfolioStyles regionSlug={params.slug} regionName={region.name} />

        {/* ── Representative Wines ────────────────────────────────────── */}
        <section className="py-16 px-6 bg-parchment-50 border-t border-parchment-200">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
              Representative Wines
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
              <h2 className="text-3xl font-serif font-bold text-olive-900">
                {region.name} Wines
              </h2>
              {portfolioWines.length > 0 && (
                <Link
                  href="/products"
                  className="text-[10px] uppercase tracking-[0.12em] text-olive-500 border border-olive-300 px-4 py-2 hover:border-olive-600 hover:text-olive-800 transition-colors flex-shrink-0"
                >
                  All Portfolio Wines →
                </Link>
              )}
            </div>
            <p className="text-sm text-olive-500 max-w-2xl leading-relaxed mb-8">
              These wines illustrate the style and character of the region. Producers are
              introduced publicly once they join the Terra Trionfo portfolio.
            </p>
            {portfolioWines.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {portfolioWines.map((wine) => {
                  const producer = portfolioProducers.find((p) => p.id === wine.producerId)
                  return <WineCard key={wine.id} wine={wine} producer={producer} />
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Explore Other Regions ───────────────────────────────────── */}
        <section className="py-16 px-6 bg-white border-t border-parchment-200">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
              Italian Wine Atlas
            </p>
            <h2 className="text-2xl font-serif font-bold text-olive-900 mb-8">
              Explore Other Regions
            </h2>
            <div className="grid sm:grid-cols-3 gap-5 mb-10">
              {otherRegions.map((r) => (
                <Link
                  key={r.slug}
                  href={`/regions/${r.slug}`}
                  className="group border border-parchment-300 hover:border-olive-400 bg-parchment-50 hover:bg-white transition-all duration-200 p-5 flex flex-col"
                >
                  <p className="text-[9px] font-medium text-amber-500/60 uppercase tracking-[0.3em] mb-2">
                    {r.subtitle}
                  </p>
                  <h3 className="font-serif font-semibold text-olive-900 text-base leading-snug mb-2 group-hover:text-olive-700 transition-colors">
                    {r.name}
                  </h3>
                  <p className="text-xs text-olive-500 leading-relaxed line-clamp-2 flex-grow">
                    {r.heroLine}
                  </p>
                  <p className="text-[10px] text-olive-400 group-hover:text-olive-600 mt-3 transition-colors uppercase tracking-wider">
                    Explore →
                  </p>
                </Link>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/products"
                className="border border-olive-300 text-olive-600 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-olive-500 hover:text-olive-800 transition-colors"
              >
                Browse Portfolio Wines
              </Link>
              <Link
                href="/regions"
                className="border border-parchment-300 text-olive-400 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-olive-300 hover:text-olive-600 transition-colors"
              >
                All Regions
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
