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


export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">

        {/* 1. Brand-first hero */}
        <Hero />

        {/* 2. Founding Producers — dark prestige */}
        <FoundingProducers />

        {/* ── Visual break A: vineyard provenance ── */}
        <VisualDivider
          imageSrc={IMG_WHERE_CRAFT_BEGINS}
          title="Where Craft Begins"
          subtitle="Exploring Italy's Artisan Estates"
          height="lg"
          overlay="olive"
        />

        {/* 3. Provenance Philosophy — editorial credibility */}
        <ProvenancePhilosophy />

        {/* ── Visual break B: estate photo strip ── */}
        <EstatePhotoStrip images={STRIP_IMAGES} caption="Inside the Estates" />

        {/* 4. Regional Discovery — Italian terroir storytelling */}
        <RegionalDiscovery />

        {/* ── Visual break C: alpine panoramic ── */}
        <VisualDivider
          imageSrc={IMG_ALPINE_PANORAMIC}
          title="From the Alpine Vineyards of Alto Adige to the Hills of Tuscany"
          height="md"
          overlay="dark"
        />

        {/* 5. Explore the Collection — category entry */}
        <Collections />

        {/* ── Visual break D: olive harvest / beyond wine ── */}
        <VisualDivider
          imageSrc={IMG_BEYOND_WINE}
          title="Beyond Wine"
          subtitle="Small Italian olive oil estates whose groves and presses reflect the same dedication to craft."
          height="lg"
          overlay="parchment"
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

