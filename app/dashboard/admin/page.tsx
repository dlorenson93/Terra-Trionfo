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
  owner: { name: string }
  createdAt: string
}

interface Product {
  id: string
  name: string
  category: string
  consumerPrice: number
  status: string
  isMarketplace: boolean
  isWholesale: boolean
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
        fetch('/api/products?status=PENDING'),
      ])

      setStats(await statsRes.json())
      setCompanies(await companiesRes.json())
      setProducts(await productsRes.json())
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

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

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
                      {stats.recentOrders.map((order) => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div className="card p-6">
              <h2 className="text-xl font-serif font-bold text-olive-900 mb-4">
                Manage Companies
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-olive-200">
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Company Name
                      </th>
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Owner
                      </th>
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Email
                      </th>
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Status
                      </th>
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="border-b border-olive-100">
                        <td className="py-3 text-sm font-medium text-olive-900">
                          {company.name}
                        </td>
                        <td className="py-3 text-sm text-olive-800">
                          {company.owner.name}
                        </td>
                        <td className="py-3 text-sm text-olive-600">
                          {company.contactEmail}
                        </td>
                        <td className="py-3">
                          <span
                            className={`badge badge-${company.status.toLowerCase()}`}
                          >
                            {company.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {company.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  updateCompanyStatus(company.id, 'APPROVED')
                                }
                                className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  updateCompanyStatus(company.id, 'REJECTED')
                                }
                                className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="card p-6">
              <h2 className="text-xl font-serif font-bold text-olive-900 mb-4">
                Manage Products (Pending Approval)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-olive-200">
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Product Name
                      </th>
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Company
                      </th>
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Category
                      </th>
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Price
                      </th>
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Model
                      </th>
                      <th className="pb-3 text-sm font-medium text-olive-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-olive-100">
                        <td className="py-3 text-sm font-medium text-olive-900">
                          {product.name}
                        </td>
                        <td className="py-3 text-sm text-olive-800">
                          {product.company.name}
                        </td>
                        <td className="py-3 text-sm text-olive-600">
                          {product.category}
                        </td>
                        <td className="py-3 text-sm text-olive-800">
                          ${product.consumerPrice.toFixed(2)}
                        </td>
                        <td className="py-3 text-xs">
                          <div className="flex gap-1">
                            {product.isMarketplace && (
                              <span className="badge bg-olive-100 text-olive-700">
                                M
                              </span>
                            )}
                            {product.isWholesale && (
                              <span className="badge bg-parchment-400 text-olive-800">
                                W
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                updateProductStatus(product.id, 'APPROVED')
                              }
                              className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                updateProductStatus(product.id, 'REJECTED')
                              }
                              className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <p className="text-center text-olive-600 py-8">
                    No products pending approval
                  </p>
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
