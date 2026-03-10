'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Image from 'next/image'

interface CartItem {
  productId: string
  name: string
  imageUrl?: string
  price: number
  quantity: number
}

export default function CartPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    loadCart()
  }, [session])

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(Array.isArray(savedCart) ? savedCart : [])
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    const updatedCart = cart.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    )
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter((item) => item.productId !== productId)
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  // determine available fulfillment types based on product capabilities
  const [availableFulfillment, setAvailableFulfillment] = useState<string[]>([])
  const [fulfillmentType, setFulfillmentType] = useState<string>('PICKUP')

  const [deliveryState, setDeliveryState] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [pickupLocationId, setPickupLocationId] = useState('')
  const [pickupLocations, setPickupLocations] = useState<{ id: string; name: string; address: string; city: string; state: string }[]>([])
  const [deliveryZones, setDeliveryZones] = useState<{ id: string; name: string; routes: { deliveryDay: number }[] }[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState('')

  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch('/api/settings')
      if (res.ok) setSettings(await res.json())
    }
    async function loadPickupLocations() {
      const res = await fetch('/api/pickup-locations')
      if (res.ok) setPickupLocations(await res.json())
    }
    async function loadDeliveryZones() {
      const res = await fetch('/api/delivery-zones')
      if (res.ok) setDeliveryZones(await res.json())
    }
    loadSettings()
    loadPickupLocations()
    loadDeliveryZones()
  }, [])

  useEffect(() => {
    // when cart updates, compute intersection of allowedFulfillment
    const compute = async () => {
      const productResponses = await Promise.all(
        cart.map((item) => fetch(`/api/products/${item.productId}`))
      )
      const productsData = await Promise.all(productResponses.map((r) => r.json()))
      let intersection: string[] = ['PICKUP', 'LOCAL_DELIVERY']
      productsData.forEach((p: any) => {
        if (p.allowedFulfillment) {
          intersection = intersection.filter((t) => p.allowedFulfillment.includes(t))
        }
      })
      setAvailableFulfillment(intersection)
      if (!intersection.includes(fulfillmentType)) {
        setFulfillmentType(intersection[0] || 'PICKUP')
      }
    }
    if (cart.length > 0) compute()
  }, [cart])

  const checkout = async () => {
    if (cart.length === 0) return

    setLoading(true)
    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))

      const payload: any = { items, fulfillmentType }
      if (fulfillmentType === 'LOCAL_DELIVERY') {
        payload.zoneId = selectedZoneId
        payload.scheduledDate = scheduledDate
      }
      if (fulfillmentType === 'PICKUP') {
        payload.pickupLocationId = pickupLocationId
        if (scheduledDate) payload.scheduledDate = scheduledDate
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        setCheckoutError(data.error || 'Failed to process order')
        return
      }

      // clear cart and redirect to success page with orderId
      localStorage.removeItem('cart')
      router.push(`/checkout/success?orderId=${data.orderId || ''}`)
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckoutError('Failed to process checkout')
    } finally {
      setLoading(false)
    }
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
              Shopping Cart
            </h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">
          {cart.length === 0 ? (
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
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-olive-900">
                Your cart is empty
              </h3>
              <p className="text-olive-600 mt-2 mb-6">
                Start shopping to add items to your cart
              </p>
              <button
                onClick={() => router.push('/products')}
                className="btn-primary"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item) => (
                  <div key={item.productId} className="card p-4">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="relative w-24 h-24 bg-parchment-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <svg
                              className="w-8 h-8 text-olive-300"
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

                      {/* Details */}
                      <div className="flex-grow">
                        <h3 className="font-serif font-semibold text-olive-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-lg font-bold text-olive-800 mb-3">
                          ${item.price.toFixed(2)}
                        </p>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity - 1)
                              }
                              className="w-8 h-8 rounded-lg border border-olive-300 hover:bg-olive-50 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 1)
                              }
                              className="w-8 h-8 rounded-lg border border-olive-300 hover:bg-olive-50 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="font-bold text-olive-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="card p-6 sticky top-20">
                  <h2 className="text-xl font-serif font-bold text-olive-900 mb-6">
                    Order Summary
                  </h2>

                  {/* Fulfillment options */}
                  {availableFulfillment.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-olive-800 mb-2">
                        Fulfillment Method
                      </h3>
                      <div className="flex flex-col gap-2">
                        {availableFulfillment.map((f) => (
                          <label key={f} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="fulfillment"
                              value={f}
                              checked={fulfillmentType === f}
                              onChange={() => setFulfillmentType(f)}
                              className="form-radio"
                            />
                            {f === 'PICKUP' ? 'Pickup' : 'Local delivery'}
                          </label>
                        ))}
                      </div>

                      {fulfillmentType === 'LOCAL_DELIVERY' && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="label">Delivery Region</label>
                            <select
                              value={selectedZoneId}
                              onChange={(e) => { setSelectedZoneId(e.target.value); setScheduledDate('') }}
                              className="input-field w-full"
                            >
                              <option value="">Select your region…</option>
                              {deliveryZones.map((z) => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                              ))}
                            </select>
                          </div>
                          {selectedZoneId && (() => {
                            const zone = deliveryZones.find((z) => z.id === selectedZoneId)
                            const validDays = zone?.routes.map((r) => r.deliveryDay) ?? []
                            const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                            return (
                              <div>
                                <label className="label">Scheduled Delivery Date</label>
                                <p className="text-xs text-olive-500 mb-1">
                                  This region delivers on: {validDays.map((d) => DAY_NAMES[d]).join(', ')}
                                </p>
                                <input
                                  type="date"
                                  value={scheduledDate}
                                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                  onChange={(e) => setScheduledDate(e.target.value)}
                                  className="input-field w-full"
                                />
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {fulfillmentType === 'PICKUP' && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="label">Pickup Location</label>
                            {pickupLocations.length > 0 ? (
                              <select
                                value={pickupLocationId}
                                onChange={(e) => { setPickupLocationId(e.target.value); setScheduledDate('') }}
                                className="input-field w-full"
                              >
                                <option value="">Select a location…</option>
                                {pickupLocations.map((loc) => (
                                  <option key={loc.id} value={loc.id}>
                                    {loc.name} — {loc.address}, {loc.city}, {loc.state}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-sm text-olive-600 mt-1">
                                Pickup locations will be confirmed after order placement.
                              </p>
                            )}
                          </div>
                          {pickupLocationId && (
                            <div>
                              <label className="label">Pickup Date (optional)</label>
                              <input
                                type="date"
                                value={scheduledDate}
                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="input-field w-full"
                              />
                              <p className="text-xs text-olive-500 mt-1">Pickup is available on scheduled days. We'll confirm your date.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-olive-700">
                      <span>Subtotal</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    {fulfillmentType === 'LOCAL_DELIVERY' && (
                      <div className="flex justify-between text-olive-700">
                        <span>Delivery Fee</span>
                        <span>${(settings?.deliveryFeeCents || 0) / 100}</span>
                      </div>
                    )}
                    <div className="border-t border-olive-200 pt-3">
                      <div className="flex justify-between text-lg font-bold text-olive-900">
                        <span>Total</span>
                        <span>
                          ${(
                            total +
                            (fulfillmentType === 'LOCAL_DELIVERY'
                              ? (settings?.deliveryFeeCents || 0) / 100
                              : 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={checkout}
                    disabled={loading}
                    className="btn-primary w-full py-3 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>

                  {checkoutError && (
                    <p className="mt-3 text-sm text-red-700 text-center">{checkoutError}</p>
                  )}

                  {/* Fulfillment info block */}
                  <div className="mt-6 pt-5 border-t border-parchment-200">
                    <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-3">
                      Fulfillment Information
                    </p>
                    <ul className="space-y-2 text-xs text-olive-600 leading-relaxed">
                      <li className="flex gap-2">
                        <span className="mt-0.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                        Pickup is coordinated through Terra Trionfo at a confirmed Massachusetts location.
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                        Local delivery is available in select Massachusetts regions on scheduled days.
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                        Pickup locations and fulfillment details are confirmed after order placement.
                      </li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
