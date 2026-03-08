import Link from 'next/link'

export default function FoundingProducers() {
  return (
    <section className="py-24 px-4 bg-olive-900 relative overflow-hidden">
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='4' fill='%23fff'/%3E%3Crect width='4' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
          backgroundSize: '4px 4px',
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Label */}
        <p className="text-[10px] font-medium text-amber-400/70 uppercase tracking-[0.35em] mb-6 text-center">
          Charter Members
        </p>

        <h2 className="text-3xl md:text-4xl font-serif font-bold text-parchment-100 text-center mb-4">
          Founding Producers
        </h2>

        <p className="text-parchment-300/70 text-center max-w-xl mx-auto mb-14 leading-relaxed">
          The first estates aligned with Terra Trionfo are being carefully selected and prepared for introduction.
        </p>

        {/* Placeholder estate cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
          {[
            { region: 'Piedmont' },
            { region: 'Tuscany' },
            { region: 'Veneto' },
          ].map(({ region }) => (
            <div
              key={region}
              className="border border-parchment-300/15 bg-parchment-100/[0.04] p-8 flex flex-col items-center text-center hover:border-amber-400/20 hover:bg-parchment-100/[0.07] transition-colors duration-300"
            >
              <div className="w-10 h-10 border border-amber-400/25 flex items-center justify-center mb-5">
                <svg className="w-4 h-4 text-amber-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <span className="text-[9px] font-medium text-amber-400/50 uppercase tracking-[0.3em] mb-1">
                Founding Estate
              </span>
              <p className="text-xs text-parchment-300/50 tracking-[0.15em] uppercase mb-3">{region}</p>
              <div className="h-px w-10 bg-amber-400/10 mb-3" />
              <p className="text-[11px] text-parchment-400/40 italic">Announcement Soon</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/partner/onboarding"
            className="inline-block border border-amber-400/30 text-amber-300/80 text-xs font-medium tracking-[0.2em] uppercase px-7 py-3 hover:border-amber-400/60 hover:text-amber-300 transition-colors"
          >
            Interested in becoming a founding producer? Apply here →
          </Link>
        </div>
      </div>
    </section>
  )
}
