import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-olive-900 text-parchment-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2 pr-8">
            <h3 className="text-2xl font-serif font-bold mb-1">Terra Trionfo</h3>
            <p className="text-parchment-400 italic text-sm mb-5">Born of the Land</p>
            <p className="text-sm text-parchment-300 leading-relaxed">
              A private selection of artisan Italian producers — curated for provenance,
              craft, and integrity. Wines and olive oils reviewed at the source,
              delivered to discerning audiences across Massachusetts.
            </p>
          </div>

          {/* Portfolio */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-parchment-400/60 mb-4">Portfolio</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/products" className="text-parchment-300 hover:text-parchment-100 transition-colors">
                  Explore the Portfolio
                </Link>
              </li>
              <li>
                <Link href="/producers" className="text-parchment-300 hover:text-parchment-100 transition-colors">
                  Producers
                </Link>
              </li>
              <li>
                <Link href="/regions" className="text-parchment-300 hover:text-parchment-100 transition-colors">
                  Wine Regions
                </Link>
              </li>
              <li>
                <Link href="/restaurants" className="text-parchment-300 hover:text-parchment-100 transition-colors">
                  Restaurants
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-parchment-300 hover:text-parchment-100 transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-parchment-300 hover:text-parchment-100 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-parchment-400/60 mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/partner/onboarding" className="text-parchment-300 hover:text-parchment-100 transition-colors">
                  Become a Partner
                </Link>
              </li>
              <li>
                <Link href="/pricing/models" className="text-parchment-300 hover:text-parchment-100 transition-colors">
                  Pricing Models
                </Link>
              </li>
              <li>
                <Link href="/investors" className="text-parchment-300 hover:text-parchment-100 transition-colors">
                  For Investors
                </Link>
              </li>
            </ul>

            <div className="mt-8 pt-6 border-t border-olive-800 space-y-1.5 text-sm text-parchment-300">
              <p>info@terratrionfo.com</p>
              <p>+1 (555) 123-4567</p>
              <p className="pt-1 leading-snug text-parchment-400">
                Trionfo Holding Co., Inc.<br />Boston, MA
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-olive-800 mt-12 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-parchment-400/60">
          <p>&copy; {new Date().getFullYear()} Trionfo Holding Co., Inc. All rights reserved.</p>
          <p className="italic">Italian provenance · Massachusetts distribution</p>
        </div>
      </div>
    </footer>
  )
}
