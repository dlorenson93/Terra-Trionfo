import Link from 'next/link'
import { PRODUCERS } from '@/data/producers'

export default function FeaturedProducers() {
  return (
    <section className="py-24 px-4 bg-parchment-200 border-t border-olive-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.14em] mb-4">
              Our Producers
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-3 leading-snug">
              The Families Behind the Bottle
            </h2>
            <p className="text-olive-600 leading-relaxed max-w-md text-sm">
              Six family-owned estates across Italy — selected for provenance, quality, and
              strong fit with the American on-trade market.
            </p>
          </div>
          <Link
            href="/producers"
            className="text-xs font-medium text-olive-600 border border-olive-300 px-5 py-2.5 hover:border-olive-600 hover:text-olive-900 transition-colors uppercase tracking-wider flex-shrink-0"
          >
            All Producers →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {PRODUCERS.map((p) => (
            <Link
              key={p.id}
              href={`/producers/${p.slug}`}
              className="group border border-olive-200 hover:border-olive-400 bg-white hover:bg-parchment-50 transition-all p-5 flex flex-col"
            >
              <span
                className={`text-[9px] font-medium uppercase tracking-wider mb-2 ${
                  p.collection === 'classical' ? 'text-amber-600/60' : 'text-olive-500/60'
                }`}
              >
                {p.collection === 'classical' ? 'Classical' : 'Alt / Next Gen'}
              </span>
              <h3 className="font-serif font-bold text-olive-900 group-hover:text-olive-700 transition-colors text-base leading-snug mb-1">
                {p.name}
              </h3>
              <p className="text-[10px] text-olive-500 mb-2">{p.subregion}</p>
              <p className="text-[10px] text-olive-400 uppercase tracking-wider mb-3">{p.region}</p>
              <p className="text-xs text-olive-600 leading-relaxed line-clamp-2 flex-grow">
                {p.keywords.slice(0, 3).join(' · ')}
              </p>
              <p className="text-[10px] text-olive-400 group-hover:text-olive-700 mt-3 transition-colors uppercase tracking-wider">
                View estate →
              </p>
            </Link>
          ))}
        </div>

        <Link
          href="/producers"
          className="inline-block border border-olive-700 text-olive-800 text-xs font-medium tracking-[0.15em] uppercase px-7 py-3 hover:bg-olive-700 hover:text-parchment-100 transition-colors"
        >
          Explore All Producers →
        </Link>
      </div>
    </section>
  )
}
