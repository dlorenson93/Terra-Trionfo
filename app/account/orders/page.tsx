'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface Order {
  id: string
  total: number
  status: string
  createdAt: string
  orderItems: {
    id: string
    quantity: number
    unitPrice: number
    modelType: string
    product: {
      id: string
      name: string
      imageUrl?: string
    }
  }[]
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchOrders()
  }, [session])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-olive-900 mb-4">
              My Orders
            </h1>
            <p className="text-olive-700">View your order history</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-olive-700"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-olive-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-olive-900">
                No orders yet
              </h3>
              <p className="text-olive-600 mt-2 mb-6">
                Start shopping to place your first order
              </p>
              <button
                onClick={() => router.push('/products')}
                className="btn-primary"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif font-semibold text-olive-900 text-lg mb-1">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-olive-600">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`badge badge-${order.status.toLowerCase()} mb-2`}
                      >
                        {order.status}
                      </span>
                      <p className="text-lg font-bold text-olive-900">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-olive-200 pt-4">
                    <h4 className="text-sm font-medium text-olive-700 mb-3">
                      Items
                    </h4>
                    <div className="space-y-2">
                      {order.orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <div className="flex-grow">
                            <span className="text-olive-900 font-medium">
                              {item.product.name}
                            </span>
                            <span className="text-olive-600 ml-2">
                              × {item.quantity}
                            </span>
                            <span className="badge bg-parchment-300 text-olive-700 text-xs ml-2">
                              {item.modelType}
                            </span>
                          </div>
                          <span className="text-olive-800 font-medium">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
