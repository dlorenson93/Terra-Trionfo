'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'

interface Stats {
  totalVendors: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingCompanies: number
  pendingProducts: number
  recentOrders: any[]
}

interface Company {
  id: string
  name: string
  contactEmail: string
  status: string
  contentStatus: string
  isFoundingProducer: boolean
  owner: { name: string }
  createdAt: string
  _count?: { products: number }
}

interface Product {
  id: string
  slug?: string | null
  name: string
  category: string
  retailPriceCents: number
  inventory: number
  status: string
  contentStatus: string
  commerceModel: 'MARKETPLACE' | 'WHOLESALE' | 'HYBRID'
  listingOwner: 'VENDOR' | 'TERRA'
  isFeatured: boolean
  isFoundingWine: boolean
  isLimitedAllocation: boolean
  company: { name: string }
}

interface RestaurantWineAdmin {
  id: string
  servingType: string
  product: { id: string; name: string; vintage?: number | null; category: string }
}

interface Restaurant {
  id: string
  name: string
  slug: string
  city: string
  state: string
  cuisineType?: string | null
  priceRange?: string | null
  status: string
  contentStatus: string
  isFeatured: boolean
  wines: RestaurantWineAdmin[]
}

interface DeliveryZone {
  id: string
  name: string
  code: string
  description?: string | null
  isActive: boolean
}

interface DeliveryRoute {
  id: string
  zoneId: string
  zone: { id: string; name: string; code: string }
  deliveryDay: number
  deliveryDayName: string
  isActive: boolean
}

interface PickupScheduleAdmin {
  id: string
  locationId: string
  location: { id: string; name: string; city: string; state: string }
  pickupDay: number
  pickupDayName: string
  isActive: boolean
}

interface PickupLocationAdmin {
  id: string
  name: string
  city: string
  state: string
}

interface Customer {
  id: string
  name: string | null
  email: string
  createdAt: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  ageVerificationStatus?: 'UNVERIFIED' | 'ELIGIBLE' | 'INELIGIBLE' | null
  ageVerifiedAt?: string | null
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'products' | 'restaurants' | 'fulfillment' | 'portfolio-pricing' | 'customers'>('overview')
  const [fulfillmentSubTab, setFulfillmentSubTab] = useState<'zones' | 'routes' | 'schedules'>('zones')

  // Inline product edit state
  const [editingProduct, setEditingProduct] = useState<{
    id: string
    commerceModel: string
    listingOwner: string
    retailPriceDollars: string
    inventory: string
    isFeatured: boolean
    isFoundingWine: boolean
    isLimitedAllocation: boolean
  } | null>(null)

  // Fulfillment ops state
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])
  const [deliveryRoutes, setDeliveryRoutes] = useState<DeliveryRoute[]>([])
  const [pickupSchedules, setPickupSchedules] = useState<PickupScheduleAdmin[]>([])
  const [pickupLocationsList, setPickupLocationsList] = useState<PickupLocationAdmin[]>([])
  const [newRouteForm, setNewRouteForm] = useState({ zoneId: '', deliveryDay: '' })
  const [newScheduleForm, setNewScheduleForm] = useState({ locationId: '', pickupDay: '' })
  const [showNewRestaurantForm, setShowNewRestaurantForm] = useState(false)
  const [newRestaurantForm, setNewRestaurantForm] = useState({
    name: '', slug: '', address: '', city: '', state: 'MA', zipCode: '',
    website: '', cuisineType: '', priceRange: '', description: '',
  })
  const [assignWinePanel, setAssignWinePanel] = useState<{ restaurantId: string; restaurantName: string } | null>(null)
  const [wineAssignForm, setWineAssignForm] = useState({ productId: '', servingType: 'BOTTLE_LIST', notes: '' })

  // Company management state
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false)
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '', contactEmail: '', region: '', country: 'Italy', phone: '', website: '', bio: '', description: '',
  })

  // Wine import state
  const [importingWineId, setImportingWineId] = useState<string | null>(null)
  const [importingAll, setImportingAll] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchData()
  }, [session])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, companiesRes, productsRes, restaurantsRes, zonesRes, routesRes, schedulesRes, pickupLocsRes, customersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/companies'),
        fetch('/api/products'),
        fetch('/api/restaurants'),
        fetch('/api/delivery-zones'),
        fetch('/api/delivery-routes'),
        fetch('/api/pickup-schedules'),
        fetch('/api/pickup-locations'),
        fetch('/api/admin/customers'),
      ])

      setStats(await statsRes.json())
      const companiesData = await companiesRes.json()
      setCompanies(Array.isArray(companiesData) ? companiesData : [])
      const productsData = await productsRes.json()
      setProducts(Array.isArray(productsData) ? productsData : [])
      const restaurantsData = await restaurantsRes.json()
      setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : [])
      const zonesData = await zonesRes.json()
      setDeliveryZones(Array.isArray(zonesData) ? zonesData : [])
      const routesData = await routesRes.json()
      setDeliveryRoutes(Array.isArray(routesData) ? routesData : [])
      const schedulesData = await schedulesRes.json()
      setPickupSchedules(Array.isArray(schedulesData) ? schedulesData : [])
      const pickupLocsData = await pickupLocsRes.json()
      setPickupLocationsList(Array.isArray(pickupLocsData) ? pickupLocsData : [])
      const customersData = await customersRes.json()
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateCompanyStatus = async (companyId: string, status: string) => {
    try {
      await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating company:', error)
    }
  }

  const updateProductStatus = async (productId: string, status: string) => {
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const updateContentStatus = async (productId: string, contentStatus: string) => {
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentStatus }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating content status:', error)
    }
  }

  const updateCompanyContentStatus = async (companyId: string, contentStatus: string) => {
    try {
      await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentStatus }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating company content status:', error)
    }
  }

  const editProduct = (prod: Product) => {
    setEditingProduct({
      id: prod.id,
      commerceModel: prod.commerceModel,
      listingOwner: prod.listingOwner,
      retailPriceDollars: (prod.retailPriceCents / 100).toFixed(2),
      inventory: String(prod.inventory),
      isFeatured: prod.isFeatured,
      isFoundingWine: prod.isFoundingWine,
      isLimitedAllocation: prod.isLimitedAllocation,
    })
  }

  const saveProductEdit = async () => {
    if (!editingProduct) return
    const retailPriceCents = Math.round(parseFloat(editingProduct.retailPriceDollars) * 100)
    if (isNaN(retailPriceCents) || retailPriceCents <= 0) return
    const inventory = parseInt(editingProduct.inventory)
    if (isNaN(inventory) || inventory < 0) return
    try {
      await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commerceModel: editingProduct.commerceModel,
          listingOwner: editingProduct.listingOwner,
          retailPriceCents,
          inventory,
          isFeatured: editingProduct.isFeatured,
          isFoundingWine: editingProduct.isFoundingWine,
          isLimitedAllocation: editingProduct.isLimitedAllocation,
        }),
      })
      setEditingProduct(null)
      fetchData()
    } catch (error) {
      console.error('Error editing product:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const updateAgeVerification = async (userId: string, ageVerificationStatus: string) => {
    try {
      await fetch(`/api/admin/customers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ageVerificationStatus }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating age verification:', error)
    }
  }

  const updateCompanyFoundingStatus = async (companyId: string, isFoundingProducer: boolean) => {
    try {
      await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFoundingProducer }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating founding status:', error)
    }
  }

  const createCompany = async () => {
    const { name, contactEmail } = newCompanyForm
    if (!name.trim() || !contactEmail.trim()) {
      alert('Name and contact email are required')
      return
    }
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCompanyForm, status: 'APPROVED' }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create company')
        return
      }
      setShowNewCompanyForm(false)
      setNewCompanyForm({ name: '', contactEmail: '', region: '', country: 'Italy', phone: '', website: '', bio: '', description: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating company:', error)
    }
  }

  const importWine = async (wine: (typeof WINES)[0]) => {
    const producer = PRODUCERS.find((p) => p.id === wine.producerId)
    const isFoundingWine = producer?.collection === 'classical' ? true : false
    setImportingWineId(wine.id)
    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: wine.id,
          slug: wine.slug,
          name: wine.displayName,
          description: wine.description,
          type: wine.type,
          appellation: wine.appellation,
          region: wine.region,
          producerId: wine.producerId,
          internalWholesalePriceEUR: wine.internalWholesalePriceEUR,
          consumerPurchasePriceUSD: wine.consumerPurchasePriceUSD,
          isFoundingWine,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Import failed')
        return
      }
      fetchData()
    } catch {
      alert('Network error importing wine')
    } finally {
      setImportingWineId(null)
    }
  }

  const importAllMissingWines = async () => {
    const missing = WINES.filter((w) => !products.find((p) => p.slug === w.slug || p.slug === w.id))
    if (missing.length === 0) { alert('All wines are already in the database.'); return }
    if (!confirm(`Import ${missing.length} missing wine(s) to the database?`)) return
    setImportingAll(true)
    try {
      for (const wine of missing) {
        const producer = PRODUCERS.find((p) => p.id === wine.producerId)
        const isFoundingWine = producer?.collection === 'classical' ? true : false
        await fetch('/api/admin/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: wine.id, slug: wine.slug, name: wine.displayName, description: wine.description,
            type: wine.type, appellation: wine.appellation, region: wine.region,
            producerId: wine.producerId, internalWholesalePriceEUR: wine.internalWholesalePriceEUR,
            consumerPurchasePriceUSD: wine.consumerPurchasePriceUSD, isFoundingWine,
          }),
        })
      }
      fetchData()
    } catch {
      alert('Error during bulk import')
    } finally {
      setImportingAll(false)
    }
  }

  const deleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Delete "${companyName}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/companies/${companyId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to delete company')
        return
      }
      fetchData()
    } catch (error) {
      console.error('Error deleting company:', error)
    }
  }

  const updateRestaurantStatus = async (restaurantId: string, status: string) => {
    try {
      await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating restaurant status:', error)
    }
  }

  const updateRestaurantContentStatus = async (restaurantId: string, contentStatus: string) => {
    try {
      await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentStatus }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating restaurant content status:', error)
    }
  }

  const toggleRestaurantFeatured = async (restaurantId: string, isFeatured: boolean) => {
    try {
      await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured }),
      })
      fetchData()
    } catch (error) {
      console.error('Error toggling featured status:', error)
    }
  }

  const createRestaurant = async () => {
    const { name, slug, address, city, state, zipCode } = newRestaurantForm
    if (!name || !slug || !address || !city || !state || !zipCode) {
      alert('Name, slug, address, city, state, and zip are required')
      return
    }
    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRestaurantForm),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create restaurant')
        return
      }
      setShowNewRestaurantForm(false)
      setNewRestaurantForm({ name: '', slug: '', address: '', city: '', state: 'MA', zipCode: '', website: '', cuisineType: '', priceRange: '', description: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating restaurant:', error)
    }
  }

  const assignWine = async () => {
    if (!assignWinePanel || !wineAssignForm.productId) return
    try {
      const res = await fetch(`/api/restaurants/${assignWinePanel.restaurantId}/wines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wineAssignForm),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to assign wine')
        return
      }
      setWineAssignForm({ productId: '', servingType: 'BOTTLE_LIST', notes: '' })
      fetchData()
    } catch (error) {
      console.error('Error assigning wine:', error)
    }
  }

  const removeWine = async (restaurantId: string, productId: string) => {
    try {
      await fetch(`/api/restaurants/${restaurantId}/wines?productId=${productId}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error removing wine:', error)
    }
  }

  // ── Fulfillment operations helpers ─────────────────────────────────────
  const toggleZoneActive = async (zoneId: string, isActive: boolean) => {
    try {
      await fetch(`/api/delivery-zones/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating zone:', error)
    }
  }

  const toggleRouteActive = async (routeId: string, isActive: boolean) => {
    try {
      await fetch(`/api/delivery-routes/${routeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating route:', error)
    }
  }

  const deleteRoute = async (routeId: string) => {
    if (!confirm('Delete this delivery route?')) return
    try {
      await fetch(`/api/delivery-routes/${routeId}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting route:', error)
    }
  }

  const createRoute = async () => {
    if (!newRouteForm.zoneId || newRouteForm.deliveryDay === '') return
    try {
      const res = await fetch('/api/delivery-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId: newRouteForm.zoneId, deliveryDay: parseInt(newRouteForm.deliveryDay) }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create route')
        return
      }
      setNewRouteForm({ zoneId: '', deliveryDay: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating route:', error)
    }
  }

  const toggleScheduleActive = async (scheduleId: string, isActive: boolean) => {
    try {
      await fetch(`/api/pickup-schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating schedule:', error)
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Delete this pickup schedule?')) return
    try {
      await fetch(`/api/pickup-schedules/${scheduleId}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }

  const createSchedule = async () => {
    if (!newScheduleForm.locationId || newScheduleForm.pickupDay === '') return
    try {
      const res = await fetch('/api/pickup-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: newScheduleForm.locationId, pickupDay: parseInt(newScheduleForm.pickupDay) }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create schedule')
        return
      }
      setNewScheduleForm({ locationId: '', pickupDay: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating schedule:', error)
    }
  }

  // Editorial labels for content status
  const contentStatusLabel = (status: string) => {
    switch (status) {
      case 'LIVE': return 'Publicly Introduced'
      case 'READY': return 'Intro Pending'
      case 'IN_REVIEW': return 'Under Review'
      default: return 'Draft'
    }
  }

  const contentStatusStyle = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-green-50 text-green-800 border border-green-200'
      case 'READY': return 'bg-blue-50 text-blue-800 border border-blue-200'
      case 'IN_REVIEW': return 'bg-amber-50 text-amber-800 border border-amber-200'
      default: return 'bg-gray-50 text-gray-600 border border-gray-200'
    }
  }

  // render
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-parchment-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-7 h-7 border-2 border-olive-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-olive-500">Loading dashboard…</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-parchment-50">
      <Header />

      <main className="flex-grow">
        {/* Page header */}
        <div className="bg-olive-900 px-6 py-7">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-olive-400 mb-1">Terra Trionfo</p>
              <h1 className="text-2xl font-serif font-bold text-parchment-100">Operations Dashboard</h1>
            </div>
            {stats && (stats.pendingCompanies > 0 || stats.pendingProducts > 0) && (
              <div className="flex gap-2 pt-1">
                {stats.pendingCompanies > 0 && (
                  <button
                    onClick={() => setActiveTab('companies')}
                    className="text-xs px-3 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                  >
                    {stats.pendingCompanies} {stats.pendingCompanies === 1 ? 'company' : 'companies'} pending
                  </button>
                )}
                {stats.pendingProducts > 0 && (
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs px-3 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                  >
                    {stats.pendingProducts} {stats.pendingProducts === 1 ? 'product' : 'products'} pending
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky navigation */}
        <div className="bg-white border-b border-olive-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex items-center overflow-x-auto">
              {([
                { key: 'overview',          label: 'Overview' },
                { key: 'companies',         label: 'Companies',  badge: stats?.pendingCompanies  },
                { key: 'products',          label: 'Products',   badge: stats?.pendingProducts   },
                { key: 'customers',         label: 'Customers' },
                'divider',
                { key: 'restaurants',       label: 'Restaurants' },
                'divider',
                { key: 'portfolio-pricing', label: 'Pricing' },
                'divider',
                { key: 'fulfillment',       label: 'Fulfillment' },
              ] as const).map((item, i) => {
                if (item === 'divider') {
                  return <div key={`sep-${i}`} className="w-px h-5 bg-olive-200 mx-2 flex-shrink-0" />
                }
                const tab = item as { key: string; label: string; badge?: number }
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`relative flex items-center gap-1.5 px-4 py-[14px] text-sm font-medium whitespace-nowrap transition-colors border-b-2 flex-shrink-0 ${
                      activeTab === tab.key
                        ? 'text-olive-900 border-olive-800'
                        : 'text-olive-500 border-transparent hover:text-olive-800'
                    }`}
                  >
                    {tab.label}
                    {tab.badge != null && tab.badge > 0 && (
                      <span className="text-[9px] font-bold bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Product edit modal */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-olive-200">
                <h2 className="text-base font-serif font-bold text-olive-900">Edit Product</h2>
                <button onClick={() => setEditingProduct(null)} className="text-olive-400 hover:text-olive-800 text-lg leading-none transition-colors">✕</button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Retail Price (USD)</label>
                    <input
                      type="number" step="0.01" min="0.01"
                      className="input-field"
                      value={editingProduct.retailPriceDollars}
                      onChange={(e) => setEditingProduct((p) => p ? { ...p, retailPriceDollars: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <label className="label">Inventory (units)</label>
                    <input
                      type="number" min="0"
                      className="input-field"
                      value={editingProduct.inventory}
                      onChange={(e) => setEditingProduct((p) => p ? { ...p, inventory: e.target.value } : null)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Commerce Model</label>
                    <select
                      className="input-field"
                      value={editingProduct.commerceModel}
                      onChange={(e) => setEditingProduct((p) => p ? { ...p, commerceModel: e.target.value } : null)}
                    >
                      <option value="MARKETPLACE">Marketplace</option>
                      <option value="WHOLESALE">Wholesale</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Listing Owner</label>
                    <select
                      className="input-field"
                      value={editingProduct.listingOwner}
                      onChange={(e) => setEditingProduct((p) => p ? { ...p, listingOwner: e.target.value } : null)}
                    >
                      <option value="VENDOR">Vendor</option>
                      <option value="TERRA">Terra</option>
                    </select>
                  </div>
                </div>
                <div className="border border-olive-200 bg-parchment-50 p-3 space-y-2">
                  <p className="text-xs font-medium text-olive-500 uppercase tracking-wider mb-2">Flags</p>
                  {([
                    { key: 'isFeatured',        label: 'Featured on storefront' },
                    { key: 'isFoundingWine',     label: 'Founding wine' },
                    { key: 'isLimitedAllocation', label: 'Limited allocation' },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-olive-700"
                        checked={editingProduct[key]}
                        onChange={(e) => setEditingProduct((p) => p ? { ...p, [key]: e.target.checked } : null)}
                      />
                      <span className="text-sm text-olive-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-olive-200 bg-parchment-50">
                <button onClick={saveProductEdit} className="flex-1 py-2.5 bg-olive-800 text-parchment-100 text-sm font-medium hover:bg-olive-900 transition-colors">
                  Save Changes
                </button>
                <button onClick={() => setEditingProduct(null)} className="px-5 py-2.5 border border-olive-300 text-olive-700 text-sm hover:bg-parchment-100 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Vendors',  value: stats.totalVendors,              alert: stats.pendingCompanies > 0 ? `${stats.pendingCompanies} pending` : null },
                  { label: 'Products', value: stats.totalProducts,             alert: stats.pendingProducts  > 0 ? `${stats.pendingProducts} pending`  : null },
                  { label: 'Orders',   value: stats.totalOrders,               alert: null },
                  { label: 'Revenue',  value: `$${stats.totalRevenue.toFixed(2)}`, alert: null },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white border border-olive-200 p-5">
                    <p className="text-xs font-medium text-olive-500 uppercase tracking-wider mb-2">{stat.label}</p>
                    <p className="text-3xl font-serif font-bold text-olive-900">{stat.value}</p>
                    {stat.alert && <p className="text-xs text-amber-600 mt-1.5">{stat.alert}</p>}
                  </div>
                ))}
              </div>
              <div className="bg-white border border-olive-200 p-6">
                <h2 className="text-base font-semibold text-olive-900 mb-4">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-olive-200">
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Order ID</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Customer</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Total</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Date</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(stats.recentOrders) ? stats.recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-olive-100 last:border-0">
                          <td className="py-3 text-sm font-mono text-olive-500">{order.id.slice(0, 8)}</td>
                          <td className="py-3 text-sm text-olive-800">{order.user.name}</td>
                          <td className="py-3 text-sm font-medium text-olive-900">${order.total.toFixed(2)}</td>
                          <td className="py-3"><span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span></td>
                          <td className="py-3 text-sm text-olive-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            <div className="flex gap-1 flex-wrap">
                              {order.status === 'PENDING' && (
                                <button onClick={() => updateOrderStatus(order.id, 'CONFIRMED')} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Confirm</button>
                              )}
                              {order.status === 'CONFIRMED' && (
                                <button onClick={() => updateOrderStatus(order.id, 'SHIPPED')} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200">Mark Shipped</button>
                              )}
                              {order.status === 'SHIPPED' && (
                                <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Mark Delivered</button>
                              )}
                              {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                                <button onClick={() => updateOrderStatus(order.id, 'CANCELLED')} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Cancel</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
                  {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                    <p className="text-sm text-olive-400 text-center py-8">No orders yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="bg-white border border-olive-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-olive-900">Consumer Accounts</h2>
                <p className="text-sm text-olive-400">{customers.length} registered</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-olive-200">
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Name / Email</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Phone</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Age Verification</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Verified At</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Joined</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-olive-400">
                          No consumer accounts yet.
                        </td>
                      </tr>
                    ) : customers.map((c) => (
                      <tr key={c.id} className="border-b border-olive-100 last:border-0">
                        <td className="py-3">
                          <p className="text-sm font-medium text-olive-900">
                            {c.firstName || c.lastName
                              ? [c.firstName, c.lastName].filter(Boolean).join(' ')
                              : c.name || '—'}
                          </p>
                          <p className="text-xs text-olive-500">{c.email}</p>
                        </td>
                        <td className="py-3 text-sm text-olive-700">{c.phone || '—'}</td>
                        <td className="py-3">
                          {c.ageVerificationStatus === 'ELIGIBLE' && (
                            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-green-100 text-green-800">
                              21+ Eligible
                            </span>
                          )}
                          {c.ageVerificationStatus === 'INELIGIBLE' && (
                            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-red-100 text-red-800">
                              Ineligible
                            </span>
                          )}
                          {(!c.ageVerificationStatus || c.ageVerificationStatus === 'UNVERIFIED') && (
                            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-parchment-200 text-olive-500">
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-olive-600">
                          {c.ageVerifiedAt
                            ? new Date(c.ageVerifiedAt).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="py-3 text-sm text-olive-600">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1 flex-wrap">
                            {c.ageVerificationStatus !== 'ELIGIBLE' && (
                              <button
                                onClick={() => updateAgeVerification(c.id, 'ELIGIBLE')}
                                className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                              >✓ Verify 21+</button>
                            )}
                            {c.ageVerificationStatus === 'ELIGIBLE' && (
                              <button
                                onClick={() => updateAgeVerification(c.id, 'UNVERIFIED')}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                              >Reset</button>
                            )}
                            {c.ageVerificationStatus !== 'INELIGIBLE' && (
                              <button
                                onClick={() => updateAgeVerification(c.id, 'INELIGIBLE')}
                                className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                              >Flag Ineligible</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              {/* Add Company panel */}
              <div className="bg-white border border-olive-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-olive-900">Producer Companies</h2>
                    <p className="text-sm text-olive-400 mt-0.5">
                      {companies.length} {companies.length === 1 ? 'company' : 'companies'} · Content status controls public producer visibility
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewCompanyForm(!showNewCompanyForm)}
                    className="text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors"
                  >
                    {showNewCompanyForm ? 'Cancel' : '+ Add Company'}
                  </button>
                </div>

                {showNewCompanyForm && (
                  <div className="border border-olive-200 bg-parchment-50 p-5 mb-6">
                    <h3 className="text-sm font-semibold text-olive-900 mb-4">New Producer Company</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Producer Name *</label>
                        <input className="input-field" placeholder="e.g. Stroppiana" value={newCompanyForm.name}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Contact Email *</label>
                        <input className="input-field" type="email" placeholder="contact@producer.com" value={newCompanyForm.contactEmail}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, contactEmail: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Region</label>
                        <input className="input-field" placeholder="e.g. Piemonte, Tuscany" value={newCompanyForm.region}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, region: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Country</label>
                        <input className="input-field" value={newCompanyForm.country}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, country: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Phone</label>
                        <input className="input-field" placeholder="+39 …" value={newCompanyForm.phone}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Website</label>
                        <input className="input-field" placeholder="https://" value={newCompanyForm.website}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, website: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Short Bio</label>
                        <textarea className="input-field" rows={2} placeholder="Brief producer description…" value={newCompanyForm.bio}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, bio: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={createCompany} className="text-sm px-5 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors">
                        Create Company
                      </button>
                      <button onClick={() => setShowNewCompanyForm(false)} className="text-sm px-4 py-2 border border-olive-300 text-olive-700 hover:bg-parchment-100 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-olive-200">
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Company</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Owner</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Email</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Products</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Editorial</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-sm text-olive-400">No companies yet. Add one above.</td>
                        </tr>
                      )}
                      {Array.isArray(companies) ? companies.map((company) => (
                        <tr key={company.id} className="border-b border-olive-100 last:border-0">
                          <td className="py-3 text-sm font-medium text-olive-900">
                            <div className="flex items-center gap-2">
                              {company.name}
                              {company.isFoundingProducer && (
                                <span className="text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 uppercase tracking-wider">Founding</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-sm text-olive-800">{company.owner.name}</td>
                          <td className="py-3 text-sm text-olive-600">{company.contactEmail}</td>
                          <td className="py-3 text-sm text-olive-500 tabular-nums">{company._count?.products ?? 0}</td>
                          <td className="py-3">
                            <span className={`badge badge-${company.status.toLowerCase()}`}>{company.status}</span>
                          </td>
                          <td className="py-3">
                            <span className={`text-[10px] font-medium px-2 py-0.5 ${contentStatusStyle(company.contentStatus ?? 'DRAFT')}`}>
                              {contentStatusLabel(company.contentStatus ?? 'DRAFT')}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1 flex-wrap">
                              {company.status === 'PENDING' && (
                                <>
                                  <button onClick={() => updateCompanyStatus(company.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Approve</button>
                                  <button onClick={() => updateCompanyStatus(company.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">Reject</button>
                                </>
                              )}
                              {company.status === 'APPROVED' && (
                                <button onClick={() => updateCompanyStatus(company.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Revoke</button>
                              )}
                              {company.status === 'REJECTED' && (
                                <button onClick={() => updateCompanyStatus(company.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Re-approve</button>
                              )}
                              {company.contentStatus !== 'LIVE' && (
                                <>
                                  {company.contentStatus === 'DRAFT' && <button onClick={() => updateCompanyContentStatus(company.id, 'IN_REVIEW')} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200">Mark Under Review</button>}
                                  {company.contentStatus === 'IN_REVIEW' && <button onClick={() => updateCompanyContentStatus(company.id, 'READY')} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Mark Intro Pending</button>}
                                  {(company.contentStatus === 'READY' || company.contentStatus === 'IN_REVIEW') && <button onClick={() => updateCompanyContentStatus(company.id, 'LIVE')} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Introduce Publicly</button>}
                                </>
                              )}
                              {company.contentStatus === 'LIVE' && (
                                <button onClick={() => updateCompanyContentStatus(company.id, 'READY')} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Withdraw</button>
                              )}
                              <button
                                onClick={() => updateCompanyFoundingStatus(company.id, !company.isFoundingProducer)}
                                className={`text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity ${
                                  company.isFoundingProducer
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {company.isFoundingProducer ? '★ Founding' : '☆ Set Founding'}
                              </button>
                              <button
                                onClick={() => deleteCompany(company.id, company.name)}
                                className="text-xs px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                                title={company._count?.products ? `${company._count.products} products must be removed first` : 'Delete company'}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-white border border-olive-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-olive-900">Portfolio Wines</h2>
                  <p className="text-sm text-olive-400 mt-0.5">
                    {WINES.length} wines · {products.filter((p) => WINES.some((w) => w.slug === p.slug || w.id === p.slug)).length} in DB · cross-referenced against product database
                  </p>
                </div>
                <button
                  onClick={importAllMissingWines}
                  disabled={importingAll}
                  className="text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 disabled:opacity-50 transition-colors"
                >
                  {importingAll ? 'Importing…' : 'Import All Missing'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-olive-200">
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Wine</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Producer</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Region</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Consumer Price</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Inventory</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">DB Status</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Editorial</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WINES.map((wine) => {
                      const dbProduct = products.find(
                        (p) => p.slug === wine.slug || p.slug === wine.id
                      )
                      const producer = PRODUCERS.find((p) => p.id === wine.producerId)
                      return (
                        <tr key={wine.id} className="border-b border-olive-100 last:border-0">
                          <td className="py-3 text-sm font-medium text-olive-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {wine.displayName}
                              {dbProduct?.isFeatured && <span className="text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 uppercase tracking-wider">Featured</span>}
                              {dbProduct?.isLimitedAllocation && <span className="text-[9px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 uppercase tracking-wider">Limited</span>}
                              {dbProduct?.isFoundingWine && <span className="text-[9px] font-medium text-olive-700 bg-olive-50 border border-olive-200 px-1.5 py-0.5 uppercase tracking-wider">Founding</span>}
                            </div>
                            <p className="text-[10px] text-olive-400 mt-0.5">{wine.type} · {wine.appellation ?? wine.region}</p>
                          </td>
                          <td className="py-3 text-sm text-olive-800">{producer?.name ?? wine.producerId}</td>
                          <td className="py-3 text-sm text-olive-600">{wine.region}</td>
                          <td className="py-3 text-sm font-medium text-olive-900 tabular-nums">
                            ${wine.consumerPurchasePriceUSD.toFixed(2)}
                          </td>
                          <td className="py-3 text-sm text-olive-600 tabular-nums">
                            {dbProduct ? dbProduct.inventory : <span className="text-olive-300 italic">—</span>}
                          </td>
                          <td className="py-3">
                            {dbProduct ? (
                              <span className={`badge badge-${dbProduct.status.toLowerCase()}`}>{dbProduct.status}</span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-200">
                                Not in DB
                              </span>
                            )}
                          </td>
                          <td className="py-3">
                            {dbProduct ? (
                              <span className={`text-[10px] font-medium px-2 py-0.5 ${contentStatusStyle(dbProduct.contentStatus ?? 'DRAFT')}`}>
                                {contentStatusLabel(dbProduct.contentStatus ?? 'DRAFT')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-olive-300 italic">—</span>
                            )}
                          </td>
                          <td className="py-3">
                            {dbProduct ? (
                              <div className="flex gap-1 flex-wrap">
                                {dbProduct.status === 'PENDING' && (
                                  <>
                                    <button onClick={() => updateProductStatus(dbProduct.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Approve</button>
                                    <button onClick={() => updateProductStatus(dbProduct.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">Reject</button>
                                  </>
                                )}
                                {dbProduct.status === 'APPROVED' && (
                                  <button onClick={() => updateProductStatus(dbProduct.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Revoke</button>
                                )}
                                {dbProduct.status === 'REJECTED' && (
                                  <button onClick={() => updateProductStatus(dbProduct.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Re-approve</button>
                                )}
                                {dbProduct.contentStatus !== 'LIVE' && (
                                  <>
                                    {dbProduct.contentStatus === 'DRAFT' && <button onClick={() => updateContentStatus(dbProduct.id, 'IN_REVIEW')} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200">Under Review</button>}
                                    {dbProduct.contentStatus === 'IN_REVIEW' && <button onClick={() => updateContentStatus(dbProduct.id, 'READY')} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Intro Pending</button>}
                                    {(dbProduct.contentStatus === 'READY' || dbProduct.contentStatus === 'IN_REVIEW') && <button onClick={() => updateContentStatus(dbProduct.id, 'LIVE')} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Go Live</button>}
                                  </>
                                )}
                                {dbProduct.contentStatus === 'LIVE' && (
                                  <button onClick={() => updateContentStatus(dbProduct.id, 'READY')} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Withdraw</button>
                                )}
                                <button onClick={() => editProduct(dbProduct)} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Edit</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => importWine(wine)}
                                disabled={importingWineId === wine.id || importingAll}
                                className="text-xs px-2 py-1 bg-olive-700 text-parchment-100 rounded hover:bg-olive-800 disabled:opacity-50"
                              >
                                {importingWineId === wine.id ? 'Importing…' : 'Import'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Restaurants Tab */}
          {activeTab === 'restaurants' && (
            <div className="space-y-6">
              <div className="bg-white border border-olive-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-olive-900">Restaurant Partners</h2>
                  <button
                    onClick={() => setShowNewRestaurantForm(!showNewRestaurantForm)}
                    className="text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors"
                  >
                    {showNewRestaurantForm ? 'Cancel' : '+ Add Restaurant'}
                  </button>
                </div>

                {showNewRestaurantForm && (
                  <div className="border border-olive-200 bg-parchment-50 p-5 mb-6">
                    <h3 className="text-sm font-semibold text-olive-900 mb-4">New Restaurant</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Name *</label>
                        <input className="input-field" value={newRestaurantForm.name}
                          onChange={(e) => {
                            const name = e.target.value
                            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                            setNewRestaurantForm((f) => ({ ...f, name, slug }))
                          }}
                        />
                      </div>
                      <div>
                        <label className="label">Slug *</label>
                        <input className="input-field" value={newRestaurantForm.slug}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, slug: e.target.value }))}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Address *</label>
                        <input className="input-field" value={newRestaurantForm.address}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, address: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">City *</label>
                        <input className="input-field" value={newRestaurantForm.city}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, city: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">Zip Code *</label>
                        <input className="input-field" value={newRestaurantForm.zipCode}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, zipCode: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">Cuisine Type</label>
                        <input className="input-field" placeholder="e.g. Italian, Wine Bar" value={newRestaurantForm.cuisineType}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, cuisineType: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">Price Range</label>
                        <input className="input-field" placeholder="e.g. $$, $$$" value={newRestaurantForm.priceRange}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, priceRange: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">Website</label>
                        <input className="input-field" placeholder="https://" value={newRestaurantForm.website}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, website: e.target.value }))}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Description</label>
                        <textarea className="input-field" rows={2} value={newRestaurantForm.description}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button onClick={createRestaurant} className="mt-4 text-sm px-5 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors">
                      Create Restaurant
                    </button>
                  </div>
                )}

                {/* Wine assignment panel */}
                {assignWinePanel && (
                  <div className="border border-amber-200 bg-amber-50 p-5 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-olive-900">Assign Wine to: {assignWinePanel.restaurantName}</h3>
                      <button onClick={() => setAssignWinePanel(null)} className="text-xs text-olive-500 hover:text-olive-800">✕ Close</button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="label">Wine / Product *</label>
                        <select className="input-field" value={wineAssignForm.productId}
                          onChange={(e) => setWineAssignForm((f) => ({ ...f, productId: e.target.value }))}
                        >
                          <option value="">Select a wine…</option>
                          {products.filter((p) => p.category === 'WINE' || p.category === 'OLIVE_OIL').map((p) => (
                            <option key={p.id} value={p.id}>{p.name} — {p.company.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Serving Type *</label>
                        <select className="input-field" value={wineAssignForm.servingType}
                          onChange={(e) => setWineAssignForm((f) => ({ ...f, servingType: e.target.value }))}
                        >
                          <option value="BOTTLE_LIST">Bottle List</option>
                          <option value="BY_GLASS">By the Glass</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Notes (optional)</label>
                        <input className="input-field" placeholder="Sommelier note…" value={wineAssignForm.notes}
                          onChange={(e) => setWineAssignForm((f) => ({ ...f, notes: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button onClick={assignWine} className="mt-3 text-sm px-4 py-1.5 bg-amber-600 text-white hover:bg-amber-700 transition-colors">
                      Assign Wine
                    </button>
                  </div>
                )}

                {/* Restaurant table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-olive-200">
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Name</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Location</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Wines</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Editorial</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurants.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-sm text-olive-500">
                            No restaurants yet. Add one above.
                          </td>
                        </tr>
                      )}
                      {restaurants.map((r) => (
                        <tr key={r.id} className="border-b border-olive-100">
                          <td className="py-3 text-sm font-medium text-olive-900">
                            <div className="flex items-center gap-2">
                              {r.name}
                              {r.isFeatured && (
                                <span className="text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 uppercase tracking-wider">Featured</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-sm text-olive-600">{r.city}, {r.state}</td>
                          <td className="py-3 text-sm text-olive-600">
                            <div className="space-y-0.5">
                              {r.wines.slice(0, 2).map((w) => (
                                <div key={w.id} className="flex items-center gap-1.5">
                                  <span className="text-xs text-olive-700">{w.product.name}</span>
                                  <span className="text-[10px] text-olive-400">
                                    {w.servingType === 'BY_GLASS' ? '🍷 Glass' : '🍾 Bottle'}
                                  </span>
                                  <button
                                    onClick={() => removeWine(r.id, w.product.id)}
                                    className="text-[10px] text-red-400 hover:text-red-600 ml-1"
                                    title="Remove"
                                  >✕</button>
                                </div>
                              ))}
                              {r.wines.length > 2 && (
                                <span className="text-xs text-olive-400">+{r.wines.length - 2} more</span>
                              )}
                              {r.wines.length === 0 && (
                                <span className="text-xs text-olive-400 italic">no wines</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                          </td>
                          <td className="py-3">
                            <span className={`text-[10px] font-medium px-2 py-0.5 ${contentStatusStyle(r.contentStatus ?? 'DRAFT')}`}>
                              {contentStatusLabel(r.contentStatus ?? 'DRAFT')}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1 flex-wrap">
                              {r.status === 'PENDING' && (
                                <>
                                  <button onClick={() => updateRestaurantStatus(r.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Approve</button>
                                  <button onClick={() => updateRestaurantStatus(r.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">Reject</button>
                                </>
                              )}
                              {r.contentStatus !== 'LIVE' && (
                                <>
                                  {r.contentStatus === 'DRAFT' && <button onClick={() => updateRestaurantContentStatus(r.id, 'IN_REVIEW')} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200">Under Review</button>}
                                  {r.contentStatus === 'IN_REVIEW' && <button onClick={() => updateRestaurantContentStatus(r.id, 'READY')} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Intro Pending</button>}
                                  {(r.contentStatus === 'READY' || r.contentStatus === 'IN_REVIEW') && <button onClick={() => updateRestaurantContentStatus(r.id, 'LIVE')} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Publish</button>}
                                </>
                              )}
                              {r.contentStatus === 'LIVE' && (
                                <button onClick={() => updateRestaurantContentStatus(r.id, 'READY')} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Unpublish</button>
                              )}
                              <button
                                onClick={() => toggleRestaurantFeatured(r.id, !r.isFeatured)}
                                className={`text-xs px-2 py-1 rounded hover:opacity-80 ${r.isFeatured ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}
                              >
                                {r.isFeatured ? '★ Featured' : '☆ Feature'}
                              </button>
                              <button
                                onClick={() => setAssignWinePanel({ restaurantId: r.id, restaurantName: r.name })}
                                className="text-xs px-2 py-1 bg-olive-100 text-olive-800 rounded hover:bg-olive-200"
                              >
                                + Wine
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Fulfillment Tab */}
          {activeTab === 'fulfillment' && (
            <div className="space-y-6">
              {/* Sub-tab bar */}
              <div className="flex gap-2 border-b border-olive-200">
                {([
                  { key: 'zones', label: 'Delivery Zones' },
                  { key: 'routes', label: 'Delivery Routes' },
                  { key: 'schedules', label: 'Pickup Schedules' },
                ] as const).map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setFulfillmentSubTab(st.key)}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                      fulfillmentSubTab === st.key
                        ? 'text-olive-900 border-b-2 border-olive-700'
                        : 'text-olive-600 hover:text-olive-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Delivery Zones sub-tab */}
              {fulfillmentSubTab === 'zones' && (
                <div className="bg-white border border-olive-200 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-olive-900">Delivery Zones</h2>
                    <p className="text-sm text-olive-400">Enable or disable zones to control checkout availability</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-olive-200">
                          <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Zone Name</th>
                          <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Code</th>
                          <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Description</th>
                          <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                          <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryZones.length === 0 && (
                          <tr><td colSpan={5} className="py-8 text-center text-sm text-olive-500">No zones found.</td></tr>
                        )}
                        {deliveryZones.map((zone) => (
                          <tr key={zone.id} className="border-b border-olive-100">
                            <td className="py-3 text-sm font-medium text-olive-900">{zone.name}</td>
                            <td className="py-3 text-xs font-mono text-olive-600">{zone.code}</td>
                            <td className="py-3 text-sm text-olive-600 max-w-xs">{zone.description || <span className="italic text-olive-400">—</span>}</td>
                            <td className="py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 ${zone.isActive ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                {zone.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => toggleZoneActive(zone.id, !zone.isActive)}
                                className={`text-xs px-3 py-1 rounded hover:opacity-80 transition-opacity ${zone.isActive ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}
                              >
                                {zone.isActive ? 'Disable' : 'Enable'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Delivery Routes sub-tab */}
              {fulfillmentSubTab === 'routes' && (
                <div className="bg-white border border-olive-200 p-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-base font-semibold text-olive-900">Delivery Routes</h2>
                      <p className="text-sm text-olive-400">Assign delivery days to zones</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-olive-200">
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Zone</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Delivery Day</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliveryRoutes.length === 0 && (
                            <tr><td colSpan={4} className="py-8 text-center text-sm text-olive-500">No routes found.</td></tr>
                          )}
                          {deliveryRoutes.map((route) => (
                            <tr key={route.id} className="border-b border-olive-100">
                              <td className="py-3 text-sm font-medium text-olive-900">{route.zone.name}</td>
                              <td className="py-3 text-sm text-olive-800">{route.deliveryDayName}</td>
                              <td className="py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 ${route.isActive ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                  {route.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => toggleRouteActive(route.id, !route.isActive)}
                                    className={`text-xs px-2 py-1 rounded hover:opacity-80 ${route.isActive ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'}`}
                                  >
                                    {route.isActive ? 'Pause' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => deleteRoute(route.id)}
                                    className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:opacity-80"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Add new route */}
                  <div className="border border-olive-200 bg-parchment-50 p-4">
                    <h3 className="text-sm font-semibold text-olive-900 mb-3">Add Delivery Route</h3>
                    <div className="flex gap-3 flex-wrap items-end">
                      <div>
                        <label className="label">Zone</label>
                        <select className="input-field" value={newRouteForm.zoneId} onChange={(e) => setNewRouteForm((f) => ({ ...f, zoneId: e.target.value }))}>
                          <option value="">Select zone…</option>
                          {deliveryZones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Delivery Day</label>
                        <select className="input-field" value={newRouteForm.deliveryDay} onChange={(e) => setNewRouteForm((f) => ({ ...f, deliveryDay: e.target.value }))}>
                          <option value="">Select day…</option>
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                            <option key={i} value={i}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={createRoute} className="text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors">
                        Add Route
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pickup Schedules sub-tab */}
              {fulfillmentSubTab === 'schedules' && (
                <div className="bg-white border border-olive-200 p-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-base font-semibold text-olive-900">Pickup Schedules</h2>
                      <p className="text-sm text-olive-400">Configure pickup days per location</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-olive-200">
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Location</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Pickup Day</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pickupSchedules.length === 0 && (
                            <tr><td colSpan={4} className="py-8 text-center text-sm text-olive-500">No schedules found.</td></tr>
                          )}
                          {pickupSchedules.map((sched) => (
                            <tr key={sched.id} className="border-b border-olive-100">
                              <td className="py-3 text-sm font-medium text-olive-900">{sched.location.name}</td>
                              <td className="py-3 text-sm text-olive-800">{sched.pickupDayName}</td>
                              <td className="py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 ${sched.isActive ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                  {sched.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => toggleScheduleActive(sched.id, !sched.isActive)}
                                    className={`text-xs px-2 py-1 rounded hover:opacity-80 ${sched.isActive ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'}`}
                                  >
                                    {sched.isActive ? 'Pause' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => deleteSchedule(sched.id)}
                                    className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:opacity-80"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Add new schedule */}
                  <div className="border border-olive-200 bg-parchment-50 p-4">
                    <h3 className="text-sm font-semibold text-olive-900 mb-3">Add Pickup Schedule</h3>
                    <div className="flex gap-3 flex-wrap items-end">
                      <div>
                        <label className="label">Location</label>
                        <select className="input-field" value={newScheduleForm.locationId} onChange={(e) => setNewScheduleForm((f) => ({ ...f, locationId: e.target.value }))}>
                          <option value="">Select location…</option>
                          {pickupLocationsList.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Pickup Day</label>
                        <select className="input-field" value={newScheduleForm.pickupDay} onChange={(e) => setNewScheduleForm((f) => ({ ...f, pickupDay: e.target.value }))}>
                          <option value="">Select day…</option>
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                            <option key={i} value={i}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={createSchedule} className="text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors">
                        Add Schedule
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Portfolio Pricing Tab */}
          {activeTab === 'portfolio-pricing' && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-amber-600 mb-1">Internal Use Only · Not visible to consumers</p>
                <h2 className="text-2xl font-serif font-bold text-olive-900 mb-1">Portfolio Pricing</h2>
                <p className="text-sm text-olive-500">Full distribution chain economics for all 21 portfolio wines. Consumers see only the final marketplace price.</p>
              </div>

              {/* Chain legend */}
              <div className="flex flex-wrap gap-3 text-[10px] font-medium uppercase tracking-wider">
                {[
                  { label: 'EUR Cost', color: 'text-olive-400' },
                  { label: 'USD Cost', color: 'text-olive-400' },
                  { label: 'Importer Sell', color: 'text-olive-600' },
                  { label: 'Distributor', color: 'text-olive-600' },
                  { label: 'Retail Est.', color: 'text-olive-700' },
                  { label: 'Restaurant', color: 'text-olive-600' },
                  { label: 'Consumer ✓', color: 'text-amber-700 font-bold' },
                ].map((col) => (
                  <span key={col.label} className={`${col.color} border border-olive-200 px-2 py-0.5 bg-parchment-50`}>{col.label}</span>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-olive-300 text-left">
                      <th className="py-3 pr-4 text-[10px] font-medium text-olive-600 uppercase tracking-wider">Wine</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">EUR Cost</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">USD Cost</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Importer Sell</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Distributor</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-600 uppercase tracking-wider">Retail Est.</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Restaurant</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-amber-700 uppercase tracking-wider">Consumer ✓</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WINES.map((wine) => {
                      const producer = PRODUCERS.find((p) => p.id === wine.producerId)
                      return (
                        <tr key={wine.id} className="border-b border-parchment-200 hover:bg-parchment-50 transition-colors">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-olive-900 leading-tight">{wine.displayName}</p>
                            <p className="text-[10px] text-olive-400 mt-0.5">{producer?.name} · {wine.region}</p>
                          </td>
                          <td className="py-3 px-3 text-olive-400 tabular-nums">€{wine.internalWholesalePriceEUR.toFixed(2)}</td>
                          <td className="py-3 px-3 text-olive-400 tabular-nums">${wine.costUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 text-olive-600 tabular-nums">${wine.importerSellPriceUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 text-olive-600 tabular-nums">${wine.distributorWholesalePriceUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 text-olive-700 tabular-nums font-medium">${wine.retailEstimatedPriceUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 text-olive-600 tabular-nums">${wine.restaurantBottlePriceUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 text-amber-700 tabular-nums font-semibold">${wine.consumerPurchasePriceUSD.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-olive-300">
                      <td className="py-3 pr-4 text-[10px] font-medium text-olive-500 uppercase tracking-wider">
                        {WINES.length} wines · Multiplier chain: ×1.35 → ×1.30 → ×1.45 → ×2.7
                      </td>
                      <td colSpan={7} className="py-3 px-3 text-[10px] text-olive-400">
                        FX rate EUR/USD = 1.08 · Price bands: $15 $18 $20 $22 $25 $28 $32 $36 $40 $45 $55 $60
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
