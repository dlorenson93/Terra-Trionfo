'use client'

import { useEffect, useState } from 'react'

export interface PlatformSettings {
  showConsumerPrices?: boolean
  deliveryFeeCents?: number
}

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadSettings() {
      try {
        const response = await fetch('/api/settings')
        if (!active) return
        if (!response.ok) {
          setSettings({ showConsumerPrices: false })
          return
        }
        const data = await response.json()
        setSettings({
          showConsumerPrices: typeof data.showConsumerPrices === 'boolean' ? data.showConsumerPrices : false,
          deliveryFeeCents: typeof data.deliveryFeeCents === 'number' ? data.deliveryFeeCents : undefined,
        })
      } catch (error) {
        console.error('Failed to load platform settings', error)
        if (active) setSettings({ showConsumerPrices: false })
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSettings()
    return () => {
      active = false
    }
  }, [])

  return { settings, loading }
}
