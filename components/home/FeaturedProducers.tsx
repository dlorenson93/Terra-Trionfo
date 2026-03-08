import Link from 'next/link'

export default function FeaturedProducers() {
  return (
    <section className="py-24 px-4 bg-parchment-200 border-t border-olive-100">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.35em] mb-4">
            Our Producers
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-5 leading-snug">
            The Families Behind the Bottle
          </h2>
          <p className="text-olive-600 leading-relaxed mb-8">
            Terra Trionfo cultivates relationships with artisan producers across Italy&apos;s most distinctive growing regions.
            Their stories and selections will be introduced here soon.
          </p>
          <Link
            href="/partner/onboarding"
            className="inline-block border border-olive-700 text-olive-800 text-xs font-medium tracking-[0.15em] uppercase px-7 py-3 hover:bg-olive-700 hover:text-parchment-100 transition-colors"
          >
            Become a Partner Producer
          </Link>
        </div>
      </div>
    </section>
  )
}
