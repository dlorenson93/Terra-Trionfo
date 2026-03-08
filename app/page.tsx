import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import FoundingProducers from '@/components/home/FoundingProducers'
import ProvenancePhilosophy from '@/components/home/ProvenancePhilosophy'
import Collections from '@/components/home/Collections'
import FeaturedProducers from '@/components/home/FeaturedProducers'
import FeaturedProducts from '@/components/home/FeaturedProducts'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* 1. Brand-first hero */}
        <Hero />
        {/* 2. Founding Producers — dark prestige */}
        <FoundingProducers />
        {/* 3. Provenance Philosophy — editorial credibility */}
        <ProvenancePhilosophy />
        {/* 4. Explore the Collection — category entry */}
        <Collections />
        {/* 5. Families Behind the Bottle — producer-first */}
        <FeaturedProducers />
        {/* 6. Curated Selection in Preparation */}
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  )
}
