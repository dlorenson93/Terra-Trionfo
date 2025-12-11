import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-olive-900 text-parchment-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-serif font-bold mb-2">
              Terra Trionfo
            </h3>
            <p className="text-parchment-300 italic mb-4">Born of the Land</p>
            <p className="text-sm text-parchment-300 leading-relaxed">
              Connecting artisan producers with discerning consumers through our
              farm-to-table marketplace and wholesale distribution platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-parchment-300 hover:text-parchment-100 transition-colors"
                >
                  Shop Products
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-parchment-300 hover:text-parchment-100 transition-colors"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/partner/onboarding"
                  className="text-parchment-300 hover:text-parchment-100 transition-colors"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing/models"
                  className="text-parchment-300 hover:text-parchment-100 transition-colors"
                >
                  Pricing Models
                </Link>
              </li>
              <li>
                <Link
                  href="/investors"
                  className="text-parchment-300 hover:text-parchment-100 transition-colors"
                >
                  For Investors
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-parchment-300">
              <li>info@terratrionfo.com</li>
              <li>+1 (555) 123-4567</li>
              <li className="pt-2">
                Trionfo Holding Co., Inc.
                <br />
                Boston, MA
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-olive-800 mt-8 pt-8 text-center text-sm text-parchment-400">
          <p>
            &copy; {new Date().getFullYear()} Trionfo Holding Co., Inc. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
