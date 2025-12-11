'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface Company {
  id: string
  name: string
  contactEmail: string
  phone?: string
  address?: string
  description?: string
  status: string
}

interface Product {
  id: string
  name: string
  category: string
  consumerPrice: number
  inventory: number
  status: string
  isMarketplace: boolean
  isWholesale: boolean
}

export default function VendorDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'company' | 'products' | 'new-product'>('company')
  const [company, setCompany] = useState<Company | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  // Company form
  const [companyForm, setCompanyForm] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    address: '',
    description: '',
  })

  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    imageUrl: '',
    isMarketplace: false,
    isWholesale: false,
    basePrice: '',
    wholesaleCost: '',
    consumerPrice: '',
    inventory: '',
  })

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'VENDOR') {
      router.push('/')
      return
    }
    fetchData()
  }, [session])

  const fetchData = async () => {
    try {
      const [companiesRes, productsRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/products'),
      ])
      const companies = await companiesRes.json()
      const products = await productsRes.json()
      
      if (companies.length > 0) {
        const myCompany = companies[0]
        setCompany(myCompany)
        setCompanyForm({
          name: myCompany.name,
          contactEmail: myCompany.contactEmail,
          phone: myCompany.phone || '',
          address: myCompany.address || '',
          description: myCompany.description || '',
        })
      }
      setProducts(products)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = company ? `/api/companies/${company.id}` : '/api/companies'
      const method = company ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyForm),
      })

      if (!response.ok) {
        throw new Error('Failed to save company')
      }

      alert(company ? 'Company updated!' : 'Company registered! Awaiting approval.')
      fetchData()
    } catch (error) {
      alert('Failed to save company')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) {
      alert('Please register your company first')
      return
    }
    if (company.status !== 'APPROVED') {
      alert('Your company must be approved before adding products')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          companyId: company.id,
          basePrice: productForm.basePrice ? parseFloat(productForm.basePrice) : null,
          wholesaleCost: productForm.wholesaleCost ? parseFloat(productForm.wholesaleCost) : null,
          consumerPrice: productForm.consumerPrice ? parseFloat(productForm.consumerPrice) : null,
          inventory: parseInt(productForm.inventory) || 0,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create product')
      }

      alert('Product created! Awaiting approval.')
      setProductForm({
        name: '',
        description: '',
        category: '',
        imageUrl: '',
        isMarketplace: false,
        isWholesale: false,
        basePrice: '',
        wholesaleCost: '',
        consumerPrice: '',
        inventory: '',
      })
      setActiveTab('products')
      fetchData()
    } catch (error: any) {
      alert(error.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  if (!session || session.user.role !== 'VENDOR') {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-parchment-50">
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-serif font-bold text-olive-900 mb-2">
              Vendor Dashboard
            </h1>
            <p className="text-olive-700">Manage your company and products</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-olive-200">
            {[
              { key: 'company', label: 'Company Profile' },
              { key: 'products', label: 'My Products' },
              { key: 'new-product', label: 'Add Product' },
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

          {/* Company Tab */}
          {activeTab === 'company' && (
            <div className="max-w-2xl">
              <div className="card p-8">
                <h2 className="text-2xl font-serif font-bold text-olive-900 mb-6">
                  {company ? 'Update Company Profile' : 'Register Your Company'}
                </h2>

                {company && (
                  <div className="mb-6 p-4 bg-parchment-100 rounded-lg">
                    <p className="text-sm text-olive-700 mb-1">Status:</p>
                    <span
                      className={`badge badge-${company.status.toLowerCase()}`}
                    >
                      {company.status}
                    </span>
                    {company.status === 'PENDING' && (
                      <p className="text-sm text-olive-600 mt-2">
                        Your company is awaiting admin approval
                      </p>
                    )}
                  </div>
                )}

                <form onSubmit={handleCompanySubmit} className="space-y-6">
                  <div>
                    <label className="label">Company Name *</label>
                    <input
                      type="text"
                      value={companyForm.name}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, name: e.target.value })
                      }
                      required
                      className="input-field"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <label className="label">Contact Email *</label>
                    <input
                      type="email"
                      value={companyForm.contactEmail}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, contactEmail: e.target.value })
                      }
                      required
                      className="input-field"
                      placeholder="contact@company.com"
                    />
                  </div>

                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      value={companyForm.phone}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, phone: e.target.value })
                      }
                      className="input-field"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="label">Address</label>
                    <input
                      type="text"
                      value={companyForm.address}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, address: e.target.value })
                      }
                      className="input-field"
                      placeholder="123 Farm Lane, City, State"
                    />
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <textarea
                      value={companyForm.description}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, description: e.target.value })
                      }
                      rows={4}
                      className="input-field"
                      placeholder="Tell us about your company..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : company ? 'Update Company' : 'Register Company'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="card p-6">
              <h2 className="text-2xl font-serif font-bold text-olive-900 mb-6">
                My Products
              </h2>

              {products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-olive-600 mb-4">No products yet</p>
                  <button
                    onClick={() => setActiveTab('new-product')}
                    className="btn-primary"
                  >
                    Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-olive-200">
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Product Name
                        </th>
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Category
                        </th>
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Price
                        </th>
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Inventory
                        </th>
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Model
                        </th>
                        <th className="pb-3 text-sm font-medium text-olive-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-olive-100">
                          <td className="py-3 text-sm font-medium text-olive-900">
                            {product.name}
                          </td>
                          <td className="py-3 text-sm text-olive-600">
                            {product.category}
                          </td>
                          <td className="py-3 text-sm text-olive-800">
                            ${product.consumerPrice.toFixed(2)}
                          </td>
                          <td className="py-3 text-sm text-olive-800">
                            {product.inventory}
                          </td>
                          <td className="py-3 text-xs">
                            <div className="flex gap-1">
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
                          </td>
                          <td className="py-3">
                            <span
                              className={`badge badge-${product.status.toLowerCase()}`}
                            >
                              {product.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* New Product Tab */}
          {activeTab === 'new-product' && (
            <div className="max-w-2xl">
              <div className="card p-8">
                <h2 className="text-2xl font-serif font-bold text-olive-900 mb-6">
                  Add New Product
                </h2>

                {!company && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
                    Please register your company first
                  </div>
                )}

                {company && company.status !== 'APPROVED' && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
                    Your company must be approved before adding products
                  </div>
                )}

                <form onSubmit={handleProductSubmit} className="space-y-6">
                  <div>
                    <label className="label">Product Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      required
                      className="input-field"
                      placeholder="Product Name"
                    />
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({ ...productForm, description: e.target.value })
                      }
                      rows={3}
                      className="input-field"
                      placeholder="Product description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Category *</label>
                      <select
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({ ...productForm, category: e.target.value })
                        }
                        required
                        className="input-field"
                      >
                        <option value="">Select category</option>
                        <option value="Oils & Vinegars">Oils & Vinegars</option>
                        <option value="Wines">Wines</option>
                        <option value="Pasta & Grains">Pasta & Grains</option>
                        <option value="Canned Goods">Canned Goods</option>
                        <option value="Specialty">Specialty</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Inventory *</label>
                      <input
                        type="number"
                        value={productForm.inventory}
                        onChange={(e) =>
                          setProductForm({ ...productForm, inventory: e.target.value })
                        }
                        required
                        min="0"
                        className="input-field"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Image URL</label>
                    <input
                      type="url"
                      value={productForm.imageUrl}
                      onChange={(e) =>
                        setProductForm({ ...productForm, imageUrl: e.target.value })
                      }
                      className="input-field"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="border-t border-olive-200 pt-6">
                    <h3 className="font-semibold text-olive-900 mb-4">
                      Business Model *
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.isMarketplace}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              isMarketplace: e.target.checked,
                            })
                          }
                          className="mt-1"
                        />
                        <div>
                          <span className="font-medium text-olive-900">
                            Marketplace
                          </span>
                          <p className="text-sm text-olive-600">
                            List your product, set your base price
                          </p>
                        </div>
                      </label>

                      {productForm.isMarketplace && (
                        <div className="ml-7">
                          <label className="label">Base Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={productForm.basePrice}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                basePrice: e.target.value,
                              })
                            }
                            className="input-field"
                            placeholder="0.00"
                          />
                        </div>
                      )}

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.isWholesale}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              isWholesale: e.target.checked,
                            })
                          }
                          className="mt-1"
                        />
                        <div>
                          <span className="font-medium text-olive-900">
                            Wholesale
                          </span>
                          <p className="text-sm text-olive-600">
                            We purchase and manage retail
                          </p>
                        </div>
                      </label>

                      {productForm.isWholesale && (
                        <div className="ml-7">
                          <label className="label">Wholesale Cost ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={productForm.wholesaleCost}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                wholesaleCost: e.target.value,
                              })
                            }
                            className="input-field"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !company || company.status !== 'APPROVED'}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Product'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
