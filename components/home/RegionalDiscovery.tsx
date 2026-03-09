import Link from 'next/link'

const regions = [
  {
    name: 'Piedmont',
    slug: 'piedmont',
    descriptor: 'Home of Barolo, Barbaresco, and alpine Nebbiolo vineyards.',
    detail: 'Piedmont — Il Piemonte',
  },
  {
    name: 'Tuscany',
    slug: 'tuscany',
    descriptor: 'Sangiovese country: Chianti, Brunello, Bolgheri, and hillside estates shaped by centuries of winemaking.',
    detail: 'Tuscany — La Toscana',
  },
  {
    name: 'Veneto',
    slug: 'veneto',
    descriptor: 'A region of remarkable diversity, from Amarone and Valpolicella to the volcanic soils behind Soave.',
    detail: 'Veneto — Il Veneto',
  },
  {
    name: 'Alto Adige',
    slug: 'alto-adige',
    descriptor: 'Alpine vineyards producing refined whites and elegant cool-climate reds at the crossroads of Italian and Tyrolean culture.',
    detail: 'Alto Adige — Südtirol',
  },
]

export default function RegionalDiscovery() {
  return (
    <section className="py-24 px-4 bg-olive-900 border-t border-olive-800 relative overflow-hidden">
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
              className="block border border-parchment-300/10 bg-parchment-100/[0.03] p-9 flex flex-col hover:border-amber-400/20 hover:bg-parchment-100/[0.06] transition-colors duration-300 group"
            >
              <span className="text-[9px] font-medium text-amber-400/50 uppercase tracking-[0.3em] mb-5">
                {region.detail}
              </span>
              <h3 className="text-lg font-serif font-bold text-parchment-100 mb-4 leading-snug group-hover:text-amber-100/90 transition-colors">
                {region.name}
              </h3>
              <div className="h-px w-8 bg-amber-400/15 mb-5" />
              <p className="text-xs text-parchment-400/55 leading-loose">
                {region.descriptor}
              </p>
              <p className="mt-4 text-[10px] text-amber-400/30 group-hover:text-amber-400/60 transition-colors uppercase tracking-wider">
                Explore region →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
