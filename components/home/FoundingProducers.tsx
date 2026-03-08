import Link from 'next/link'

export default function FoundingProducers() {
  return (
    <section className="py-20 px-4 bg-olive-900">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Charter Members
        </div>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-parchment-100 mb-4">
          Founding Producers
        </h2>
        <p className="text-parchment-300 mb-8 max-w-xl mx-auto">
          Our founding producers are being carefully selected and onboarded. They&apos;ll be announced here soon.
        </p>
        <Link href="/partner/onboarding" className="inline-flex items-center gap-2 text-sm font-medium text-amber-300 hover:text-amber-200 underline underline-offset-4">
          Interested in becoming a founding producer? Apply here →
        </Link>
      </div>
    </section>
  )
}
