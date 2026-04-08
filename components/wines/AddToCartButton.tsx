'use client'

import { useState } from 'react'
import { addToInquiry } from '@/lib/cart'
import type { Wine } from '@/types/wine'

interface Props {
  wine: Wine
  producerName: string
}

export default function AddToCartButton({ wine, producerName }: Props) {
  const [added, setAdded] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToInquiry({
      productId: wine.id,
      name: wine.displayName,
      price: 0,
      quantity: 1,
    })
    setAdded(true)
    // Notify header to refresh inquiry count (same-tab event)
    window.dispatchEvent(new Event('inquiryUpdated'))
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <button
      onClick={handleAdd}
      className={`mt-3 w-full text-[10px] font-medium tracking-[0.12em] uppercase py-2.5 border transition-all duration-200 ${
        added
          ? 'border-olive-600 bg-olive-600 text-white'
          : 'border-olive-300 text-olive-700 hover:border-olive-600 hover:bg-olive-50 bg-white'
      }`}
    >
      {added ? '✓ Added to Inquiry' : 'Add to Inquiry'}
    </button>
  )
}

