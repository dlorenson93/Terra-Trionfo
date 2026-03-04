import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/products/ProductCard'
import { notFound } from 'next/navigation'

interface Producer {
  id: string
  name: string
  slug?: string
  bio?: string
  region?: string
  country?: string
  website?: string
  heroImageUrl?: string
}

interface Product {
  id: string
  name: string
  imageUrl?: string
  category: string
  retailPriceCents: number
  commerceModel: 'MARKETPLACE' | 'WHOLESALE' | 'HYBRID'
  company: {
    id: string
    name: string
    slug?: string
  }
}

export default async function ProducerDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  // fetch company by slug
  const compRes = await fetch(
    `${process.env.NEXTAUTH_URL || ''}/api/companies?status=APPROVED`,
    { cache: 'no-store' }
  )
  const companies: Producer[] = await compRes.json()
  const producer = companies.find((c) => c.slug === slug)
  if (!producer) {
    notFound()
  }

  // fetch products for this producer
  const prodRes = await fetch(
    `${process.env.NEXTAUTH_URL || ''}/api/products?companyId=${producer?.id}`,
    { cache: 'no-store' }
  )
  const products: Product[] = await prodRes.json()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold text-olive-900">
              {producer?.name}
            </h1>
            {producer.region && (
              <p className="text-sm text-olive-600">
                {producer.region}, {producer.country}
              </p>
            )}
            {producer.website && (
              <p className="mt-2">
                <a
                  href={producer.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-olive-700 underline"
                >
                  Visit website
                </a>
              </p>
            )}
            {producer.bio && <p className="mt-6 text-olive-700">{producer.bio}</p>}
          </div>

          <h2 className="text-2xl font-serif font-bold text-olive-900 mb-4">
            Products by {producer?.name}
          </h2>
          {products.length === 0 ? (
            <p className="text-olive-600">No products available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  imageUrl={p.imageUrl}
                  category={p.category}
                  retailPrice={p.retailPriceCents / 100}
                  companyName={p.company.name}
                  commerceModel={p.commerceModel}
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
