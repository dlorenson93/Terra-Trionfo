import Link from 'next/link'
import { VISIBLE_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS } from '@/config/marketplace'

export default function Collections() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-olive-900 mb-2">
          Shop by Category
        </h2>
        <p className="text-olive-600 mb-8">Imported Italian Wines &amp; Olive Oils</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {VISIBLE_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(CATEGORY_LABELS[cat] ?? cat)}`}
              className="block p-6 bg-parchment-50 rounded-lg text-center hover:bg-parchment-100 transition group"
            >
              <div className="text-4xl mb-2">{CATEGORY_ICONS[cat]}</div>
              <div className="font-medium text-olive-800 group-hover:text-olive-900">
                {CATEGORY_LABELS[cat]}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
