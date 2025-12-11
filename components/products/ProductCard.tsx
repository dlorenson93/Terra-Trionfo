import Image from 'next/image'
import Link from 'next/link'

interface ProductCardProps {
  id: string
  name: string
  imageUrl?: string
  category: string
  consumerPrice: number
  companyName: string
  isMarketplace: boolean
  isWholesale: boolean
}

export default function ProductCard({
  id,
  name,
  imageUrl,
  category,
  consumerPrice,
  companyName,
  isMarketplace,
  isWholesale,
}: ProductCardProps) {
  return (
    <Link href={`/products/${id}`} className="card overflow-hidden group">
      {/* Image */}
      <div className="relative h-48 bg-parchment-200 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
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
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-olive-600 mb-1">{category}</p>
            <h3 className="font-serif font-semibold text-olive-900 text-lg group-hover:text-olive-700 transition-colors">
              {name}
            </h3>
          </div>
        </div>

        <p className="text-sm text-olive-600 mb-3">{companyName}</p>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-olive-900">
            ${consumerPrice.toFixed(2)}
          </span>

          <div className="flex gap-1">
            {isMarketplace && (
              <span className="badge bg-olive-100 text-olive-700 text-xs">
                Marketplace
              </span>
            )}
            {isWholesale && (
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
