import Link from 'next/link'

const categories = [
  'Oils & Vinegars',
  'Wines',
  'Pasta & Grains',
  'Canned Goods',
  'Specialty',
]

export default function Collections() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-olive-900 mb-8">
          Collections
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className="block p-6 bg-parchment-50 rounded-lg text-center font-medium text-olive-800 hover:bg-parchment-100 transition"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
