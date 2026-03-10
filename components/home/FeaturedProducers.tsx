import Link from 'next/link'
import { PRODUCERS } from '@/data/producers'
import SectionAtmosphere from '@/components/home/SectionAtmosphere'

export default function FeaturedProducers() {
  return (
    <SectionAtmosphere
      imageSrc="/images/home/Grape ready for harvest.png"
      overlayClassName="bg-olive-900/[0.70]"
      className="py-24 px-4 border-t border-olive-800"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-medium text-amber-400/60 uppercase tracking-[0.14em] mb-4">
              Our Producers
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-parchment-100 mb-3 leading-snug">
              The Families Behind the Bottle
            </h2>
            <p className="text-parchment-300/65 leading-relaxed max-w-md text-sm">
              Six family-owned estates across Italy — selected for provenance, quality, and
              strong fit with the American on-trade market.
            </p>
          </div>
          <Link
            href="/producers"
            className="text-xs font-medium text-parchment-200/70 border border-parchment-100/20 px-5 py-2.5 hover:border-amber-400/40 hover:text-parchment-100 transition-colors uppercase tracking-wider flex-shrink-0"
          >
            All Producers →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {PRODUCERS.map((p) => (
            <Link
              key={p.id}
              href={`/producers/${p.slug}`}
              className="group border border-parchment-100/15 hover:border-amber-400/30 bg-parchment-100/[0.06] hover:bg-parchment-100/[0.11] transition-all p-5 flex flex-col"
            >
              <span
                className={`text-[9px] font-medium uppercase tracking-wider mb-2 ${
                  p.collection === 'classical' ? 'text-amber-400/60' : 'text-parchment-400/50'
                }`}
              >
                {p.collection === 'classical' ? 'Classical' : 'Alt / Next Gen'}
              </span>
              <h3 className="font-serif font-bold text-parchment-100 group-hover:text-amber-100/90 transition-colors text-base leading-snug mb-1">
                {p.name}
              </h3>
              <p className="text-[10px] text-parchment-300/55 mb-2">{p.subregion}</p>
              <p className="text-[10px] text-parchment-400/40 uppercase tracking-wider mb-3">{p.region}</p>
              <p className="text-xs text-parchment-300/55 leading-relaxed line-clamp-2 flex-grow">
                {p.keywords.slice(0, 3).join(' · ')}
              </p>
              <p className="text-[10px] text-amber-400/40 group-hover:text-amber-400/70 mt-3 transition-colors uppercase tracking-wider">
                View estate →
              </p>
            </Link>
          ))}
        </div>

        <Link
          href="/producers"
          className="inline-block border border-parchment-100/20 text-parchment-200/70 text-xs font-medium tracking-[0.15em] uppercase px-7 py-3 hover:border-amber-400/40 hover:text-parchment-100 transition-colors"
        >
          Explore All Producers →
        </Link>
      </div>
    </SectionAtmosphere>
  )
}
