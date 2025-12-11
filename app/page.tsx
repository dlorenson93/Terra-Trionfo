import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-parchment-100 via-parchment-200 to-parchment-300 py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              {/* Logo */}
              <div className="inline-flex items-center justify-center mb-6">
                <img
                  src="/images/ChatGPT Image Dec 10, 2025, 09_43_23 PM.png"
                  alt="Terra Trionfo Logo"
                  className="h-64 md:h-80 w-auto drop-shadow-lg"
                />
              </div>

              <h1 className="text-5xl md:text-6xl font-serif font-bold text-olive-900 mb-4">
                Terra Trionfo
              </h1>
              <p className="text-2xl md:text-3xl font-serif italic text-olive-700 mb-6">
                Born of the Land
              </p>
              <p className="text-lg text-olive-800 leading-relaxed mb-8 max-w-2xl mx-auto">
                Discover authentic farm-to-table products from artisan producers.
                We connect passionate vendors with discerning consumers through
                our marketplace and wholesale distribution platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products" className="btn-primary text-lg">
                  Shop Products
                </Link>
                <Link href="/auth/signin" className="btn-outline text-lg">
                  Partner With Us
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Business Models Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-olive-900 mb-12">
              Two Ways to Partner
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Marketplace Model */}
              <div className="card p-8">
                <div className="w-12 h-12 rounded-full bg-olive-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-olive-700"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-olive-900 mb-3">
                  Marketplace Model
                </h3>
                <p className="text-olive-700 leading-relaxed mb-4">
                  List your products on our platform. You control pricing and
                  inventory while we provide the marketplace and customer reach.
                </p>
                <ul className="space-y-2 text-olive-700">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-olive-600 mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Set your own prices
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-olive-600 mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Manage your inventory
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-olive-600 mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Transparent commission structure
                  </li>
                </ul>
              </div>

              {/* Wholesale Model */}
              <div className="card p-8">
                <div className="w-12 h-12 rounded-full bg-olive-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-olive-700"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-olive-900 mb-3">
                  Wholesale Model
                </h3>
                <p className="text-olive-700 leading-relaxed mb-4">
                  We purchase your inventory and handle all aspects of retail,
                  pricing, and distribution. Focus on production while we manage
                  sales.
                </p>
                <ul className="space-y-2 text-olive-700">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-olive-600 mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Guaranteed purchase orders
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-olive-600 mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    We handle all distribution
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-olive-600 mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Predictable revenue stream
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-center text-olive-700 mt-8 text-lg">
              Choose one model or use both for different products. You decide
              what works best for your business.
            </p>
          </div>
        </section>

        {/* Categories Preview */}
        <section className="py-16 px-4 bg-parchment-100">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-olive-900 mb-4">
              Artisan Products
            </h2>
            <p className="text-center text-olive-700 mb-12 max-w-2xl mx-auto">
              From sun-drenched vineyards to family-run farms, discover authentic
              products crafted with care and tradition.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Oils & Vinegars', icon: '🫒' },
                { name: 'Wines', icon: '🍷' },
                { name: 'Pasta & Grains', icon: '🍝' },
                { name: 'Specialty', icon: '✨' },
              ].map((category) => (
                <Link
                  key={category.name}
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                  className="card p-6 text-center hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="font-serif font-semibold text-olive-900">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-olive-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-parchment-100 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-parchment-200 text-lg mb-8">
              Join our community of artisan producers and passionate food lovers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="px-8 py-3 bg-parchment-100 text-olive-800 rounded-lg font-medium hover:bg-parchment-200 transition-colors shadow-lg"
              >
                Browse Products
              </Link>
              <Link
                href="/auth/signin"
                className="px-8 py-3 border-2 border-parchment-100 text-parchment-100 rounded-lg font-medium hover:bg-olive-700 transition-colors"
              >
                Become a Vendor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
