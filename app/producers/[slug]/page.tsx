import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/products/ProductCard'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

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
  if (!rawCompany) return { title: 'Producer Not Found | Terra Trionfo' }
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

  if (!rawProducer) notFound()

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
