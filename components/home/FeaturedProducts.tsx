import Link from 'next/link'
import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'
import WineCard from '@/components/wines/WineCard'
import SectionAtmosphere from '@/components/home/SectionAtmosphere'

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
    <SectionAtmosphere
      imageSrc="/images/home/Texture Limestone.png"
      overlayClassName="bg-white/[0.93]"
      className="py-24 px-4 border-t border-olive-100"
    >
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {featuredWines.map((wine) => {
            const producer = PRODUCERS.find((p) => p.id === wine.producerId)
            return <WineCard key={wine.id} wine={wine} producer={producer} />
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
    </SectionAtmosphere>
  )
}
