import Link from 'next/link'

export default function FeaturedProducts() {
  return (
    <section className="py-24 px-4 bg-white border-t border-olive-100">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-10">
          <p className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.14em] mb-4">
            The Marketplace
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-5 leading-snug">
            Our Curated Selection Is Being Prepared
          </h2>
          <p className="text-olive-600 leading-relaxed">
            Every estate, wine, and olive oil joining Terra Trionfo is personally reviewed before release.
            Our founding producers are currently being onboarded — their selections will be introduced shortly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/partner/onboarding"
            className="inline-block bg-olive-700 text-parchment-100 font-medium text-sm tracking-wide px-8 py-3.5 hover:bg-olive-800 transition-colors"
          >
            Partner With Us
          </Link>
          <Link
            href="/about"
            className="inline-block border border-olive-300 text-olive-700 font-medium text-sm tracking-wide px-8 py-3.5 hover:border-olive-500 hover:text-olive-900 transition-colors"
          >
            Our Story
          </Link>
        </div>
      </div>
    </section>
  )
}
