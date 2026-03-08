import Link from 'next/link'

export default function FeaturedProducers() {
  return (
    <section className="py-20 px-4 bg-parchment-100">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm font-medium text-olive-600 uppercase tracking-widest mb-3">Our Producers</p>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-4">
          The Families Behind the Bottle
        </h2>
        <p className="text-olive-600 mb-8">
          We are carefully selecting artisan producers from Italy&apos;s finest growing regions. Producer profiles will be announced here soon.
        </p>
        <Link href="/partner/onboarding" className="btn btn-primary">
          Become a Partner Producer
        </Link>
      </div>
    </section>
  )
}
