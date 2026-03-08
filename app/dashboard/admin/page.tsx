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

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'products'>('overview')

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
      const [statsRes, companiesRes, productsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/companies'),
        fetch('/api/products'),  // admin sees all products
      ])

      setStats(await statsRes.json())
      const companiesData = await companiesRes.json()
      setCompanies(Array.isArray(companiesData) ? companiesData : [])
      const productsData = await productsRes.json()
      setProducts(Array.isArray(productsData) ? productsData : [])
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
          <div className="flex gap-4 mb-8 border-b border-olive-200">
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
        </div>
      </main>

      <Footer />
    </div>
  )
}
