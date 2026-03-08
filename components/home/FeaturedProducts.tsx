import Link from 'next/link'

export default function FeaturedProducts() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-parchment-100">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-serif font-bold text-olive-900 mb-4">
          Our Curated Selection Is Being Prepared
        </h2>
        <p className="text-olive-600 text-lg mb-4 leading-relaxed">
          We&apos;re personally vetting every producer and wine before it joins the Terra Trionfo marketplace.
          Our founding producers are being onboarded — their selections will be announced shortly.
        </p>
        <p className="text-sm text-olive-500 mb-10">
          Are you an artisan producer? We&apos;d love to hear from you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/partner/onboarding" className="btn btn-primary">
            Partner With Us
          </Link>
          <Link href="/about" className="btn btn-secondary">
            Our Story
          </Link>
        </div>
      </div>
    </section>
  )
}
