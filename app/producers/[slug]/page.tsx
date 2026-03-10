import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/products/ProductCard'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PRODUCERS } from '@/data/producers'
import { WINES } from '@/data/wines'

interface ProducerFull {
  id: string
  name: string
  slug: string | null
  bio: string | null
  region: string | null
  country: string | null
  website: string | null
  heroImageUrl: string | null
  // New fields (available after migration + prisma generate)
  shortDescription?: string | null
  story?: string | null
  subregion?: string | null
  foundedYear?: number | null
  winemakerName?: string | null
  winemakerBio?: string | null
  sustainablePractices?: string | null
  isFoundingProducer?: boolean
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug
  const rawCompany = await prisma.company.findFirst({
    where: {
      status: 'APPROVED',
      contentStatus: 'LIVE',
      OR: [{ slug }, { id: slug }],
    },
  })
  if (!rawCompany) {
    const staticProducer = PRODUCERS.find((p) => p.slug === slug)
    if (!staticProducer) return { title: 'Producer Not Found | Terra Trionfo' }
    return {
      title: `${staticProducer.name} — ${staticProducer.region} | Terra Trionfo`,
      description: staticProducer.summary.slice(0, 160),
      openGraph: {
        title: staticProducer.name,
        description: staticProducer.summary.slice(0, 160),
      },
    }
  }
  const company = rawCompany as any
  const regionLine = [company.region, company.country].filter(Boolean).join(', ')
  const description: string =
    company.shortDescription ||
    company.description ||
    `Discover ${company.name}${regionLine ? `, ${regionLine}` : ''} — imported by Terra Trionfo.`
  return {
    title: `${company.name}${regionLine ? ` — ${regionLine}` : ''} | Terra Trionfo`,
    description,
    openGraph: {
      title: company.name,
      description,
      ...(company.heroImageUrl ? { images: [company.heroImageUrl] } : {}),
    },
  }
}

export default async function ProducerDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug

  // Look up company by slug first, then fall back to id
  const rawProducer = await prisma.company.findFirst({
    where: {
      status: 'APPROVED',
      contentStatus: 'LIVE',
      OR: [{ slug }, { id: slug }],
    },
  })

  if (!rawProducer) {
    // Fall back to static portfolio data
    const staticProducer = PRODUCERS.find((p) => p.slug === slug)
    if (!staticProducer) notFound()

    const winesForProducer = WINES.filter((w) => w.producerId === staticProducer.id)
    const collectionLabel =
      staticProducer.collection === 'classical'
        ? 'Classical Selection'
        : 'Alternative & Next Generation'

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          {/* Hero */}
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
                href="/producers"
                className="text-parchment-400/50 text-xs uppercase tracking-widest hover:text-parchment-300/70 transition-colors mb-8 inline-flex items-center gap-2"
              >
                ← Our Producers
              </Link>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className={`text-[9px] font-medium uppercase tracking-[0.3em] border px-2.5 py-1 ${
                    staticProducer.collection === 'classical'
                      ? 'text-amber-300/80 border-amber-400/40'
                      : 'text-olive-300/80 border-olive-400/40'
                  }`}
                >
                  {collectionLabel}
                </span>
                {staticProducer.familyOwned && (
                  <span className="text-[9px] font-medium text-parchment-400/50 uppercase tracking-[0.3em]">
                    Family-Owned
                  </span>
                )}
                {staticProducer.organicStatus === 'certified' && (
                  <span className="text-[9px] font-medium text-green-300/70 uppercase tracking-[0.3em]">
                    Certified Organic
                  </span>
                )}
              </div>

              <h1 className="text-5xl md:text-7xl font-serif font-bold text-parchment-100 mb-3 leading-none">
                {staticProducer.name}
              </h1>
              <p className="text-parchment-400/60 text-sm uppercase tracking-wider mb-6">
                {[staticProducer.subregion, staticProducer.region].filter(Boolean).join(' · ')}
              </p>
              <p className="text-parchment-200/80 text-base max-w-2xl leading-relaxed">
                {staticProducer.summary}
              </p>
            </div>
          </div>

          {/* Estate profile + keywords */}
          <section className="py-12 px-6 bg-parchment-50 border-t border-parchment-200">
            <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10">
              <div className="md:col-span-2">
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-4">
                  Estate Keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {staticProducer.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs border border-olive-200 text-olive-600 px-2.5 py-1"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-1">
                    Region
                  </p>
                  <p className="text-sm text-olive-800 font-medium">{staticProducer.region}</p>
                  {staticProducer.regionSlug && (
                    <Link
                      href={`/regions/${staticProducer.regionSlug}`}
                      className="text-[10px] text-olive-400 hover:text-olive-700 transition-colors uppercase tracking-wider mt-1 block"
                    >
                      Explore region →
                    </Link>
                  )}
                </div>
                {staticProducer.organicStatus !== 'conventional' && (
                  <div>
                    <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-1">
                      Viticulture
                    </p>
                    <p className="text-sm text-olive-700">
                      {staticProducer.organicStatus === 'certified'
                        ? 'Certified Organic'
                        : 'Organically Inspired'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Estate Overview — structured facts */}
          {(staticProducer.founded || staticProducer.farmingMethod || staticProducer.elevation || staticProducer.estateNotes) && (
            <section className="py-12 px-6 bg-white border-t border-parchment-200">
              <div className="max-w-5xl mx-auto">
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-6">
                  Estate Overview
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {staticProducer.founded && (
                    <div>
                      <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-olive-400 mb-1">
                        Founded
                      </p>
                      <p className="text-sm text-olive-800 font-medium">{staticProducer.founded}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-olive-400 mb-1">
                      Location
                    </p>
                    <p className="text-sm text-olive-800 font-medium">
                      {[staticProducer.subregion, staticProducer.region].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  {staticProducer.farmingMethod && (
                    <div>
                      <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-olive-400 mb-1">
                        Farming
                      </p>
                      <p className="text-sm text-olive-800">{staticProducer.farmingMethod}</p>
                    </div>
                  )}
                  {staticProducer.elevation && (
                    <div>
                      <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-olive-400 mb-1">
                        Elevation
                      </p>
                      <p className="text-sm text-olive-800">{staticProducer.elevation}</p>
                    </div>
                  )}
                </div>
                {staticProducer.estateNotes && (
                  <p className="text-sm text-olive-700 leading-relaxed max-w-2xl">
                    {staticProducer.estateNotes}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Terra Trionfo Portfolio Note */}
          {(staticProducer.portfolioNote || staticProducer.portfolioRole || staticProducer.distinctive) && (
            <section className="py-12 px-6 bg-olive-900 border-t border-olive-800">
              <div className="max-w-5xl mx-auto">
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-parchment-400/60 mb-6">
                  Terra Trionfo Portfolio Note
                </p>
                {staticProducer.portfolioNote && (
                  <p className="text-parchment-200/90 text-base leading-relaxed max-w-2xl mb-8">
                    {staticProducer.portfolioNote}
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-8">
                  {staticProducer.portfolioRole && (
                    <div>
                      <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-parchment-400/50 mb-2">
                        Role in Portfolio
                      </p>
                      <p className="text-sm text-parchment-300/80">{staticProducer.portfolioRole}</p>
                    </div>
                  )}
                  {staticProducer.distinctive && (
                    <div>
                      <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-parchment-400/50 mb-2">
                        Distinctive for U.S. Market
                      </p>
                      <p className="text-sm text-parchment-300/80">{staticProducer.distinctive}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Wines */}
          {winesForProducer.length > 0 && (
            <section className="py-16 px-6 bg-white border-t border-parchment-200">
              <div className="max-w-5xl mx-auto">
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                  The Portfolio
                </p>
                <h2 className="text-3xl font-serif font-bold text-olive-900 mb-10">
                  Wines from {staticProducer.name}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {winesForProducer.map((wine) => (
                    <Link
                      key={wine.id}
                      href={`/wines/${wine.slug}`}
                      className="group border border-parchment-300 hover:border-olive-400 bg-parchment-50 hover:bg-white transition-all p-6 flex flex-col"
                    >
                      <span className="text-[9px] font-medium text-olive-400 uppercase tracking-wider mb-3">
                        {wine.type}
                      </span>
                      <h3 className="font-serif font-bold text-olive-900 group-hover:text-olive-700 transition-colors text-lg leading-snug mb-1">
                        {wine.displayName}
                      </h3>
                      {wine.appellation && (
                        <p className="text-xs text-olive-500 mb-3">{wine.appellation}</p>
                      )}
                      <p className="text-sm text-olive-600 leading-relaxed line-clamp-3 flex-grow">
                        {wine.description}
                      </p>
                      {wine.criticScore && (
                        <p className="text-xs text-amber-600/70 mt-3">{wine.criticScore}</p>
                      )}
                      <p className="text-[10px] text-olive-400 group-hover:text-olive-600 mt-4 transition-colors uppercase tracking-wider">
                        View wine →
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
        <Footer />
      </div>
    )
  }

  // Cast to access new fields (available after migration + prisma generate)
  const producer = rawProducer as unknown as ProducerFull

  // Fetch this producer's approved products
  const rawProducts = await prisma.product.findMany({
    where: { companyId: rawProducer.id, status: 'APPROVED', contentStatus: 'LIVE' },
    include: {
      company: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  const products = rawProducts as any[]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-olive-800 to-olive-900 py-16 px-4">
          {producer.heroImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${producer.heroImageUrl})` }}
            />
          )}
          <div className="relative max-w-5xl mx-auto">
            {producer.isFoundingProducer && (
              <span className="inline-block bg-amber-400 text-olive-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
                Founding Producer
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-parchment-100 mb-2">
              {producer.name}
            </h1>
            {(producer.region || producer.country) && (
              <p className="text-parchment-300 text-sm uppercase tracking-wider mb-4">
                {[producer.subregion, producer.region, producer.country].filter(Boolean).join(', ')}
                {producer.foundedYear ? ` · Est. ${producer.foundedYear}` : ''}
              </p>
            )}
            {producer.shortDescription && (
              <p className="text-parchment-200 text-lg max-w-2xl leading-relaxed">
                {producer.shortDescription}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Story + winemaker */}
          {(producer.story || producer.winemakerName) && (
            <div className="mb-12 grid md:grid-cols-3 gap-8">
              {producer.story && (
                <div className="md:col-span-2">
                  <h2 className="text-xl font-serif font-bold text-olive-900 mb-3">Our Story</h2>
                  <p className="text-olive-700 leading-relaxed">{producer.story}</p>
                </div>
              )}
              {producer.winemakerName && (
                <div>
                  <h3 className="text-xs text-olive-500 uppercase tracking-wider mb-2">Winemaker / Producer</h3>
                  <p className="text-olive-900 font-semibold text-lg">{producer.winemakerName}</p>
                  {producer.winemakerBio && (
                    <p className="text-sm text-olive-700 mt-2 leading-relaxed">{producer.winemakerBio}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sustainable practices */}
          {producer.sustainablePractices && (
            <div className="mb-12 bg-olive-50 rounded-xl p-6 border border-olive-200">
              <h3 className="text-sm text-olive-500 uppercase tracking-wider mb-2">Sustainable Practices</h3>
              <p className="text-olive-800 leading-relaxed">{producer.sustainablePractices}</p>
            </div>
          )}

          {/* Website */}
          {producer.website && (
            <div className="mb-10">
              <a href={producer.website} target="_blank" rel="noreferrer" className="text-olive-700 underline underline-offset-4">
                Visit {producer.name} website →
              </a>
            </div>
          )}

          {/* Products */}
          <h2 className="text-2xl font-serif font-bold text-olive-900 mb-6">
            Products by {producer.name}
          </h2>
          {products.length === 0 ? (
            <p className="text-olive-600">No products available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  imageUrl={p.imageUrl ?? undefined}
                  category={p.category}
                  retailPrice={p.retailPriceCents / 100}
                  companyName={p.company.name}
                  commerceModel={p.commerceModel as 'MARKETPLACE' | 'WHOLESALE' | 'HYBRID'}
                  vintage={(p as any).vintage}
                  appellation={(p as any).appellation}
                  grapeVarietals={(p as any).grapeVarietals}
                  tastingNotesShort={(p as any).tastingNotesShort}
                  isLimitedAllocation={(p as any).isLimitedAllocation}
                  isFeatured={(p as any).isFeatured}
                  isFoundingWine={(p as any).isFoundingWine}
                  badgeText={(p as any).badgeText}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
