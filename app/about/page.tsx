import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-parchment-100 via-parchment-200 to-parchment-300 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <img
                src="/images/ChatGPT Image Dec 10, 2025, 09_43_23 PM.png"
                alt="Terra Trionfo Logo"
                className="h-32 md:h-40 w-auto drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-olive-900 mb-4">
              Our Story
            </h1>
            <p className="text-xl md:text-2xl font-serif italic text-olive-700">
              Born of the Land, Rooted in Tradition
            </p>
          </div>
        </section>

        {/* Founder Story Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-6">
                A Heritage Written in Flavor
              </h2>
              
              <div className="space-y-6 text-olive-800 leading-relaxed">
                <p className="text-lg">
                  Some traditions are timeless. In hillside vineyards where generations have 
                  tended the same vines, winemakers know each harvest by touch and intuition. 
                  In stone millhouses where olive oil flows golden and fragrant, artisans press 
                  fruit with methods unchanged for centuries. In family kitchens where pasta 
                  dough is still rolled by hand, the rhythm of work carries the weight of those 
                  who came before. This is living heritage—practiced daily, passed down carefully, 
                  and honored completely by the farmers, winemakers, and artisans who create it.
                </p>

                <p className="text-lg">
                  These are the keepers of authenticity. They tend soil that has fed their families 
                  for generations. They age wine in cellars their grandparents built. They harvest 
                  olives at the exact moment of ripeness, guided by knowledge earned over lifetimes. 
                  Their work cannot be rushed, replicated, or reinvented—it can only be respected, 
                  supported, and shared with those who understand its value.
                </p>

                <p className="text-lg">
                  I grew up surrounded by this dedication. My own family's kitchen table held the 
                  fruits of such labor: wine poured with stories of the vineyard it came from, 
                  olive oil pressed by hands that knew the groves intimately, vegetables grown in 
                  soil tended with patience and care. Those experiences taught me to recognize 
                  authenticity—not as a brand promise, but as a living practice maintained by 
                  people who refuse to compromise.
                </p>

                <p className="text-lg">
                  Terra Trionfo exists to support those producers, winemakers, and artisans. 
                  We are not here to curate their traditions or interpret their heritage—we are 
                  here to connect their craftsmanship with audiences who value its authenticity. 
                  This platform honors producers who control their methods, preserve their regional 
                  identities, and maintain the standards passed down through their families. Their 
                  traditions remain theirs. Our role is simply to ensure those traditions reach 
                  the tables of people who will cherish them as deeply as they deserve.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="bg-gradient-to-r from-parchment-200 via-olive-200 to-parchment-200 h-px"></div>

        {/* Mission & Values Section */}
        <section className="py-16 px-4 bg-parchment-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-olive-900 mb-8 text-center">
              What We Stand For
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Value 1 */}
              <div className="card p-6">
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
                    <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-olive-900 mb-3">
                  Born of the Land
                </h3>
                <p className="text-olive-700 leading-relaxed">
                  Every product comes directly from artisans, winemakers, and farmers who work in 
                  harmony with the earth. We celebrate those who honor seasonal rhythms, 
                  soil-to-table integrity, and the patient, honest labor that cannot be rushed—
                  from pressing olives to aging wines to hand-rolling pasta.
                </p>
              </div>

              {/* Value 2 */}
              <div className="card p-6">
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
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-olive-900 mb-3">
                  Uncompromising Quality
                </h3>
                <p className="text-olive-700 leading-relaxed">
                  Just as my nonna would never serve anything less than perfection, 
                  we partner closely with producers who share our commitment to quality, 
                  authenticity, and care. Quality isn't just our standard—it's the foundation 
                  of trust and mutual respect we build with every partnership.
                </p>
              </div>

              {/* Value 3 */}
              <div className="card p-6">
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
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-olive-900 mb-3">
                  Community Over Commerce
                </h3>
                <p className="text-olive-700 leading-relaxed">
                  We're building more than transactions—we're nurturing relationships 
                  between makers and those who appreciate their craft. Every purchase 
                  supports a family, a farm, a legacy.
                </p>
              </div>

              {/* Value 4 */}
              <div className="card p-6">
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
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-olive-900 mb-3">
                  Time-Honored Traditions
                </h3>
                <p className="text-olive-700 leading-relaxed">
                  In a world obsessed with speed, we honor slowness. We champion 
                  methods passed down through generations—cold-pressing, 
                  hand-rolling, aging—because some things cannot and should not 
                  be hurried.
                </p>
              </div>
            </div>

            {/* Closing Statement */}
            <div className="card p-8 bg-gradient-to-br from-olive-50 to-parchment-100">
              <p className="text-lg text-olive-800 leading-relaxed text-center italic">
                "When you taste the olive oil from our partner producers, you're not just tasting fruit 
                pressed to liquid—you're tasting Tuscan hillsides tended by generations, autumn harvests 
                gathered by skilled hands, and the deep knowledge of artisans who know their craft. 
                When you pour wine from family vineyards, you're pouring decades of patience, passion, 
                and tradition. That's what Terra Trionfo supports. That's what our producers create. 
                Food with memory. Flavor with soul. Heritage honored, never altered."
              </p>
              <p className="text-center text-olive-600 mt-4 font-medium">
                — The Terra Trionfo Family
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4 bg-gradient-to-br from-olive-900 to-olive-800 text-parchment-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Join Us at the Table
            </h2>
            <p className="text-lg mb-8 text-parchment-200">
              Explore products crafted by skilled producers and winemakers who honor tradition, 
              celebrate heritage, and bring generations of knowledge to every harvest and bottle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="btn-primary bg-parchment-200 text-olive-900 hover:bg-parchment-300">
                Shop Our Collection
              </Link>
              <Link href="/auth/signin" className="btn-outline border-parchment-200 text-parchment-100 hover:bg-parchment-100 hover:text-olive-900">
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
