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

// ── Curated Unsplash imagery ─────────────────────────────────────────────────
// Each placement uses a distinct image to prevent repetition.

/** After FoundingProducers: Tuscan vineyard hillside at golden hour */
const IMG_WHERE_CRAFT_BEGINS =
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1920&q=75'

/** Estate photo strip — 4 unique estate-life images */
const STRIP_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=900&q=75',
    alt: 'Vineyard rows at dusk, Italian wine estate',
  },
  {
    src: 'https://images.unsplash.com/photo-1566754436393-50d0bc89a2d6?auto=format&fit=crop&w=900&q=75',
    alt: 'Oak barrels ageing in a dimly lit Italian cellar',
  },
  {
    src: 'https://images.unsplash.com/photo-1568213816046-0a4e23a7e9b6?auto=format&fit=crop&w=900&q=75',
    alt: 'Harvested grapes held in both hands, close-up',
  },
  {
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=75',
    alt: 'Barrel room inside a traditional Italian cantina',
  },
]

/** Between RegionalDiscovery and Collections: alpine panoramic vineyard */
const IMG_ALPINE_PANORAMIC =
  'https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?auto=format&fit=crop&w=1920&q=75'

/** After Collections: olive grove with harvest light */
const IMG_BEYOND_WINE =
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1920&q=75'

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

