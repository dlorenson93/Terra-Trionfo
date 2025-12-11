import Link from 'next/link'

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-parchment-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-olive-900 via-olive-800 to-olive-700 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <img
            src="/images/ChatGPT Image Dec 10, 2025, 09_43_23 PM.png"
            alt="Terra Trionfo Logo"
            className="h-40 md:h-48 mx-auto mb-8 drop-shadow-lg"
          />
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 drop-shadow-md">
            Why Terra Trionfo?
          </h1>
          <p className="text-xl md:text-2xl text-olive-50 max-w-4xl mx-auto leading-relaxed">
            Building the premier online marketplace for authentic, artisan farm-to-table products — 
            where heritage meets modern commerce, and quality triumphs over convenience.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-4">
              The Problem We're Solving
            </h2>
            <p className="text-xl text-olive-600 max-w-3xl mx-auto">
              The farm-to-table supply chain is broken, leaving producers and consumers disconnected.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-parchment-50 rounded-lg p-6 shadow-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-bold text-olive-900 text-center mb-3">
                Disconnected Supply Chain
              </h3>
              <p className="text-olive-700 text-center">
                Small producers lack direct channels to reach consumers who want their products. 
                Traditional distribution adds layers of middlemen, eroding margins and authenticity.
              </p>
            </div>

            <div className="bg-parchment-50 rounded-lg p-6 shadow-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-bold text-olive-900 text-center mb-3">
                Limited Market Access
              </h3>
              <p className="text-olive-700 text-center">
                Artisan farmers and food producers struggle with e-commerce, logistics, and brand visibility. 
                They need a platform that handles the complexity while preserving their craft.
              </p>
            </div>

            <div className="bg-parchment-50 rounded-lg p-6 shadow-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-bold text-olive-900 text-center mb-3">
                Consumer Demand Gap
              </h3>
              <p className="text-olive-700 text-center">
                Discerning consumers want transparency, traceability, and authentic quality — but existing 
                platforms offer commodity products with questionable origins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-16 bg-olive-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-4">
              The Market Opportunity
            </h2>
            <p className="text-xl text-olive-600 max-w-3xl mx-auto">
              We're positioned at the intersection of explosive growth and rising consumer consciousness.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="text-4xl font-serif font-bold text-olive-700 mb-2">$215B</div>
              <p className="text-olive-600">U.S. specialty food market size (2024)</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="text-4xl font-serif font-bold text-olive-700 mb-2">12.3%</div>
              <p className="text-olive-600">Annual growth rate for artisan food e-commerce</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="text-4xl font-serif font-bold text-olive-700 mb-2">73%</div>
              <p className="text-olive-600">Consumers willing to pay premium for authenticity</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="text-4xl font-serif font-bold text-olive-700 mb-2">$48B</div>
              <p className="text-olive-600">Italian food imports to U.S. (growing 8% YoY)</p>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-xl p-8 shadow-lg">
            <h3 className="text-2xl font-serif font-bold text-olive-900 mb-6 text-center">Key Trends Driving Growth</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-olive-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div>
                  <h4 className="font-semibold text-olive-900 mb-1">Rising Demand for Transparency</h4>
                  <p className="text-sm text-olive-700">
                    Consumers increasingly demand to know product origins, production methods, and maker stories
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 text-olive-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div>
                  <h4 className="font-semibold text-olive-900 mb-1">Cultural Heritage Premium</h4>
                  <p className="text-sm text-olive-700">
                    Italian-inspired and artisan goods command 40-60% price premiums over commodity alternatives
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 text-olive-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div>
                  <h4 className="font-semibold text-olive-900 mb-1">Digital Commerce Acceleration</h4>
                  <p className="text-sm text-olive-700">
                    Specialty food e-commerce grew 300% since 2020, with no signs of slowing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Terra Trionfo Is Different */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-4">
              Why Terra Trionfo Is Different
            </h2>
            <p className="text-xl text-olive-600 max-w-3xl mx-auto">
              We're not just another marketplace. We're building a curated platform rooted in heritage, 
              quality, and dual revenue models that maximize value for producers and investors alike.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-olive-50 to-parchment-50 rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-olive-700 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-olive-900">Dual Business Model</h3>
              </div>
              <p className="text-olive-700 mb-4">
                Unlike competitors that rely solely on commission-based marketplaces, Terra Trionfo operates 
                with <span className="font-semibold">two revenue streams</span>:
              </p>
              <ul className="space-y-2 text-olive-700">
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2 mt-1">1.</span>
                  <span><span className="font-semibold">Marketplace Model:</span> Vendors list products, we add markup, 
                  earn commission on every sale</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2 mt-1">2.</span>
                  <span><span className="font-semibold">Wholesale Model:</span> We purchase inventory upfront, control 
                  pricing, and retain full margin on sales</span>
                </li>
              </ul>
              <p className="mt-4 text-olive-600 italic">
                This flexibility maximizes profit potential while de-risking vendor relationships.
              </p>
            </div>

            <div className="bg-gradient-to-br from-olive-50 to-parchment-50 rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-olive-700 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-olive-900">Curated Quality</h3>
              </div>
              <p className="text-olive-700 mb-4">
                We don't accept everyone. Every vendor undergoes rigorous review:
              </p>
              <ul className="space-y-2 text-olive-700">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Production practices and food safety compliance
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Product authenticity and ingredient transparency
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Brand alignment with heritage and quality values
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Production capacity and fulfillment capability
                </li>
              </ul>
              <p className="mt-4 text-olive-600 italic">
                Premium curation = premium pricing = higher margins.
              </p>
            </div>

            <div className="bg-gradient-to-br from-olive-50 to-parchment-50 rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-olive-700 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-olive-900">Heritage-First Branding</h3>
              </div>
              <p className="text-olive-700 mb-4">
                Terra Trionfo ("Land of Triumph") isn't just a name — it's a story. Our vintage Italian 
                farmhouse aesthetic creates emotional connection and commands premium positioning.
              </p>
              <p className="text-olive-700">
                Every touchpoint — from logo to packaging guidance to product descriptions — reinforces 
                authenticity, heritage, and time-honored traditions. This isn't commodity food; it's 
                <span className="font-semibold italic"> culinary heritage</span>.
              </p>
            </div>

            <div className="bg-gradient-to-br from-olive-50 to-parchment-50 rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-olive-700 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-olive-900">Modern Infrastructure</h3>
              </div>
              <p className="text-olive-700 mb-4">
                Built on Next.js, TypeScript, and enterprise-grade cloud infrastructure (Vercel, Neon, Stripe), 
                Terra Trionfo scales effortlessly:
              </p>
              <ul className="space-y-2 text-olive-700">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Real-time inventory tracking across both models
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Automated vendor payouts and commission tracking
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Secure payment processing with Stripe integration
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Analytics dashboard for data-driven decision making
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Long-Term Vision */}
      <section className="py-16 bg-gradient-to-b from-olive-50 to-parchment-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-4">
              Our Long-Term Vision
            </h2>
            <p className="text-xl text-olive-600 max-w-3xl mx-auto">
              Terra Trionfo isn't just building a marketplace — we're building the future of artisan food commerce.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-5xl font-serif font-bold text-olive-700 mb-3">Phase 1</div>
              <h3 className="text-2xl font-serif font-bold text-olive-900 mb-4">Foundation (Year 1-2)</h3>
              <ul className="space-y-3 text-olive-700">
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Onboard 50-100 curated artisan vendors across categories</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Build marketplace + wholesale infrastructure simultaneously</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Establish brand identity and consumer trust</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Achieve $1-2M annual revenue across both models</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-5xl font-serif font-bold text-olive-700 mb-3">Phase 2</div>
              <h3 className="text-2xl font-serif font-bold text-olive-900 mb-4">Expansion (Year 2-4)</h3>
              <ul className="space-y-3 text-olive-700">
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Scale vendor network to 500+ producers nationwide</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Launch regional distribution centers for wholesale fulfillment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Build logistics partnerships with cold chain providers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Target $10-15M annual revenue with improved margins</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-5xl font-serif font-bold text-olive-700 mb-3">Phase 3</div>
              <h3 className="text-2xl font-serif font-bold text-olive-900 mb-4">Premium Positioning (Year 4-6)</h3>
              <ul className="space-y-3 text-olive-700">
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Become the #1 online destination for authentic Italian-inspired goods</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Launch subscription boxes and curated collections</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Expand into giftware, home goods, and lifestyle categories</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Achieve $50M+ annual revenue with 25-30% gross margins</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-5xl font-serif font-bold text-olive-700 mb-3">Phase 4</div>
              <h3 className="text-2xl font-serif font-bold text-olive-900 mb-4">Private Label (Year 6+)</h3>
              <ul className="space-y-3 text-olive-700">
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Develop exclusive Terra Trionfo branded products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Partner with select artisans for co-branded specialty lines</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Control full value chain for highest-margin products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-olive-600 mr-2">•</span>
                  <span>Position for acquisition or IPO as category leader</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-olive-700 to-olive-800 rounded-xl p-8 shadow-xl text-white text-center">
            <h3 className="text-3xl font-serif font-bold mb-4">Exit Strategy</h3>
            <p className="text-lg text-olive-50 max-w-3xl mx-auto mb-6">
              Terra Trionfo is building toward acquisition by major food/retail players (Whole Foods, Williams Sonoma, 
              Eataly) or Series A/B funding to accelerate national expansion. Projected 5-7 year timeline to exit event.
            </p>
            <p className="text-olive-100 italic">
              Comparable marketplace exits: Good Eggs ($150M valuation), Thrive Market ($300M+), Goldbelly ($180M funding)
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-olive-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Join Us in Building the Future of Artisan Food Commerce
          </h2>
          <p className="text-xl text-olive-100 mb-8">
            We're seeking strategic investors who share our vision for quality, heritage, and sustainable growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-olive-900 px-8 py-3 rounded-lg font-semibold hover:bg-olive-50 transition-colors shadow-lg"
            >
              Request Investor Deck
            </Link>
            <Link
              href="/about"
              className="inline-block bg-olive-700 text-white border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-olive-600 transition-colors"
            >
              Learn Our Story
            </Link>
          </div>
          <p className="text-sm text-olive-300 mt-6">
            For inquiries: investors@terratrionfo.com
          </p>
        </div>
      </section>
    </div>
  )
}
