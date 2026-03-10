import Link from 'next/link'
import type { Wine } from '@/types/wine'
import type { Producer } from '@/types/producer'
import AddToCartButton from '@/components/wines/AddToCartButton'

// Wine type colour tokens
const TYPE_STYLES: Record<string, string> = {
  Red: 'bg-red-50 text-red-700 border-red-200',
  White: 'bg-amber-50 text-amber-700 border-amber-200',
  Sparkling: 'bg-sky-50 text-sky-700 border-sky-200',
  'Sparkling Rosé': 'bg-pink-50 text-pink-700 border-pink-200',
  Rosé: 'bg-pink-50 text-pink-700 border-pink-200',
}

const COLLECTION_STYLES: Record<string, string> = {
  classical: 'text-amber-600/80',
  'alternative-next-generation': 'text-olive-500/80',
}

const COLLECTION_LABELS: Record<string, string> = {
  classical: 'Classical',
  'alternative-next-generation': 'Alt / Next Gen',
}

interface Props {
  wine: Wine
  producer?: Producer
  /** When true the card renders as a plain div (for grid layouts already inside a Link) */
  standalone?: boolean
  /** When true renders with translucent dark background for use over atmospheric photo sections */
  dark?: boolean
}

export default function WineCard({ wine, producer, standalone = true, dark = false }: Props) {
  const typeStyle = TYPE_STYLES[wine.type] ?? 'bg-parchment-100 text-olive-600 border-parchment-300'

  const inner = (
    <div className={`group flex flex-col h-full border transition-all duration-200 rounded-sm p-5 ${
      dark
        ? 'bg-parchment-100/[0.07] border-parchment-100/15 hover:border-amber-400/30 hover:bg-parchment-100/[0.12]'
        : 'bg-white border-parchment-200 hover:border-olive-400 hover:shadow-md'
    }`}>
      {/* Top row: type badge + critic score */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <span
          className={`inline-block text-[9px] font-semibold tracking-[0.14em] uppercase px-2 py-0.5 border rounded-sm ${typeStyle}`}
        >
          {wine.type}
        </span>
        {wine.criticScore && (
          <span className="text-[10px] text-amber-600 font-medium whitespace-nowrap ml-auto">
            ★ {wine.criticScore.split(' ').slice(0, 2).join(' ')}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className={`font-serif font-bold transition-colors text-sm leading-snug mb-1 ${
        dark ? 'text-parchment-100 group-hover:text-amber-100/90' : 'text-olive-900 group-hover:text-olive-700'
      }`}>
        {wine.displayName}
      </h3>

      {/* Appellation */}
      {wine.appellation && (
        <p className={`text-[10px] mb-1 font-medium ${dark ? 'text-parchment-300/60' : 'text-olive-500'}`}>{wine.appellation}</p>
      )}

      {/* Grape / style */}
      {wine.tags && wine.tags.length > 0 && (
        <p className={`text-[10px] italic mb-1 ${dark ? 'text-parchment-400/50' : 'text-olive-400'}`}>{wine.tags[0]}</p>
      )}

      {/* Producer + region */}
      {producer && (
        <p className={`text-[10px] mb-3 uppercase tracking-wider ${dark ? 'text-parchment-400/40' : 'text-olive-400'}`}>
          {producer.subregion} · {producer.region}
        </p>
      )}

      {/* Description */}
      <p className={`text-xs leading-relaxed line-clamp-4 flex-grow mb-3 ${dark ? 'text-parchment-300/60' : 'text-olive-600'}`}>
        {wine.description}
      </p>

      {/* Footer: collection label + COLA status + price */}
      <div className={`flex items-center justify-between mt-auto pt-3 border-t ${dark ? 'border-parchment-100/10' : 'border-parchment-100'}`}>
        <div className="flex items-center gap-3">
          {producer && (
            <span
              className={`text-[9px] font-medium uppercase tracking-[0.12em] ${
                dark
                  ? 'text-amber-400/50'
                  : (COLLECTION_STYLES[producer.collection] ?? 'text-olive-400')
              }`}
            >
              {COLLECTION_LABELS[producer.collection] ?? producer.collection}
            </span>
          )}
        </div>
        <span className={`text-sm font-serif font-semibold ${dark ? 'text-parchment-100' : 'text-olive-900'}`}>
          ${wine.consumerPurchasePriceUSD}
        </span>
      </div>

      {/* Add to Inquiry button */}
      <AddToCartButton wine={wine} producerName={producer?.name ?? ''} />
    </div>
  )

  if (!standalone) return inner

  return (
    <Link href={`/wines/${wine.slug}`} className="block h-full">
      {inner}
    </Link>
  )
}
