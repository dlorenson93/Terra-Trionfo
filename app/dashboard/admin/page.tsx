'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

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
}

interface Product {
  id: string
  name: string
  category: string
  retailPriceCents: number
  status: string
  contentStatus: string
  commerceModel: 'MARKETPLACE' | 'WHOLESALE' | 'HYBRID'
  listingOwner: 'VENDOR' | 'TERRA'
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

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'products' | 'restaurants'>('overview')
  const [showNewRestaurantForm, setShowNewRestaurantForm] = useState(false)
  const [newRestaurantForm, setNewRestaurantForm] = useState({
    name: '', slug: '', address: '', city: '', state: 'MA', zipCode: '',
    website: '', cuisineType: '', priceRange: '', description: '',
  })
  const [assignWinePanel, setAssignWinePanel] = useState<{ restaurantId: string; restaurantName: string } | null>(null)
  const [wineAssignForm, setWineAssignForm] = useState({ productId: '', servingType: 'BOTTLE_LIST', notes: '' })

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
    try {
      const [statsRes, companiesRes, productsRes, restaurantsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/companies'),
        fetch('/api/products'),
        fetch('/api/restaurants'),
      ])

      setStats(await statsRes.json())
      const companiesData = await companiesRes.json()
      setCompanies(Array.isArray(companiesData) ? companiesData : [])
      const productsData = await productsRes.json()
      setProducts(Array.isArray(productsData) ? productsData : [])
      const restaurantsData = await restaurantsRes.json()
      setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
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

  const editProduct = async (prod: Product) => {
    const commerceModel = prompt('Commerce model (MARKETPLACE/WHOLESALE/HYBRID)', prod.commerceModel)
    const listingOwner = prompt('Listing owner (VENDOR/TERRA)', prod.listingOwner)
    const priceStr = prompt('Retail price (dollars)', (prod.retailPriceCents / 100).toFixed(2))
    if (!commerceModel || !listingOwner || !priceStr) return
    const retailPriceCents = Math.round(parseFloat(priceStr) * 100)
    try {
      await fetch(`/api/products/${prod.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commerceModel, listingOwner, retailPriceCents }),
      })
      fetchData()
    } catch (error) {
      console.error('Error editing product:', error)
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
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-parchment-50">
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-serif font-bold text-olive-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-olive-700">Manage vendors, products, and orders</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Tabs */}
          <div className="mb-8 border-b border-olive-200">
            {/* Consumer Marketplace Operations */}
            <div className="flex items-center gap-1 mb-0">
              <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-olive-400 px-1 pb-1">Consumer Marketplace</span>
              <div className="flex gap-1">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'companies', label: 'Companies' },
                  { key: 'products', label: 'Products' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-3 font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-olive-900 border-b-2 border-olive-700'
                        : 'text-olive-600 hover:text-olive-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Divider */}
              <div className="w-px h-6 bg-olive-300 mx-2 self-center" />
              <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-olive-400 px-1 pb-1">Trade Distribution</span>
              <div className="flex gap-1">
                {[
                  { key: 'restaurants', label: 'Restaurants' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-3 font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-olive-900 border-b-2 border-olive-700'
                        : 'text-olive-600 hover:text-olive-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card p-6">
                  <h3 className="text-sm font-medium text-olive-600 mb-2">
                    Total Vendors
                  </h3>
                  <p className="text-3xl font-bold text-olive-900">
                    {stats.totalVendors}
                  </p>
                  {stats.pendingCompanies > 0 && (
                    <p className="text-sm text-yellow-700 mt-2">
                      {stats.pendingCompanies} pending approval
                    </p>
                  )}
                </div>

                <div className="card p-6">
                  <h3 className="text-sm font-medium text-olive-600 mb-2">
                    Total Products
                  </h3>
                  <p className="text-3xl font-bold text-olive-900">
                    {stats.totalProducts}
                  </p>
                  {stats.pendingProducts > 0 && (
                    <p className="text-sm text-yellow-700 mt-2">
                      {stats.pendingProducts} pending approval
                    </p>
                  )}
                </div>

                <div className="card p-6">
                  <h3 className="text-sm font-medium text-olive-600 mb-2">
                    Total Orders
                  </h3>
                  <p className="text-3xl font-bold text-olive-900">
                    {stats.totalOrders}
                  </p>
                </div>

                <div className="card p-6">
                  <h3 className="text-sm font-medium text-olive-600 mb-2">
                    Total Revenue
                  </h3>
                  <p className="text-3xl font-bold text-olive-900">
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="card p-6">
                <h2 className="text-xl font-serif font-bold text-olive-900 mb-4">
                  Recent Orders
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-olive-200">
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Order ID
                        </th>
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Customer
                        </th>
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Total
                        </th>
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Status
                        </th>
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(stats.recentOrders) ? stats.recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-olive-100">
                          <td className="py-3 text-sm text-olive-800">
                            {order.id.slice(0, 8)}
                          </td>
                          <td className="py-3 text-sm text-olive-800">
                            {order.user.name}
                          </td>
                          <td className="py-3 text-sm text-olive-800">
                            ${order.total.toFixed(2)}
                          </td>
                          <td className="py-3">
                            <span className={`badge badge-${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-olive-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-olive-900">Manage Companies</h2>
                <p className="text-sm text-olive-500">Content status controls public producer visibility</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-olive-200">
                      <th className="pb-3 text-sm font-medium text-olive-700">Company Name</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Owner</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Email</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Status</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Editorial State</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(companies) ? companies.map((company) => (
                      <tr key={company.id} className="border-b border-olive-100">
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
                          </div>
                        </td>
                      </tr>
                    )) : null}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-olive-900">Manage Products</h2>
                <p className="text-sm text-olive-500">Content status controls public visibility</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-olive-200">
                      <th className="pb-3 text-sm font-medium text-olive-700">Product Name</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Company</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Category</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Retail</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Status</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Content</th>
                      <th className="pb-3 text-sm font-medium text-olive-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(products) ? products.map((product) => (
                      <tr key={product.id} className="border-b border-olive-100">
                        <td className="py-3 text-sm font-medium text-olive-900">{product.name}</td>
                        <td className="py-3 text-sm text-olive-800">{product.company.name}</td>
                        <td className="py-3 text-sm text-olive-600">{product.category}</td>
                        <td className="py-3 text-sm text-olive-800">${(product.retailPriceCents / 100).toFixed(2)}</td>
                        <td className="py-3">
                          <span className={`badge badge-${product.status.toLowerCase()}`}>{product.status}</span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 ${contentStatusStyle(product.contentStatus ?? 'DRAFT')}`}>
                            {contentStatusLabel(product.contentStatus ?? 'DRAFT')}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1 flex-wrap">
                            {product.status === 'PENDING' && (
                              <>
                                <button onClick={() => updateProductStatus(product.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Approve</button>
                                <button onClick={() => updateProductStatus(product.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">Reject</button>
                              </>
                            )}
                            {product.contentStatus !== 'LIVE' && (
                              <>
                                {product.contentStatus === 'DRAFT' && <button onClick={() => updateContentStatus(product.id, 'IN_REVIEW')} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200">Mark Under Review</button>}
                                {product.contentStatus === 'IN_REVIEW' && <button onClick={() => updateContentStatus(product.id, 'READY')} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Mark Intro Pending</button>}
                                {(product.contentStatus === 'READY' || product.contentStatus === 'IN_REVIEW') && <button onClick={() => updateContentStatus(product.id, 'LIVE')} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Introduce Publicly</button>}
                              </>
                            )}
                            {product.contentStatus === 'LIVE' && (
                              <button onClick={() => updateContentStatus(product.id, 'READY')} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Withdraw</button>
                            )}
                            <button onClick={() => editProduct(product)} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Edit</button>
                          </div>
                        </td>
                      </tr>
                    )) : null}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <p className="text-center text-olive-600 py-8">No products</p>
                )}
              </div>
            </div>
          )}
          {/* Restaurants Tab */}
          {activeTab === 'restaurants' && (
            <div className="space-y-6">

              {/* Create new restaurant */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold text-olive-900">Restaurant Partners</h2>
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
                        <th className="pb-3 text-sm font-medium text-olive-700">Name</th>
                        <th className="pb-3 text-sm font-medium text-olive-700">Location</th>
                        <th className="pb-3 text-sm font-medium text-olive-700">Wines</th>
                        <th className="pb-3 text-sm font-medium text-olive-700">Status</th>
                        <th className="pb-3 text-sm font-medium text-olive-700">Editorial</th>
                        <th className="pb-3 text-sm font-medium text-olive-700">Actions</th>
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
        </div>
      </main>

      <Footer />
    </div>
  )
}
