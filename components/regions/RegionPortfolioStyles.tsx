/**
 * RegionPortfolioStyles — educational wine style cards for each region.
 * Replaces producer listings on region pages to prevent misrepresentation.
 * Specific estates are only surfaced once they are publicly introduced.
 */

interface StyleCard {
  name: string
  grapes: string
  description: string
}

const REGION_STYLES: Record<string, StyleCard[]> = {
  'alto-adige': [
    {
      name: 'Alpine Whites',
      grapes: 'Pinot Bianco · Pinot Grigio · Kerner',
      description:
        'High-altitude whites showing crystalline acidity, minerality, and alpine freshness.',
    },
    {
      name: 'Aromatic Varietals',
      grapes: 'Gewürztraminer',
      description:
        'Perfumed alpine expressions with spice, stone fruit, and vibrant texture.',
    },
    {
      name: 'Mountain Reds',
      grapes: 'Lagrein · Schiava · Pinot Nero',
      description:
        'Elegant reds shaped by cool nights and dramatic elevation shifts.',
    },
  ],
  piedmont: [
    {
      name: 'Nebbiolo Classics',
      grapes: 'Nebbiolo',
      description:
        'Structured wines with firm tannins, red fruit, and exceptional aging potential.',
    },
    {
      name: 'Everyday Piemonte',
      grapes: 'Barbera · Dolcetto',
      description:
        'Bright, food-friendly wines with freshness and approachability.',
    },
    {
      name: 'Aromatic Whites',
      grapes: 'Arneis · Cortese',
      description:
        'Mineral-driven whites offering crisp acidity and subtle floral aromatics.',
    },
  ],
  tuscany: [
    {
      name: 'Sangiovese Classics',
      grapes: 'Sangiovese',
      description:
        'Elegant wines defined by red fruit, acidity, and expressive terroir.',
    },
    {
      name: 'Tuscan Blends',
      grapes: 'Sangiovese · Cabernet · Merlot',
      description:
        'Modern interpretations combining native and international varieties.',
    },
    {
      name: 'Coastal Tuscany',
      grapes: 'Cabernet Sauvignon · Syrah',
      description:
        'Mediterranean influenced wines with richness and structure.',
    },
  ],
  veneto: [
    {
      name: 'Soave Whites',
      grapes: 'Garganega',
      description: 'Fresh whites with almond, citrus, and mineral tones.',
    },
    {
      name: 'Valpolicella Reds',
      grapes: 'Corvina · Rondinella',
      description: 'Bright red fruit wines with elegance and balance.',
    },
    {
      name: 'Amarone Tradition',
      grapes: 'Corvina · Corvinone',
      description:
        'Rich, structured wines produced through traditional appassimento drying.',
    },
  ],
}

interface Props {
  regionSlug: string
  regionName: string
}

export default function RegionPortfolioStyles({ regionSlug, regionName }: Props) {
  const styles = REGION_STYLES[regionSlug]
  if (!styles?.length) return null

  return (
    <section className="py-16 px-6 bg-white border-t border-parchment-200">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
          Terra Trionfo Portfolio
        </p>
        <h2 className="text-3xl font-serif font-bold text-olive-900 mb-4">
          {regionName} Wine Styles
        </h2>
        <p className="text-sm text-olive-600 leading-relaxed max-w-2xl mb-10">
          The Terra Trionfo portfolio focuses on wines that reflect the distinctive terroir
          of this region. These styles represent the character and traditions that define the
          region&apos;s viticulture. Specific estates are introduced as they join the Terra
          Trionfo portfolio.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {styles.map((style) => (
            <div
              key={style.name}
              className="border border-parchment-300 bg-parchment-50 p-7 flex flex-col"
            >
              <h3 className="font-serif font-bold text-olive-900 text-lg leading-snug mb-3">
                {style.name}
              </h3>
              <p className="text-[10px] font-medium text-amber-600/70 uppercase tracking-[0.22em] mb-4">
                {style.grapes}
              </p>
              <p className="text-sm text-olive-600 leading-relaxed">{style.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
