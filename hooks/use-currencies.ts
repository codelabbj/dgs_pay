"use client"

import { useCallback, useEffect, useState } from "react"
import { smartFetch } from "@/utils/auth"

export interface CatalogCurrency {
  uid?: string
  code: string
  name: string
  symbol?: string
  is_active?: boolean
  is_default?: boolean
}

/** Devises actives du catalogue (`GET /api/v2/currencies/`). */
export function useCurrencies() {
  const [currencies, setCurrencies] = useState<CatalogCurrency[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (!baseUrl) return
      const res = await smartFetch(`${baseUrl}/api/v2/currencies/`)
      if (!res.ok) return
      const data = await res.json()
      const list: CatalogCurrency[] = Array.isArray(data) ? data : data.results || []
      setCurrencies(list)
    } catch (e) {
      console.error("Failed to load currencies:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const defaultCode =
    currencies.find((c) => c.is_default)?.code ||
    currencies.find((c) => c.code === "XOF")?.code ||
    currencies[0]?.code ||
    "XOF"

  return { currencies, defaultCode, loading, reload: load }
}
