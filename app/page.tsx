import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import FoundingProducers from '@/components/home/FoundingProducers'
import ProvenancePhilosophy from '@/components/home/ProvenancePhilosophy'
import RegionalDiscovery from '@/components/home/RegionalDiscovery'
import Collections from '@/components/home/Collections'
import FeaturedProducers from '@/components/home/FeaturedProducers'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import VisualDivider from '@/components/marketing/VisualDivider'
import EstatePhotoStrip from '@/components/marketing/EstatePhotoStrip'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">

        {/* 1. Brand-first hero */}
        <Hero />

        {/* Portfolio stats band */}
        <div className="bg-olive-900 py-7 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-center divide-x divide-parchment-100/10">
              {[
                { number: '6', label: 'Italian Estates' },
                { number: '4', label: 'Regions' },
                { number: '21', label: 'Wines Under Evaluation' },
              ].map((stat) => (
                <div key={stat.label} className="text-center px-8 py-2">
                  <p className="text-2xl font-serif font-bold text-parchment-100">{stat.number}</p>
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-parchment-400/60 mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Founding Producers — dark prestige */}
        <FoundingProducers />

        {/* ── Visual break A: rolling Piemonte vineyard hills at golden hour ── */}
        <VisualDivider
          variant="vineyard-hills"
          title="Where Craft Begins"
          subtitle="Exploring Italy's Artisan Estates"
          height="lg"
        />

        {/* 3. Provenance Philosophy — editorial credibility */}
        <ProvenancePhilosophy />

        {/* ── Visual break B: four estate life illustration panels ── */}
        <EstatePhotoStrip caption="Inside the Estates" />

        {/* 4. Regional Discovery — Italian terroir storytelling */}
        <RegionalDiscovery />

        {/* ── Visual break C: Dolomite alpine panoramic ── */}
        <VisualDivider
          variant="alpine-panoramic"
          title="From the Alpine Vineyards of Alto Adige to the Hills of Tuscany"
          height="md"
        />

        {/* 5. Explore the Collection — category entry */}
        <Collections />

        {/* ── Visual break D: olive grove harvest light ── */}
        <VisualDivider
          variant="olive-grove"
          title="Beyond Wine"
          subtitle="Small Italian olive oil estates whose groves and presses reflect the same dedication to craft."
          height="lg"
        />

        {/* 6. Families Behind the Bottle — producer-first */}
        <FeaturedProducers />

        {/* 7. Wines Under Evaluation — incoming portfolio */}
        <FeaturedProducts />

      </main>
      <Footer />
    </div>
  )
}

