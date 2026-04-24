import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { WINES, getWine } from '@/data/wines'
import { PRODUCERS, getProducer } from '@/data/producers'
import WineCard from '@/components/wines/WineCard'
import AddToCartButton from '@/components/wines/AddToCartButton'
import type { Wine } from '@/types/wine'
import type { Producer } from '@/types/producer'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return WINES.map((w) => ({ slug: w.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const wine = getWine(params.slug)
  if (!wine) return { title: 'Wine Not Found | Terra Trionfo' }
  const producer = getProducer(wine.producerId)
  return {
    title: `${wine.displayName} | Terra Trionfo`,
    description: wine.description,
    openGraph: {
      title: wine.displayName,
      description: wine.description,
      ...(producer
        ? { siteName: `Terra Trionfo — ${producer.region}` }
        : {}),
    },
  }
}

function wineTypeBadgeClass(type: string): string {
  switch (type) {
    case 'Red':
      return 'bg-red-900/15 text-red-800 border-red-200'
    case 'White':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'Sparkling':
      return 'bg-parchment-100 text-olive-700 border-parchment-300'
    case 'Sparkling Rosé':
    case 'Rosé':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-parchment-100 text-olive-700 border-parchment-300'
  }
}

/** True when both wines share the same normalised region (handles Piemonte vs Piemonte Alps). */
function sameRegion(w1: Wine, w2: Wine, producers: Producer[]): boolean {
  const p1 = producers.find((p) => p.id === w1.producerId)
  const p2 = producers.find((p) => p.id === w2.producerId)
  if (!p1 || !p2) return false
  // Prefer regionSlug comparison — normalises "Piemonte" and "Piemonte Alps" to same bucket
  if (p1.regionSlug && p2.regionSlug) return p1.regionSlug === p2.regionSlug
  return p1.region === p2.region
}

export default function WineDetailPage({ params }: Props) {
  const wine = getWine(params.slug)
  if (!wine) notFound()

  const producer = getProducer(wine.producerId)
  if (!producer) notFound()

  const estateWines = WINES.filter(
    (w) => w.producerId === wine.producerId && w.id !== wine.id,
  ).slice(0, 6)

  const regionWines = WINES.filter(
    (w) => w.producerId !== wine.producerId && sameRegion(wine, w, PRODUCERS),
  ).slice(0, 6)

  const collectionLabel =
    producer.collection === 'classical' ? 'Classical Selection' : 'Alternative & Next Generation'

  const regionDisplayName =
    producer.regionSlug === 'piedmont' ? 'Piedmont' :
    producer.regionSlug === 'alto-adige' ? 'Alto Adige' :
    producer.region

  return (
    <div className="min-h-screen flex flex-col">
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
              href={`/producers/${producer.slug}`}
              className="text-parchment-400/50 text-xs uppercase tracking-widest hover:text-parchment-300/70 transition-colors mb-8 inline-flex items-center gap-2"
            >
              ← {producer.name}
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span
                className={`text-[9px] font-medium uppercase tracking-[0.3em] border px-2.5 py-1 ${wineTypeBadgeClass(wine.type)}`}
              >
                {wine.type}
              </span>
              {wine.appellation && (
                <span className="text-[9px] font-medium text-amber-400/60 uppercase tracking-[0.3em]">
                  {wine.appellation}
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-serif font-bold text-parchment-100 mb-4 leading-tight">
              {wine.displayName}
            </h1>

            <p className="text-parchment-400/60 text-sm uppercase tracking-wider mb-5">
              {[producer.subregion, producer.region].filter(Boolean).join(' · ')}
            </p>

            {wine.criticScore && (
              <p className="text-amber-300/90 text-sm font-medium tracking-wide">
                {wine.criticScore}
              </p>
            )}
          </div>
        </div>

        {/* ── Wine detail ────────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-parchment-50 border-t border-parchment-200">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
            {/* Description */}
            <div className="md:col-span-2">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-4">
                About this Wine
              </p>
              <p className="text-olive-700 leading-relaxed text-base">{wine.description}</p>

              {wine.criticScore && (
                <div className="mt-8 border-l-2 border-amber-400/40 pl-5">
                  <p className="text-[9px] font-medium text-amber-500/60 uppercase tracking-[0.3em] mb-1">
                    Critic Recognition
                  </p>
                  <p className="text-olive-800 font-serif text-lg">{wine.criticScore}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Tags */}
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                  Profile
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {wine.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs border border-olive-200 text-olive-600 px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Producer */}
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                  Producer
                </p>
                <Link href={`/producers/${producer.slug}`} className="group">
                  <p className="font-serif font-bold text-olive-900 group-hover:text-olive-700 transition-colors">
                    {producer.name}
                  </p>
                  <p className="text-xs text-olive-500 mt-0.5">{producer.subregion}</p>
                  <p className="text-[10px] text-olive-400 group-hover:text-olive-600 mt-2 transition-colors uppercase tracking-wider">
                    View estate →
                  </p>
                </Link>
              </div>

              {/* Collection */}
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                  Collection
                </p>
                <span
                  className={`text-xs px-2.5 py-1 ${
                    producer.collection === 'classical'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-olive-50 text-olive-700 border border-olive-200'
                  }`}
                >
                  {collectionLabel}
                </span>
              </div>

              {/* Region link */}
              {producer.regionSlug && (
                <div>
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                    Region
                  </p>
                  <Link
                    href={`/regions/${producer.regionSlug}`}
                    className="text-xs text-olive-600 hover:text-olive-900 transition-colors uppercase tracking-wider"
                  >
                    Explore {regionDisplayName} →
                  </Link>
                </div>
              )}

              {/* Import status */}
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                  Status
                </p>
                <p className="text-xs text-olive-500 capitalize">{wine.importStatus}</p>
              </div>

              {/* Add to Inquiry */}
              <AddToCartButton wine={wine} producerName={producer.name} />
            </div>
          </div>
        </section>

        {/* ── More from this estate ──────────────────────────────────── */}
        {estateWines.length > 0 && (
          <section className="py-14 px-6 bg-parchment-100 border-t border-parchment-200">
            <div className="max-w-5xl mx-auto">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                The Estate
              </p>
              <h2 className="text-2xl font-serif font-bold text-olive-900 mb-8">
                More from {producer.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {estateWines.map((w) => (
                  <WineCard key={w.id} wine={w} producer={producer} />
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href={`/producers/${producer.slug}`}
                  className="text-xs text-olive-500 hover:text-olive-900 transition-colors uppercase tracking-wider"
                >
                  View all wines from {producer.name} →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── More from this region ──────────────────────────────────── */}
        {regionWines.length > 0 && (
          <section className="py-14 px-6 bg-white border-t border-parchment-200">
            <div className="max-w-5xl mx-auto">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
                Regional Discovery
              </p>
              <h2 className="text-2xl font-serif font-bold text-olive-900 mb-8">
                More from {regionDisplayName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {regionWines.map((w) => {
                  const rProducer = getProducer(w.producerId)
                  return <WineCard key={w.id} wine={w} producer={rProducer} />
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
