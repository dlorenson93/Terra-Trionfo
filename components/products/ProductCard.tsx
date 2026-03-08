import Image from 'next/image'
import Link from 'next/link'

interface ProductCardProps {
  id: string
  name: string
  imageUrl?: string
  category: string
  retailPrice: number
  companyName: string
  commerceModel: 'MARKETPLACE' | 'WHOLESALE' | 'HYBRID'
  contentStatus?: string
  // Wine/product enrichment fields
  vintage?: number | null
  appellation?: string | null
  grapeVarietals?: string[]
  tastingNotesShort?: string | null
  isLimitedAllocation?: boolean
  isFeatured?: boolean
  isFoundingWine?: boolean
  badgeText?: string | null
}

export default function ProductCard({
  id,
  name,
  imageUrl,
  category,
  retailPrice,
  companyName,
  commerceModel,
  contentStatus,
  vintage,
  appellation,
  grapeVarietals,
  tastingNotesShort,
  isLimitedAllocation,
  isFeatured,
  isFoundingWine,
  badgeText,
}: ProductCardProps) {
  const isLive = !contentStatus || contentStatus === 'LIVE'
  const badge = badgeText || (isFoundingWine ? 'Founding Wine' : isLimitedAllocation ? 'Limited' : isFeatured ? 'Featured' : null)

  // Restrained card for non-live products (admin preview / graceful fallback)
  if (!isLive) {
    return (
      <div className="card overflow-hidden flex flex-col opacity-70 border border-dashed border-olive-300">
        <div className="h-52 bg-gradient-to-br from-olive-50 to-parchment-200 flex items-center justify-center flex-shrink-0">
          <div className="text-center px-4">
            <div className="w-10 h-10 rounded-full bg-olive-200 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-olive-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-olive-600 uppercase tracking-widest">Curated Selection</p>
            <p className="text-xs text-olive-400 mt-0.5">Coming Soon</p>
          </div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <p className="text-xs text-olive-400 uppercase tracking-wider mb-1">{category}</p>
          <div className="h-4 w-3/4 bg-olive-200 rounded mt-1 mb-2" />
          <div className="h-3 w-1/2 bg-olive-100 rounded" />
          <div className="mt-auto pt-3">
            <span className="text-xs px-2 py-1 rounded-full bg-olive-100 text-olive-600 uppercase tracking-wide">
              {contentStatus === 'IN_REVIEW' ? 'Sample Review' : contentStatus === 'READY' ? 'Finalizing' : 'In Preparation'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/products/${id}`} className="card overflow-hidden group flex flex-col">
      {/* Image */}
      <div className="relative h-52 bg-parchment-200 overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-olive-100 to-olive-200">
            <svg
              className="w-16 h-16 text-olive-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        )}
        {badge && (
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
              isFoundingWine ? 'bg-amber-400 text-olive-900' :
              isLimitedAllocation ? 'bg-red-600 text-white' :
              'bg-olive-700 text-parchment-100'
            }`}>
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-1">
          <p className="text-xs text-olive-500 uppercase tracking-wider mb-0.5">
            {category}{vintage ? ` · ${vintage}` : ''}
          </p>
          <h3 className="font-serif font-semibold text-olive-900 text-lg leading-snug group-hover:text-olive-700 transition-colors">
            {name}
          </h3>
        </div>

        {appellation && (
          <p className="text-xs text-olive-600 mb-1 italic">{appellation}</p>
        )}

        {grapeVarietals && grapeVarietals.length > 0 && (
          <p className="text-xs text-olive-500 mb-2">{grapeVarietals.join(', ')}</p>
        )}

        {tastingNotesShort && (
          <p className="text-xs text-olive-700 italic line-clamp-2 mb-2 flex-grow">
            "{tastingNotesShort}"
          </p>
        )}

        <p className="text-sm text-olive-600 mb-3">{companyName}</p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-2xl font-bold text-olive-900">
            ${retailPrice.toFixed(2)}
          </span>

          <div className="flex gap-1 flex-wrap justify-end">
            {(commerceModel === 'MARKETPLACE' || commerceModel === 'HYBRID') && (
              <span className="badge bg-olive-100 text-olive-700 text-xs">
                Marketplace
              </span>
            )}
            {(commerceModel === 'WHOLESALE' || commerceModel === 'HYBRID') && (
              <span className="badge bg-parchment-400 text-olive-800 text-xs">
                Wholesale
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
