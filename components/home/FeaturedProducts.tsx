import Link from 'next/link'
import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'

// Six representative portfolio wines for the homepage
const FEATURED_IDS = [
  'stroppiana-barolo-bussia',
  'stroppiana-barolo-leonardo',
  'lantieri-franciacorta-saten',
  'zanotelli-kerner',
  'luca-faccinelli-valtellina-superiore',
  'l-autin-timorasso',
]

export default function FeaturedProducts() {
  const featuredWines = FEATURED_IDS.map((id) => WINES.find((w) => w.id === id)).filter(Boolean) as typeof WINES

  return (
    <section className="py-24 px-4 bg-white border-t border-olive-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.14em] mb-4">
              Incoming Portfolio
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-3 leading-snug">
              Wines Under Evaluation
            </h2>
            <p className="text-olive-600 leading-relaxed max-w-md text-sm">
              Six Italian estates currently being tasted for U.S. import — from Barolo and
              Franciacorta to alpine Nebbiolo and organic Emilia-Romagna.
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-medium text-olive-600 border border-olive-300 px-5 py-2.5 hover:border-olive-600 hover:text-olive-900 transition-colors uppercase tracking-wider flex-shrink-0"
          >
            Browse All Wines →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {featuredWines.map((wine) => {
            const producer = PRODUCERS.find((p) => p.id === wine.producerId)
            return (
              <Link
                key={wine.id}
                href={`/wines/${wine.slug}`}
                className="group border border-parchment-300 hover:border-olive-400 bg-parchment-50 hover:bg-white transition-all p-5 flex flex-col"
              >
                <span className="text-[9px] font-medium text-olive-400 uppercase tracking-wider mb-2">
                  {wine.type}
                </span>
                <h3 className="font-serif font-bold text-olive-900 group-hover:text-olive-700 transition-colors text-sm leading-snug mb-1">
                  {wine.displayName}
                </h3>
                {wine.appellation && (
                  <p className="text-[10px] text-olive-500 mb-1">{wine.appellation}</p>
                )}
                {producer && (
                  <p className="text-[10px] text-olive-400 mb-2 uppercase tracking-wider">
                    {producer.region}
                  </p>
                )}
                <p className="text-xs text-olive-600 leading-relaxed line-clamp-2 flex-grow">
                  {wine.description}
                </p>
                {wine.criticScore && (
                  <p className="text-[10px] text-amber-600/70 mt-2 font-medium">{wine.criticScore}</p>
                )}
              </Link>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/products"
            className="inline-block bg-olive-700 text-parchment-100 font-medium text-sm tracking-wide px-8 py-3.5 hover:bg-olive-800 transition-colors"
          >
            View All Wines
          </Link>
          <Link
            href="/producers"
            className="inline-block border border-olive-300 text-olive-700 font-medium text-sm tracking-wide px-8 py-3.5 hover:border-olive-500 hover:text-olive-900 transition-colors"
          >
            Explore Producers
          </Link>
        </div>
      </div>
    </section>
  )
}
