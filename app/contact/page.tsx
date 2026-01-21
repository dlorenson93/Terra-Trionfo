import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-parchment-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-olive-50 to-parchment-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <img
              src="/images/ChatGPT Image Dec 10, 2025, 09_43_23 PM.png"
              alt="Terra Trionfo Logo"
              className="h-32 md:h-40 mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-olive-900 mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-olive-700 max-w-3xl mx-auto">
              We'd love to hear from you. Whether you're a producer, winemaker, artisan, 
              investor, or customer, we're here to connect and support.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* General Inquiries */}
              <div className="bg-parchment-50 rounded-lg p-6 shadow-md">
                <div className="w-12 h-12 bg-olive-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-olive-900 text-center mb-3">
                  General Inquiries
                </h3>
                <p className="text-center text-olive-700 mb-4">
                  For general questions and customer support
                </p>
                <p className="text-center">
                  <a href="mailto:info@terratrionfo.com" className="text-olive-600 hover:text-olive-800 font-medium">
                    info@terratrionfo.com
                  </a>
                </p>
              </div>

              {/* Vendor Relations */}
              <div className="bg-parchment-50 rounded-lg p-6 shadow-md">
                <div className="w-12 h-12 bg-olive-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-olive-900 text-center mb-3">
                  Vendor Relations
                </h3>
                <p className="text-center text-olive-700 mb-4">
                  Questions about becoming a vendor or managing your products
                </p>
                <p className="text-center">
                  <a href="mailto:vendors@terratrionfo.com" className="text-olive-600 hover:text-olive-800 font-medium">
                    vendors@terratrionfo.com
                  </a>
                </p>
              </div>

              {/* Investor Relations */}
              <div className="bg-parchment-50 rounded-lg p-6 shadow-md">
                <div className="w-12 h-12 bg-olive-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-olive-900 text-center mb-3">
                  Investor Relations
                </h3>
                <p className="text-center text-olive-700 mb-4">
                  Request investor deck and partnership opportunities
                </p>
                <p className="text-center">
                  <a href="mailto:investors@terratrionfo.com" className="text-olive-600 hover:text-olive-800 font-medium">
                    investors@terratrionfo.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Office Location */}
        <section className="py-16 bg-parchment-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-8">
              Visit Us
            </h2>
            <div className="bg-white rounded-lg p-8 shadow-lg inline-block">
              <div className="flex items-start justify-center mb-4">
                <svg className="w-8 h-8 text-olive-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-left">
                  <p className="font-semibold text-olive-900 text-lg mb-2">Trionfo Holding Co., Inc.</p>
                  <p className="text-olive-700">Boston, MA</p>
                  <p className="text-olive-700 mt-2">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-8">
              Explore More
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/partner/onboarding"
                className="bg-olive-50 hover:bg-olive-100 rounded-lg p-6 transition-colors"
              >
                <h3 className="text-xl font-serif font-bold text-olive-900 mb-2">
                  Become a Vendor
                </h3>
                <p className="text-olive-700 text-sm">
                  Learn about our onboarding process and partnership models
                </p>
              </Link>
              <Link
                href="/investors"
                className="bg-olive-50 hover:bg-olive-100 rounded-lg p-6 transition-colors"
              >
                <h3 className="text-xl font-serif font-bold text-olive-900 mb-2">
                  For Investors
                </h3>
                <p className="text-olive-700 text-sm">
                  Explore our market opportunity and growth strategy
                </p>
              </Link>
              <Link
                href="/about"
                className="bg-olive-50 hover:bg-olive-100 rounded-lg p-6 transition-colors"
              >
                <h3 className="text-xl font-serif font-bold text-olive-900 mb-2">
                  Heritage
                </h3>
                <p className="text-olive-700 text-sm">
                  Discover the artisans, winemakers, and traditions we support
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
