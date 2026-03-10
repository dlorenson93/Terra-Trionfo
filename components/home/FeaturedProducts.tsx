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
      overlayClassName="bg-olive-900/[0.72]"
      className="py-24 px-4 border-t border-olive-800"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-medium text-amber-400/60 uppercase tracking-[0.14em] mb-4">
              Incoming Portfolio
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-parchment-100 mb-3 leading-snug">
              Wines Under Evaluation
            </h2>
            <p className="text-parchment-300/65 leading-relaxed max-w-md text-sm">
              Six Italian estates currently being tasted for U.S. import — from Barolo and
              Franciacorta to alpine Nebbiolo and organic Emilia-Romagna.
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-medium text-parchment-200/70 border border-parchment-100/20 px-5 py-2.5 hover:border-amber-400/40 hover:text-parchment-100 transition-colors uppercase tracking-wider flex-shrink-0"
          >
            Browse All Wines →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {featuredWines.map((wine) => {
            const producer = PRODUCERS.find((p) => p.id === wine.producerId)
            return <WineCard key={wine.id} wine={wine} producer={producer} dark />
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/products"
            className="inline-block bg-parchment-100/10 border border-parchment-100/20 text-parchment-100 font-medium text-sm tracking-wide px-8 py-3.5 hover:bg-parchment-100/20 transition-colors"
          >
            View All Wines
          </Link>
          <Link
            href="/producers"
            className="inline-block border border-parchment-100/20 text-parchment-200/70 font-medium text-sm tracking-wide px-8 py-3.5 hover:border-amber-400/40 hover:text-parchment-100 transition-colors"
          >
            Explore Producers
          </Link>
        </div>
      </div>
    </SectionAtmosphere>
  )
}
