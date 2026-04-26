import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function MembershipThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col bg-parchment-100">
      <Header />
      <main className="flex-grow">
        <div className="bg-olive-900 text-parchment-100 py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-olive-300 mb-4">Membership</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold">Membership Confirmed</h1>
            <p className="mt-4 text-base text-olive-200">Thanks for joining our curated wine membership. Your first shipment will be assembled by our importer team and billed through Stripe.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="rounded-3xl bg-white border border-olive-200 p-10 shadow-lg">
            <h2 className="text-2xl font-semibold text-olive-900 mb-4">Next steps</h2>
            <ul className="list-disc list-inside space-y-3 text-olive-700">
              <li>Review membership details in your account.</li>
              <li>We will send a confirmation email with shipment timing.</li>
              <li>If you need to pause or change your tier, contact the team directly.</li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/account/orders" className="btn-primary inline-block text-center">View orders</Link>
              <Link href="/" className="btn-outline inline-block text-center">Return to shop</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
