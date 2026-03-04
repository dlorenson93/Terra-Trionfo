import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import FeaturedProducers from '@/components/home/FeaturedProducers'
import Collections from '@/components/home/Collections'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Collections />
        <FeaturedProducts />
        <FeaturedProducers />
      </main>
      <Footer />
    </div>
  )
}
