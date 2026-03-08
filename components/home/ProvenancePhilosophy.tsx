export default function ProvenancePhilosophy() {
  const pillars = [
    {
      label: 'Direct Relationships',
      body: 'Every producer in the Terra Trionfo marketplace is known personally. We visit estates, meet winemakers, and build relationships before a single bottle is offered.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      ),
    },
    {
      label: 'Regional Identity',
      body: 'We source from Italy\'s most distinctive growing regions — preserving the provenance, terroir, and character that make each estate singular.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      ),
    },
    {
      label: 'Artisan Estates Only',
      body: 'No bulk producers. No labels of convenience. Terra Trionfo represents family estates and small producers where craft, not scale, defines quality.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      ),
    },
    {
      label: 'Reviewed Before Release',
      body: 'Every wine and olive oil is tasted and verified before it appears in the marketplace. Nothing launches without our editorial review.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
  ]

  return (
    <section className="py-24 px-4 bg-white border-t border-olive-100">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-[10px] font-medium text-olive-400 uppercase tracking-[0.35em] mb-4">
            Our Approach
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-5 leading-snug">
            Imported with Intention
          </h2>
          <p className="text-olive-600 leading-relaxed mb-3">
            Terra Trionfo is not a catalog — it is a curated relationship between artisan Italian
            producers and a discerning American audience.
          </p>
          <p className="text-olive-500 leading-relaxed">
            Every estate we represent reflects a place, a family, and a tradition worth preserving.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
          {pillars.map((pillar) => (
            <div key={pillar.label} className="flex gap-5">
              <div className="flex-shrink-0 w-10 h-10 border border-olive-200 flex items-center justify-center mt-0.5">
                <svg className="w-5 h-5 text-olive-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {pillar.icon}
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-olive-900 uppercase tracking-wider mb-2">
                  {pillar.label}
                </h3>
                <p className="text-sm text-olive-600 leading-relaxed">
                  {pillar.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
