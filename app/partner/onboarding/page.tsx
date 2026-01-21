import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function VendorOnboardingPage() {
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
            Partner With Terra Trionfo
          </h1>
          <p className="text-xl text-olive-700 max-w-3xl mx-auto mb-8">
            Join a community of artisan producers, winemakers, and family farms bringing authentic 
            farm-to-table excellence to appreciative audiences. We support your traditions and 
            craftsmanship through collaborative partnership and modern commerce infrastructure.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-olive-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-olive-800 transition-colors"
          >
            Apply as a Vendor
          </Link>
        </div>
      </section>

      {/* Onboarding Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 text-center mb-12">
            Your Journey to Partnership
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-olive-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-bold text-olive-900 mb-2">1. Submit Application</h3>
              <p className="text-olive-600">
                Complete our vendor application with details about your farm, products, and production practices.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-olive-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-bold text-olive-900 mb-2">2. Partnership Review</h3>
              <p className="text-olive-600">
                Our team reviews your application to ensure mutual alignment on quality, authenticity, 
                and values (typically 3-5 business days).
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-olive-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-bold text-olive-900 mb-2">3. List Your Products</h3>
              <p className="text-olive-600">
                Upload product details, photos, and pricing. Our team provides guidance to showcase your goods beautifully.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-olive-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-bold text-olive-900 mb-2">4. Go Live & Sell</h3>
              <p className="text-olive-600">
                Once approved, your products are live. Start receiving orders and connecting with customers who value quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Required Documentation */}
      <section className="py-16 bg-parchment-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 text-center mb-12">
            Required Documentation
          </h2>
          
          <div className="bg-white rounded-lg shadow-md p-8">
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-olive-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold text-olive-900">Business Registration:</span>
                  <span className="text-olive-700"> LLC, sole proprietorship, or farm registration documents</span>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-olive-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold text-olive-900">Food Safety Certifications:</span>
                  <span className="text-olive-700"> Relevant licenses, cottage food permits, or FDA registrations</span>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-olive-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold text-olive-900">Product Information:</span>
                  <span className="text-olive-700"> Descriptions, ingredients, nutritional facts, allergen information</span>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-olive-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold text-olive-900">Product Photos:</span>
                  <span className="text-olive-700"> High-quality images (minimum 1000x1000px) showcasing your products</span>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-olive-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold text-olive-900">Banking Information:</span>
                  <span className="text-olive-700"> For payment processing and vendor payouts</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Logistics & Operations */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 text-center mb-12">
            Logistics & Operations
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Delivery & Pickup */}
            <div className="bg-parchment-50 rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-olive-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                <h3 className="text-xl font-serif font-bold text-olive-900">Delivery & Fulfillment</h3>
              </div>
              <p className="text-olive-700 mb-3">
                <span className="font-semibold">Marketplace Model:</span> You handle packaging and delivery coordination. 
                Terra Trionfo provides shipping labels and logistics support.
              </p>
              <p className="text-olive-700">
                <span className="font-semibold">Wholesale Model:</span> Terra Trionfo purchases inventory and manages 
                all fulfillment directly from our distribution center.
              </p>
            </div>

            {/* Packaging */}
            <div className="bg-parchment-50 rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-olive-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-xl font-serif font-bold text-olive-900">Packaging Standards</h3>
              </div>
              <p className="text-olive-700 mb-3">
                All products must meet food safety regulations. We provide supportive guidelines and 
                suggestions for packaging that can complement your brand while meeting quality standards.
              </p>
              <p className="text-olive-700">
                Producers maintain responsibility for ensuring products arrive fresh and intact. We offer 
                packaging recommendations and approved supplier resources as helpful resources.
              </p>
            </div>

            {/* Inventory Tracking */}
            <div className="bg-parchment-50 rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-olive-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 className="text-xl font-serif font-bold text-olive-900">Inventory Management</h3>
              </div>
              <p className="text-olive-700 mb-3">
                Our platform tracks inventory in real-time. You'll receive notifications when stock is low 
                and can update quantities directly from your vendor dashboard.
              </p>
              <p className="text-olive-700">
                For marketplace items, you maintain ownership and update quantities. For wholesale, 
                Terra Trionfo manages inventory after purchase.
              </p>
            </div>

            {/* Product Approval */}
            <div className="bg-parchment-50 rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-olive-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h3 className="text-xl font-serif font-bold text-olive-900">Product Listing Process</h3>
              </div>
              <p className="text-olive-700 mb-3">
                Submit product details through your vendor portal. Our curation team reviews each listing 
                to ensure quality, accuracy, and brand alignment (typically 1-2 business days).
              </p>
              <p className="text-olive-700">
                Once approved, your products go live immediately and are featured in relevant collections 
                and seasonal promotions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Payments & Revenue */}
      <section className="py-16 bg-olive-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 text-center mb-12">
            Payments & Revenue
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Marketplace Payments */}
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="w-12 h-12 bg-olive-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif font-bold text-olive-900 mb-4">Marketplace Model</h3>
              <ul className="space-y-3 text-olive-700">
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>You set your base price per product</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Terra Trionfo adds a marketplace fee/markup</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>You earn your base price on each sale</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Payments processed bi-weekly via direct deposit</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Real-time sales tracking in your dashboard</span>
                </li>
              </ul>
            </div>

            {/* Wholesale Payments */}
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="w-12 h-12 bg-olive-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif font-bold text-olive-900 mb-4">Wholesale Model</h3>
              <ul className="space-y-3 text-olive-700">
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Terra Trionfo purchases inventory upfront</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>You receive payment upon delivery of goods</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Predictable bulk orders with purchase agreements</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Payment terms typically net 15-30 days</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Terra Trionfo manages all retail pricing and fulfillment</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-olive-700 italic">
              Payment schedules and specific terms discussed during onboarding and outlined in vendor agreements.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-b from-parchment-50 to-olive-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-4">
            Ready to Join Our Artisan Community?
          </h2>
          <p className="text-xl text-olive-700 mb-8">
            Bring your authentic, farm-to-table products to customers who value quality and heritage.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-olive-700 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-olive-800 transition-colors shadow-md"
          >
            Apply as a Vendor
          </Link>
          <p className="text-sm text-olive-600 mt-4">
            Have questions? <Link href="/contact" className="underline hover:text-olive-800">Contact our vendor relations team</Link>
          </p>
        </div>
      </section>
      </main>
      
      <Footer />
    </div>
  )
}
