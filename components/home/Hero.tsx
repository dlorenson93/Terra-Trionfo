import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-parchment-100 via-parchment-200 to-parchment-300 py-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-olive-900 mb-4">
          Terra Trionfo Marketplace
        </h1>
        <p className="text-2xl md:text-3xl font-serif italic text-olive-700 mb-6">
          Authentic farm-to-table products from artisan producers
        </p>
        <p className="text-lg text-olive-800 leading-relaxed mb-8 max-w-2xl mx-auto">
          Browse handcrafted goods, support small producers, and discover regional
          specialties in our curated marketplace.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products" className="btn-primary text-lg">
            Browse Products
          </Link>
          <Link href="/producers" className="btn-outline text-lg">
            Explore Producers
          </Link>
        </div>
      </div>
    </section>
  )
}
