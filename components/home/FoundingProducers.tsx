import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function FoundingProducers() {
  // Fetch all approved founding producers, show LIVE ones as real cards
  const rawProducers = await prisma.company.findMany({
    where: { isFoundingProducer: true, status: 'APPROVED' },
    orderBy: { name: 'asc' },
  })
  const producers = rawProducers as any[]

  // Separate live vs. pending
  const live = producers.filter((p) => p.contentStatus === 'LIVE')
  const pending = producers.filter((p) => p.contentStatus !== 'LIVE')

  // Build display slots: real cards first, then placeholder cards up to 3 total shown
  const SLOT_COUNT = Math.max(3, live.length + Math.min(pending.length, 3 - live.length))
  const pendingSlots = Array.from(
    { length: Math.max(0, SLOT_COUNT - live.length) },
    (_, i) => pending[i]
  )

  const placeholderLabels = ['Portfolio Evaluation Underway', 'Estate Selection in Progress', 'Curation in Progress']

  return (
    <section className="py-24 px-4 bg-olive-900 relative overflow-hidden">
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='4' fill='%23fff'/%3E%3Crect width='4' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
          backgroundSize: '4px 4px',
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Label */}
        <p className="text-[10px] font-medium text-amber-400/60 uppercase tracking-[0.14em] mb-6 text-center">
          Founding Circle
        </p>

        <h2 className="text-3xl md:text-4xl font-serif font-bold text-parchment-100 text-center mb-4">
          Founding Producers
        </h2>

        <p className="text-parchment-300/65 text-center max-w-xl mx-auto mb-14 leading-relaxed text-sm">
          {live.length > 0
            ? 'The first estates in the Terra Trionfo founding circle — carefully selected, individually introduced.'
            : 'The first producers aligned with Terra Trionfo are being thoughtfully evaluated and prepared for introduction. Their estates and selections will be presented here as the founding portfolio takes shape.'}
        </p>

        {/* Estate cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(SLOT_COUNT, 3)} gap-6 mb-14`}>
          {/* Live producers — real cards */}
          {live.map((producer) => (
            <Link
              key={producer.id}
              href={`/producers/${producer.slug || producer.id}`}
              className="group border border-amber-400/25 bg-parchment-100/[0.05] p-8 flex flex-col hover:border-amber-400/45 hover:bg-parchment-100/[0.09] transition-colors duration-300"
            >
              <div className="w-10 h-10 border border-amber-400/30 flex items-center justify-center mb-5 group-hover:border-amber-400/50 transition-colors">
                <svg className="w-4 h-4 text-amber-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <span className="text-[9px] font-medium text-amber-400/60 uppercase tracking-[0.3em] mb-2">
                Founding Producer
              </span>
              <h3 className="text-base font-serif font-bold text-parchment-100 mb-1 group-hover:text-amber-100/90 transition-colors">
                {producer.name}
              </h3>
              {(producer.region || producer.country) && (
                <p className="text-[11px] text-parchment-400/50 uppercase tracking-wide mb-3">
                  {[producer.region, producer.country].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="h-px w-10 bg-amber-400/15 mb-3" />
              {producer.shortDescription && (
                <p className="text-[11px] text-parchment-300/50 leading-relaxed line-clamp-3 flex-grow">
                  {producer.shortDescription}
                </p>
              )}
              <p className="mt-4 text-[10px] text-amber-400/35 group-hover:text-amber-400/65 transition-colors uppercase tracking-wider">
                View Estate →
              </p>
            </Link>
          ))}

          {/* Pending producers — placeholder cards */}
          {pendingSlots.map((producer, i) => (
            <div
              key={producer ? producer.id : `placeholder-${i}`}
              className="border border-parchment-300/15 bg-parchment-100/[0.04] p-8 flex flex-col items-center text-center hover:border-amber-400/20 hover:bg-parchment-100/[0.07] transition-colors duration-300"
            >
              <div className="w-10 h-10 border border-amber-400/25 flex items-center justify-center mb-5">
                <svg className="w-4 h-4 text-amber-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <span className="text-[9px] font-medium text-amber-400/50 uppercase tracking-[0.3em] mb-2">
                Founding Producer
              </span>
              <p className="text-[11px] text-parchment-300/40 tracking-wide uppercase mb-3">
                {placeholderLabels[i % placeholderLabels.length]}
              </p>
              <div className="h-px w-10 bg-amber-400/10 mb-3" />
              <p className="text-[11px] text-parchment-400/35 italic">Introduction Forthcoming</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/partner/onboarding"
            className="inline-block border border-amber-400/30 text-amber-300/80 text-xs font-medium tracking-[0.2em] uppercase px-7 py-3 hover:border-amber-400/60 hover:text-amber-300 transition-colors"
          >
            Interested in becoming a founding producer? Apply here →
          </Link>
        </div>
      </div>
    </section>
  )
}
