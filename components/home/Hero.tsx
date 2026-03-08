import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative bg-olive-900 py-32 px-4 overflow-hidden">
      {/* Fine linen texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='4' fill='%23fff'/%3E%3Crect width='4' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
          backgroundSize: '4px 4px',
        }}
      />
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />

      <div className="relative max-w-4xl mx-auto text-center">

        {/* Provenance badge */}
        <div className="inline-flex items-center gap-2 border border-amber-400/30 text-amber-300/80 text-xs font-medium tracking-[0.2em] uppercase px-5 py-2 mb-12">
          <span className="w-1 h-1 rounded-full bg-amber-400/60 inline-block" />
          Massachusetts pickup &amp; local delivery only
        </div>

        {/* Brand name — primary anchor */}
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-parchment-100 mb-3 tracking-tight leading-none">
          Terra Trionfo
        </h1>

        {/* Brand motto */}
        <p className="text-lg md:text-xl font-serif italic text-amber-300/90 mb-8 tracking-wide">
          Born of the Land
        </p>

        {/* Thin rule */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-parchment-300/30" />
          <div className="w-1 h-1 rounded-full bg-amber-400/50" />
          <div className="h-px w-16 bg-parchment-300/30" />
        </div>

        {/* Positioning line */}
        <p className="text-xl md:text-2xl font-serif text-parchment-200 mb-6 leading-snug">
          Italian Wines &amp; Olive Oils,<br className="hidden sm:block" /> Curated at the Source
        </p>

        {/* Supporting copy */}
        <p className="text-base text-parchment-300/75 leading-relaxed mb-12 max-w-xl mx-auto">
          A private selection of artisan producers from Italy&apos;s most distinctive regions.
          Each estate, wine, and olive oil is personally reviewed before joining the Terra Trionfo marketplace.
        </p>

        {/* CTAs — restrained */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/producers"
            className="inline-block bg-parchment-100 text-olive-900 font-semibold text-sm tracking-wide px-8 py-3.5 hover:bg-white transition-colors"
          >
            Explore the Producers
          </Link>
          <Link
            href="/about"
            className="inline-block border border-parchment-400/40 text-parchment-200 font-medium text-sm tracking-wide px-8 py-3.5 hover:border-parchment-300 hover:text-parchment-100 transition-colors"
          >
            Our Story
          </Link>
        </div>
      </div>
    </section>
  )
}
