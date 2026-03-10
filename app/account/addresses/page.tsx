'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface Address {
  id: string
  label: string
  address1: string
  address2?: string | null
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

const EMPTY: Omit<Address, 'id' | 'isDefault'> = {
  label: 'Home',
  address1: '',
  address2: '',
  city: '',
  state: 'MA',
  zipCode: '',
}

export default function AddressesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Address, 'id' | 'isDefault'>>({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    loadAddresses()
  }, [session])

  const loadAddresses = async () => {
    setLoading(true)
    const res = await fetch('/api/account/addresses')
    const data = await res.json()
    setAddresses(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const handleEdit = (addr: Address) => {
    setEditId(addr.id)
    setForm({
      label: addr.label,
      address1: addr.address1,
      address2: addr.address2 ?? '',
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
    })
    setShowForm(true)
    setError('')
  }

  const handleNew = () => {
    setEditId(null)
    setForm({ ...EMPTY })
    setShowForm(true)
    setError('')
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditId(null)
    setError('')
  }

  const handleSave = async () => {
    if (!form.address1 || !form.city || !form.state || !form.zipCode) {
      setError('Street address, city, state, and zip code are required.')
      return
    }
    setSaving(true)
    setError('')

    const url = editId ? `/api/account/addresses/${editId}` : '/api/account/addresses'
    const method = editId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to save address.')
      return
    }

    await loadAddresses()
    setShowForm(false)
    setEditId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this address?')) return
    await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
    await loadAddresses()
  }

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/account/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    })
    await loadAddresses()
  }

  if (!session) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="bg-gradient-to-br from-parchment-100 to-parchment-200 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/account"
              className="text-[10px] uppercase tracking-widest text-olive-400 hover:text-olive-700 transition-colors inline-flex items-center gap-1 mb-4"
            >
              ← My Account
            </Link>
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-2">
              Delivery
            </p>
            <h1 className="text-3xl font-serif font-bold text-olive-900">Saved Addresses</h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-10">
          <p className="text-xs text-olive-500 mb-6 leading-relaxed">
            Saved addresses are used for Terra Trionfo local delivery in Massachusetts.
            Delivery is available in select regions on scheduled days.
          </p>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-olive-700" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Address list */}
              {addresses.length === 0 && !showForm && (
                <div className="text-center py-14 border border-dashed border-parchment-300">
                  <p className="text-sm text-olive-500 mb-4">No saved addresses yet.</p>
                  <button onClick={handleNew} className="btn-primary text-sm">
                    Add Address
                  </button>
                </div>
              )}

              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`border p-5 flex flex-col sm:flex-row sm:items-start gap-4 ${
                    addr.isDefault ? 'border-olive-400 bg-olive-50/40' : 'border-parchment-200 bg-white'
                  }`}
                >
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-olive-500">
                        {addr.label}
                      </p>
                      {addr.isDefault && (
                        <span className="text-[9px] uppercase tracking-wider text-olive-600 bg-olive-100 border border-olive-200 px-1.5 py-0.5">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-olive-900">
                      {addr.address1}
                      {addr.address2 ? `, ${addr.address2}` : ''}
                    </p>
                    <p className="text-sm text-olive-600">
                      {addr.city}, {addr.state} {addr.zipCode}
                    </p>
                  </div>
                  <div className="flex gap-3 text-[10px] uppercase tracking-wider shrink-0">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-olive-500 hover:text-olive-800 transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(addr)}
                      className="text-olive-500 hover:text-olive-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Add new button */}
              {addresses.length > 0 && !showForm && (
                <button
                  onClick={handleNew}
                  className="text-[10px] uppercase tracking-[0.12em] px-4 py-2 border border-parchment-300 text-olive-600 hover:border-olive-400 hover:text-olive-800 transition-colors"
                >
                  + Add Another Address
                </button>
              )}

              {/* Address form */}
              {showForm && (
                <div className="border border-parchment-300 p-6 bg-white space-y-5">
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-4">
                    {editId ? 'Edit Address' : 'New Address'}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-olive-700 mb-1">Label</label>
                      <select
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                        className="w-full border border-parchment-300 px-3 py-2.5 text-sm text-olive-900 bg-white focus:outline-none focus:border-olive-500"
                      >
                        <option>Home</option>
                        <option>Work</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-olive-700 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.address1}
                      onChange={(e) => setForm({ ...form, address1: e.target.value })}
                      className="w-full border border-parchment-300 px-3 py-2.5 text-sm text-olive-900 bg-white focus:outline-none focus:border-olive-500"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-olive-700 mb-1">
                      Apt / Unit (optional)
                    </label>
                    <input
                      type="text"
                      value={form.address2 ?? ''}
                      onChange={(e) => setForm({ ...form, address2: e.target.value })}
                      className="w-full border border-parchment-300 px-3 py-2.5 text-sm text-olive-900 bg-white focus:outline-none focus:border-olive-500"
                      placeholder="Apt 2B"
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-olive-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full border border-parchment-300 px-3 py-2.5 text-sm text-olive-900 bg-white focus:outline-none focus:border-olive-500"
                        placeholder="Boston"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-olive-700 mb-1">State</label>
                      <input
                        type="text"
                        value="MA"
                        disabled
                        className="w-full border border-parchment-200 px-3 py-2.5 text-sm text-olive-400 bg-parchment-50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-olive-700 mb-1">
                        Zip Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.zipCode}
                        onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                        className="w-full border border-parchment-300 px-3 py-2.5 text-sm text-olive-900 bg-white focus:outline-none focus:border-olive-500"
                        placeholder="02101"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3">
                      {error}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : editId ? 'Update Address' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="text-sm text-olive-500 hover:text-olive-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
