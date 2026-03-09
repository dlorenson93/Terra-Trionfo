import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface RegionData {
  name: string
  subtitle: string
  heroLine: string
  description: string
  appellations: string[]
  grapes: string[]
  climateNote: string
  dbKeywords: string[]   // matched against company.region field (case-insensitive)
}

const REGIONS: Record<string, RegionData> = {
  piedmont: {
    name: 'Piedmont',
    subtitle: 'Il Piemonte',
    heroLine: 'The kingdom of Nebbiolo — Barolo, Barbaresco, and alpine terroir.',
    description:
      'Nestled at the foot of the Alps, Piedmont is home to some of Italy\'s most celebrated appellations. The Langhe hills cultivate Nebbiolo into Barolo and Barbaresco, wines of uncommon structure and longevity. Barbera d\'Asti brings generosity; Moscato d\'Asti, delicacy. Truffle country, slow fermentation, and a deep tradition of cellaring define the Piemontese ethos.',
    appellations: ['Barolo DOCG', 'Barbaresco DOCG', 'Barbera d\'Asti DOC', 'Moscato d\'Asti DOCG', 'Gavi DOCG', 'Dolcetto d\'Alba DOC'],
    grapes: ['Nebbiolo', 'Barbera', 'Dolcetto', 'Moscato Bianco', 'Cortese'],
    climateNote: 'Continental climate with Alpine influence — significant diurnal shifts preserve acidity and aromatic precision.',
    dbKeywords: ['piedmont', 'piemonte', 'langhe', 'monferrato'],
  },
  tuscany: {
    name: 'Tuscany',
    subtitle: 'La Toscana',
    heroLine: 'Sangiovese country — Chianti, Brunello, and the Bolgheri coast.',
    description:
      'Tuscany defines Italian wine for much of the world. The Sangiovese grape, expressed through an extraordinary range of soils and elevations, yields wines from the structured grandeur of Brunello di Montalcino to the vivid acidity of Chianti Classico. The Bolgheri coast introduced the Supertuscans — Cabernet and Merlot-driven blends that rewrote the international handbook. Ancient hilltop estates, olive groves, and Renaissance landscapes complete the story.',
    appellations: ['Chianti Classico DOCG', 'Brunello di Montalcino DOCG', 'Vino Nobile di Montepulciano DOCG', 'Bolgheri DOC', 'Morellino di Scansano DOC', 'Vernaccia di San Gimignano DOCG'],
    grapes: ['Sangiovese', 'Cabernet Sauvignon', 'Merlot', 'Vernaccia', 'Trebbiano Toscano'],
    climateNote: 'Warm Mediterranean tendencies moderated by maritime breezes along the coast and altitude inland.',
    dbKeywords: ['tuscany', 'toscana', 'chianti', 'montalcino', 'bolgheri', 'montepulciano'],
  },
  veneto: {
    name: 'Veneto',
    subtitle: 'Il Veneto',
    heroLine: 'From Amarone\'s dried-grape intensity to the volcanic minerality of Soave.',
    description:
      'The Veneto is Italy\'s most prolific wine region, yet quality and variety are everywhere. The Valpolicella zone produces Amarone della Valpolicella — one of the world\'s great red wines — through the appassimento technique of drying harvested grapes before pressing. The Soave hills, with their volcanic basalt soils, yield whites of subtle mineral depth. Prosecco, produced across a sweep of hillside vineyards in Conegliano-Valdobbiadene, has become an emblem of Italian conviviality.',
    appellations: ['Amarone della Valpolicella DOCG', 'Valpolicella DOC', 'Soave Classico DOC', 'Prosecco di Valdobbiadene DOCG', 'Bardolino DOC', 'Ripasso Valpolicella DOC'],
    grapes: ['Corvina', 'Rondinella', 'Garganega', 'Glera', 'Pinot Grigio'],
    climateNote: 'Varied — Lake Garda moderates temperatures in the west; the Dolomites shape alpine conditions in the north.',
    dbKeywords: ['veneto', 'valpolicella', 'amarone', 'soave', 'valdobbiadene'],
  },
  'alto-adige': {
    name: 'Alto Adige',
    subtitle: 'Südtirol',
    heroLine: 'Alpine precision — cool-climate whites and elegant reds at the northern limit.',
    description:
      'Alto Adige (Südtirol) sits at the crossroads of Italian and Tyrolean culture, producing wines of remarkable intensity and finesse at vineyard elevations between 200 and 900 meters. The extreme diurnal temperature range — warm days, cold nights — locks in aromatics and acidity. This region is most celebrated for its Pinot Bianco, Gewürztraminer, and Pinot Nero, though Lagrein — a dark, inky, native red — offers something entirely unique.',
    appellations: ['Alto Adige DOC / Südtirol DOC', 'Santa Maddalena DOC', 'Terlano DOC', 'Valle Isarco DOC'],
    grapes: ['Pinot Bianco', 'Pinot Grigio', 'Gewürztraminer', 'Pinot Nero', 'Lagrein', 'Schiava'],
    climateNote: 'Alpine continental — high altitude and large diurnal shifts produce wines of exceptional aromatic clarity.',
    dbKeywords: ['alto adige', 'südtirol', 'south tyrol', 'trentino', 'bolzano'],
  },
}

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const region = REGIONS[params.slug]
  if (!region) return { title: 'Region Not Found | Terra Trionfo' }
  return {
    title: `${region.name} Wine Region — ${region.subtitle} | Terra Trionfo`,
    description: region.description.slice(0, 160),
  }
}

export default async function RegionPage({ params }: Props) {
  const region = REGIONS[params.slug]
  if (!region) notFound()

  // Find producers whose region field matches any of our keywords
  const rawProducers = await prisma.company.findMany({
    where: {
      status: 'APPROVED',
      contentStatus: 'LIVE',
      OR: region.dbKeywords.map((kw) => ({
        region: { contains: kw, mode: 'insensitive' as const },
      })),
    },
    orderBy: { name: 'asc' },
  })
  const producers = rawProducers as any[]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <div className="bg-olive-900 py-20 px-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='4' fill='%23fff'/%3E%3Crect width='4' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
              backgroundSize: '4px 4px',
            }}
          />
          <div className="relative max-w-5xl mx-auto">
            <Link
              href="/products"
              className="text-parchment-400/50 text-xs uppercase tracking-widest hover:text-parchment-300/70 transition-colors mb-8 inline-flex items-center gap-2"
            >
              ← Back to Products
            </Link>
            <p className="text-[9px] font-medium text-amber-400/60 uppercase tracking-[0.3em] mb-4">
              {region.subtitle}
            </p>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-parchment-100 mb-5 leading-none">
              {region.name}
            </h1>
            <p className="text-parchment-300/70 text-lg max-w-2xl leading-relaxed">
              {region.heroLine}
            </p>
          </div>
        </div>

        {/* ── Editorial description ──────────────────────────────────── */}
        <section className="py-16 px-6 bg-parchment-50 border-t border-parchment-200">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-4">
                About the Region
              </p>
              <p className="text-olive-700 leading-relaxed text-base">{region.description}</p>
              <p className="text-olive-500 text-sm mt-4 leading-relaxed italic">{region.climateNote}</p>
            </div>
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                  Key Appellations
                </p>
                <ul className="space-y-1">
                  {region.appellations.map((a) => (
                    <li key={a} className="text-sm text-olive-700 flex items-start gap-2">
                      <span className="text-amber-500/50 mt-1">·</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                  Principal Grapes
                </p>
                <div className="flex flex-wrap gap-2">
                  {region.grapes.map((g) => (
                    <span
                      key={g}
                      className="text-xs border border-olive-300 text-olive-600 px-2 py-0.5"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Producers from this region ─────────────────────────────── */}
        <section className="py-16 px-6 bg-white border-t border-parchment-200">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
              Terra Trionfo Portfolio
            </p>
            <h2 className="text-3xl font-serif font-bold text-olive-900 mb-10">
              {region.name} Producers
            </h2>

            {producers.length === 0 ? (
              <div className="border border-parchment-300 py-16 text-center">
                <p className="text-olive-400 text-sm italic mb-2">
                  Producers from {region.name} are being prepared for introduction.
                </p>
                <Link href="/products" className="text-olive-600 text-xs underline underline-offset-4 hover:text-olive-800">
                  Browse all available wines →
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {producers.map((producer) => (
                  <Link
                    key={producer.id}
                    href={`/producers/${producer.slug || producer.id}`}
                    className="group border border-parchment-300 hover:border-olive-400 bg-parchment-50 hover:bg-white transition-all duration-200 p-7 flex flex-col"
                  >
                    {producer.isFoundingProducer && (
                      <span className="text-[9px] font-medium text-amber-500/70 uppercase tracking-[0.3em] mb-3">
                        Founding Producer
                      </span>
                    )}
                    <h3 className="font-serif font-bold text-olive-900 text-xl leading-snug mb-2 group-hover:text-olive-700 transition-colors">
                      {producer.name}
                    </h3>
                    <p className="text-xs text-olive-500 mb-3">
                      {[producer.subregion, producer.region, producer.country].filter(Boolean).join(', ')}
                      {producer.foundedYear ? ` · Est. ${producer.foundedYear}` : ''}
                    </p>
                    {producer.shortDescription && (
                      <p className="text-sm text-olive-600 leading-relaxed line-clamp-3 flex-grow">
                        {producer.shortDescription}
                      </p>
                    )}
                    <p className="text-xs text-olive-400 group-hover:text-olive-600 mt-4 transition-colors">
                      View estate →
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Browse wines from region ───────────────────────────────── */}
        <section className="py-12 px-6 bg-olive-900 border-t border-olive-800">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-parchment-300/60 text-xs uppercase tracking-wider mb-1">
                Explore Further
              </p>
              <p className="text-parchment-100 font-serif text-lg">
                Shop wines from {region.name}.
              </p>
            </div>
            <Link
              href="/products"
              className="border border-parchment-400/30 text-parchment-300/80 text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:border-parchment-400/60 hover:text-parchment-100 transition-colors"
            >
              Browse All Wines
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
