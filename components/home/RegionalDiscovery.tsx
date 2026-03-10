import Link from 'next/link'
import SectionAtmosphere from '@/components/home/SectionAtmosphere'

const regions = [
  {
    name: 'Piemonte',
    slug: 'piedmont',
    detail: 'Piedmont — Il Piemonte',
    producers: 2,
    descriptor: 'Two estates across Barolo country and the Piemonte Alps — Nebbiolo in its most powerful DOCG form and its most alpine, high-altitude expression.',
  },
  {
    name: 'Lombardy',
    slug: 'lombardy',
    detail: 'Lombardy — La Lombardia',
    producers: 2,
    descriptor: 'Franciacorta’s certified organic traditional-method sparkling wines alongside Valtellina’s steep-terraced alpine Nebbiolo — two of Italy’s most distinct expressions in one region.',
  },
  {
    name: 'Trentino–Alto Adige',
    slug: 'alto-adige',
    detail: 'Alto Adige — Südtirol',
    producers: 1,
    descriptor: 'High-altitude Dolomite vineyards producing alpine whites and native reds with precision, freshness, and a mountain character found nowhere else in Italy.',
  },
  {
    name: 'Emilia-Romagna',
    slug: 'emilia-romagna',
    detail: 'Emilia-Romagna — Adriatic Coast',
    producers: 1,
    descriptor: 'Certified organic Adriatic coast estate producing native varietals — including the near-extinct Burson grape — with vegan certification and Italy’s most innovative small-format canned wine range.',
  },
]

export default function RegionalDiscovery() {
  return (
    <SectionAtmosphere
      imageSrc="/images/home/vineyard northern italy.png"
      overlayClassName="bg-olive-900/[0.82]"
      className="py-24 px-4 border-t border-olive-800"
    >
      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='4' fill='%23fff'/%3E%3Crect width='4' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
          backgroundSize: '4px 4px',
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-[10px] font-medium text-amber-400/60 uppercase tracking-[0.14em] mb-4">
            Italian Provenance
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-parchment-100 mb-5 leading-snug">
            Exploring Italy&apos;s Wine Regions
          </h2>
          <p className="text-parchment-300/65 leading-relaxed text-sm">
            Italy&apos;s wine heritage is defined by remarkable regional diversity. As Terra Trionfo develops
            its portfolio, we focus on producers rooted in regions known for distinctive traditions,
            terroir, and local varieties.
          </p>
        </div>

        {/* Region cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {regions.map((region) => (
            <Link
              key={region.name}
              href={`/regions/${region.slug}`}
              className="border border-parchment-300/10 bg-parchment-100/[0.03] p-9 flex flex-col hover:border-amber-400/20 hover:bg-parchment-100/[0.06] transition-colors duration-300 group"
            >
              <span className="text-[9px] font-medium text-amber-400/50 uppercase tracking-[0.3em] mb-5">
                {region.detail}
              </span>
              <h3 className="text-lg font-serif font-bold text-parchment-100 mb-4 leading-snug group-hover:text-amber-100/90 transition-colors">
                {region.name}
              </h3>
              <div className="h-px w-8 bg-amber-400/15 mb-5" />
              <p className="text-xs text-parchment-400/55 leading-loose flex-grow">
                {region.descriptor}
              </p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[9px] text-parchment-400/40 uppercase tracking-wider">
                  {region.producers} estate{region.producers !== 1 ? 's' : ''}
                </span>
                <span className="text-[10px] text-amber-400/30 group-hover:text-amber-400/60 transition-colors uppercase tracking-wider">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SectionAtmosphere>
  )
}
