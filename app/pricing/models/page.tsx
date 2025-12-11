import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function PricingModelsPage() {
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
            Partnership Models
          </h1>
          <p className="text-xl text-olive-700 max-w-3xl mx-auto">
            Choose the model that works best for your business. Whether you prefer consignment-based 
            marketplace sales or predictable wholesale purchases, Terra Trionfo supports your growth.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 text-center mb-12">
            Side-by-Side Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-olive-700 text-white">
                  <th className="p-4 text-left font-serif text-lg">Feature</th>
                  <th className="p-4 text-center font-serif text-lg border-l border-olive-600">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Marketplace Model
                    </div>
                  </th>
                  <th className="p-4 text-center font-serif text-lg border-l border-olive-600">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Wholesale Model
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-100">
                <tr className="hover:bg-parchment-50 transition-colors">
                  <td className="p-4 font-semibold text-olive-900">Inventory Ownership</td>
                  <td className="p-4 text-center border-l border-olive-100">Vendor retains ownership</td>
                  <td className="p-4 text-center border-l border-olive-100">Terra Trionfo purchases upfront</td>
                </tr>
                <tr className="hover:bg-parchment-50 transition-colors">
                  <td className="p-4 font-semibold text-olive-900">Pricing Control</td>
                  <td className="p-4 text-center border-l border-olive-100">Vendor sets base price</td>
                  <td className="p-4 text-center border-l border-olive-100">Terra Trionfo controls retail price</td>
                </tr>
                <tr className="hover:bg-parchment-50 transition-colors">
                  <td className="p-4 font-semibold text-olive-900">Revenue Model</td>
                  <td className="p-4 text-center border-l border-olive-100">Earn per sale (base price)</td>
                  <td className="p-4 text-center border-l border-olive-100">Paid upfront on delivery</td>
                </tr>
                <tr className="hover:bg-parchment-50 transition-colors">
                  <td className="p-4 font-semibold text-olive-900">Payment Timing</td>
                  <td className="p-4 text-center border-l border-olive-100">Bi-weekly payouts</td>
                  <td className="p-4 text-center border-l border-olive-100">Net 15-30 days after delivery</td>
                </tr>
                <tr className="hover:bg-parchment-50 transition-colors">
                  <td className="p-4 font-semibold text-olive-900">Fulfillment</td>
                  <td className="p-4 text-center border-l border-olive-100">Vendor ships to customer</td>
                  <td className="p-4 text-center border-l border-olive-100">Terra Trionfo handles fulfillment</td>
                </tr>
                <tr className="hover:bg-parchment-50 transition-colors">
                  <td className="p-4 font-semibold text-olive-900">Risk</td>
                  <td className="p-4 text-center border-l border-olive-100">Sales-dependent</td>
                  <td className="p-4 text-center border-l border-olive-100">Guaranteed purchase</td>
                </tr>
                <tr className="hover:bg-parchment-50 transition-colors">
                  <td className="p-4 font-semibold text-olive-900">Best For</td>
                  <td className="p-4 text-center border-l border-olive-100">Flexible inventory, direct control</td>
                  <td className="p-4 text-center border-l border-olive-100">Bulk orders, predictable revenue</td>
                </tr>
                <tr className="hover:bg-parchment-50 transition-colors">
                  <td className="p-4 font-semibold text-olive-900">Terra Trionfo Markup</td>
                  <td className="p-4 text-center border-l border-olive-100">Added to vendor base price</td>
                  <td className="p-4 text-center border-l border-olive-100">Full margin on retail price</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detailed Cards */}
      <section className="py-16 bg-parchment-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Marketplace Model Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-olive-600 to-olive-700 p-6 text-white">
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-serif font-bold text-center">Marketplace Model</h3>
                <p className="text-center text-olive-100 mt-2">Consignment-Based Partnership</p>
              </div>
              
              <div className="p-8">
                <h4 className="text-xl font-serif font-bold text-olive-900 mb-4">How It Works</h4>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <span className="text-olive-700 font-bold">1</span>
                    </div>
                    <p className="text-olive-700">
                      <span className="font-semibold">You set your base price</span> - the amount you want to earn per unit sold
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <span className="text-olive-700 font-bold">2</span>
                    </div>
                    <p className="text-olive-700">
                      <span className="font-semibold">Terra Trionfo adds markup</span> - we apply our commission/fee to the final consumer price
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <span className="text-olive-700 font-bold">3</span>
                    </div>
                    <p className="text-olive-700">
                      <span className="font-semibold">Product listed</span> - your item goes live on our marketplace with transparent pricing
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <span className="text-olive-700 font-bold">4</span>
                    </div>
                    <p className="text-olive-700">
                      <span className="font-semibold">Earn per sale</span> - you receive your base price for every unit sold
                    </p>
                  </div>
                </div>

                <div className="bg-olive-50 rounded-lg p-4 mb-6">
                  <h5 className="font-semibold text-olive-900 mb-2">Example:</h5>
                  <div className="text-sm text-olive-700 space-y-1">
                    <p>Your base price: <span className="font-semibold">$10.00</span></p>
                    <p>Terra Trionfo markup: <span className="font-semibold">$3.00</span></p>
                    <p className="border-t border-olive-200 pt-1">Consumer pays: <span className="font-semibold text-lg">$13.00</span></p>
                    <p className="text-olive-600 italic">You earn $10 per sale</p>
                  </div>
                </div>

                <h4 className="text-xl font-serif font-bold text-olive-900 mb-3">Best For:</h4>
                <ul className="space-y-2 text-olive-700 mb-6">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Vendors wanting control over pricing
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Flexible inventory management
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Small to medium production volumes
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Direct connection with customers
                  </li>
                </ul>
              </div>
            </div>

            {/* Wholesale Model Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-olive-800 to-olive-900 p-6 text-white">
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-serif font-bold text-center">Wholesale Model</h3>
                <p className="text-center text-olive-100 mt-2">Bulk Purchase Partnership</p>
              </div>
              
              <div className="p-8">
                <h4 className="text-xl font-serif font-bold text-olive-900 mb-4">How It Works</h4>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <span className="text-olive-700 font-bold">1</span>
                    </div>
                    <p className="text-olive-700">
                      <span className="font-semibold">Terra Trionfo places order</span> - we purchase inventory in bulk at wholesale cost
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <span className="text-olive-700 font-bold">2</span>
                    </div>
                    <p className="text-olive-700">
                      <span className="font-semibold">You deliver products</span> - ship bulk order to Terra Trionfo distribution center
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <span className="text-olive-700 font-bold">3</span>
                    </div>
                    <p className="text-olive-700">
                      <span className="font-semibold">Get paid upfront</span> - receive payment per terms (net 15-30 days)
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <span className="text-olive-700 font-bold">4</span>
                    </div>
                    <p className="text-olive-700">
                      <span className="font-semibold">We handle the rest</span> - Terra Trionfo manages pricing, fulfillment, and sales
                    </p>
                  </div>
                </div>

                <div className="bg-olive-50 rounded-lg p-4 mb-6">
                  <h5 className="font-semibold text-olive-900 mb-2">Example:</h5>
                  <div className="text-sm text-olive-700 space-y-1">
                    <p>Your wholesale cost: <span className="font-semibold">$8.00/unit</span></p>
                    <p>Terra Trionfo order: <span className="font-semibold">500 units</span></p>
                    <p className="border-t border-olive-200 pt-1">You receive: <span className="font-semibold text-lg">$4,000</span></p>
                    <p className="text-olive-600 italic">Paid upfront, guaranteed revenue</p>
                  </div>
                </div>

                <h4 className="text-xl font-serif font-bold text-olive-900 mb-3">Best For:</h4>
                <ul className="space-y-2 text-olive-700 mb-6">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Vendors with large production capacity
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Predictable revenue needs
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Preferring bulk orders over individual sales
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-olive-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Offloading fulfillment to Terra Trionfo
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hybrid Approach */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-olive-50 to-parchment-50 rounded-xl p-8 shadow-md">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-olive-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-olive-900 mb-4">
              Can I Use Both Models?
            </h3>
            <p className="text-lg text-olive-700 mb-4">
              Absolutely! Many vendors partner with Terra Trionfo using both models simultaneously. 
              You might sell specialty items through the marketplace while Terra Trionfo purchases your 
              staple products wholesale.
            </p>
            <p className="text-olive-600 italic">
              We'll work with you to determine the best approach for each product line.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-b from-parchment-50 to-olive-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-4">
            Ready to Choose Your Model?
          </h2>
          <p className="text-xl text-olive-700 mb-8">
            Let's discuss which partnership approach works best for your products and business goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partner/onboarding"
              className="inline-block bg-olive-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-olive-800 transition-colors shadow-md"
            >
              Learn About Onboarding
            </Link>
            <Link
              href="/auth/signin"
              className="inline-block bg-white text-olive-700 border-2 border-olive-700 px-8 py-3 rounded-lg font-semibold hover:bg-olive-50 transition-colors"
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
