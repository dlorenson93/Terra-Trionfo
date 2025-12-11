'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface Product {
  id: string
  name: string
  description?: string
  imageUrl?: string
  category: string
  consumerPrice: number
  inventory: number
  isMarketplace: boolean
  isWholesale: boolean
  company: {
    id: string
    name: string
    description?: string
  }
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // In a real app, this would add to a cart context/state
    // For now, we'll store in localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find((item: any) => item.productId === product?.id)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.push({
        productId: product?.id,
        name: product?.name,
        imageUrl: product?.imageUrl,
        price: product?.consumerPrice,
        quantity,
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    alert('Added to cart!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-700"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-olive-900 mb-2">
              Product Not Found
            </h2>
            <p className="text-olive-600">
              The product you're looking for doesn't exist.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="relative aspect-square bg-parchment-200 rounded-xl overflow-hidden">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <svg
                    className="w-32 h-32 text-olive-300"
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

            {/* Product Info */}
            <div>
              <div className="mb-4">
                <p className="text-sm text-olive-600 mb-2">{product.category}</p>
                <h1 className="text-4xl font-serif font-bold text-olive-900 mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 mb-4">
                  {product.isMarketplace && (
                    <span className="badge bg-olive-100 text-olive-700">
                      Marketplace
                    </span>
                  )}
                  {product.isWholesale && (
                    <span className="badge bg-parchment-400 text-olive-800">
                      Wholesale
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-olive-600 mb-1">From</p>
                <h3 className="text-xl font-serif font-semibold text-olive-900">
                  {product.company.name}
                </h3>
                {product.company.description && (
                  <p className="text-olive-700 mt-2">
                    {product.company.description}
                  </p>
                )}
              </div>

              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-olive-900 mb-2">
                    Description
                  </h3>
                  <p className="text-olive-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="border-t border-olive-200 pt-6 mb-6">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-olive-900">
                    ${product.consumerPrice.toFixed(2)}
                  </span>
                </div>

                <p className="text-sm text-olive-600 mb-6">
                  {product.inventory > 0
                    ? `${product.inventory} in stock`
                    : 'Out of stock'}
                </p>

                {product.inventory > 0 && (
                  <div className="flex items-center gap-4 mb-6">
                    <div>
                      <label className="label">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        max={product.inventory}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="input-field w-24"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={product.inventory === 0 || addingToCart}
                  className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.inventory === 0
                    ? 'Out of Stock'
                    : addingToCart
                    ? 'Adding...'
                    : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
