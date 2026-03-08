import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-olive-900 via-olive-800 to-olive-900 py-24 px-4 overflow-hidden">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      />

      <div className="relative max-w-7xl mx-auto text-center">
        {/* Provenance badge */}
        <div className="inline-flex items-center gap-2 bg-olive-700/50 border border-parchment-300/30 text-parchment-200 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Massachusetts pickup &amp; local delivery only
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold text-parchment-100 mb-5 leading-tight">
          Wines &amp; Oils<br />
          <span className="text-amber-400">Straight from the Source</span>
        </h1>

        <p className="text-xl md:text-2xl font-serif italic text-parchment-300 mb-5">
          Direct from Italy's finest artisan producers
        </p>

        <p className="text-base md:text-lg text-parchment-200/80 leading-relaxed mb-10 max-w-2xl mx-auto">
          Every bottle and tin is sourced directly from the producers who made it —
          no middlemen, no warehouses, no compromise. Reserve yours and collect
          locally or receive it by hand.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products" className="btn-primary text-lg px-8 py-3">
            Shop the Collection
          </Link>
          <Link
            href="/producers"
            className="inline-block border border-parchment-300 text-parchment-100 hover:bg-parchment-100 hover:text-olive-900 transition-colors font-semibold text-lg px-8 py-3 rounded-xl"
          >
            Meet the Producers
          </Link>
        </div>
      </div>
    </section>
  )
}
