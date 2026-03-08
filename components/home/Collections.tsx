import Link from 'next/link'

export default function Collections() {
  return (
    <section className="py-20 px-4 bg-parchment-100 border-t border-olive-100">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.35em] mb-4">
          The Selection
        </p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 leading-snug">
            Explore the Collection
          </h2>
          <p className="text-olive-600 md:max-w-xs leading-relaxed text-sm">
            Artisan Italian wines and olive oils — each personally reviewed before joining the Terra Trionfo marketplace.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Wine */}
          <Link href="/products?category=WINE" className="group border border-olive-200 bg-white p-10 flex flex-col items-start hover:border-olive-400 hover:bg-parchment-50 transition-colors duration-200">
            <span className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.25em] mb-6">Category</span>
            <div className="w-6 h-6 flex items-center justify-center mb-5 opacity-30 group-hover:opacity-50 transition-opacity">
              <svg className="w-5 h-5 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-olive-900 mb-2 group-hover:text-olive-700 transition-colors">Wine</h3>
            <p className="text-sm text-olive-500 leading-relaxed">
              Estate wines from Italy&apos;s most expressive growing regions — selected for provenance and craft.
            </p>
            <span className="mt-6 text-[11px] font-medium text-olive-400 uppercase tracking-[0.2em] group-hover:text-olive-600 transition-colors">View Collection →</span>
          </Link>

          {/* Olive Oil */}
          <Link href="/products?category=OLIVE_OIL" className="group border border-olive-200 bg-white p-10 flex flex-col items-start hover:border-olive-400 hover:bg-parchment-50 transition-colors duration-200">
            <span className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.25em] mb-6">Category</span>
            <div className="w-6 h-6 flex items-center justify-center mb-5 opacity-30 group-hover:opacity-50 transition-opacity">
              <svg className="w-5 h-5 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-olive-900 mb-2 group-hover:text-olive-700 transition-colors">Olive Oil</h3>
            <p className="text-sm text-olive-500 leading-relaxed">
              Cold-pressed extra virgin olive oils from family groves — harvested at peak freshness.
            </p>
            <span className="mt-6 text-[11px] font-medium text-olive-400 uppercase tracking-[0.2em] group-hover:text-olive-600 transition-colors">View Collection →</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
