"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { smartFetch } from "@/utils/auth"

export interface UserConfig {
  customer_id: string
  uid: string
  is_active: boolean
  webhook_url: string
  payin_fee_rate: string
  payout_fee_rate: string
  use_fixed_fees: boolean
  payin_fee_fixed: number | null
  payout_fee_fixed: number | null
  daily_payin_limit: number | null
  daily_payout_limit: number | null
  monthly_payin_limit: number | null
  monthly_payout_limit: number | null
  ip_whitelist: string[]
  require_ip_whitelist: boolean
  notes: string
  created_at: string
}

interface UserConfigContextValue {
  userConfig: UserConfig | null
  isLoading: boolean
  error: string | null
  refreshUserConfig: () => Promise<UserConfig | null>
}

const UserConfigContext = createContext<UserConfigContextValue | undefined>(undefined)

export function UserConfigProvider({ children }: { children: React.ReactNode }) {
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef<Promise<UserConfig | null> | null>(null)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const refreshUserConfig = useCallback(async () => {
    if (inFlightRef.current) {
      return inFlightRef.current
    }

    const fetchPromise = (async () => {
      setError(null)
      setIsLoading(true)
      try {
        const response = await smartFetch(`${baseUrl}/api/v2/my-config/`)
        if (!response.ok) {
          throw new Error(`User config request failed with status ${response.status}`)
        }
        const data: UserConfig = await response.json()
        setUserConfig(data)
        return data
      } catch (err) {
        console.error("Failed to load user config", err)
        setError(err instanceof Error ? err.message : "Failed to load user config")
        throw err
      } finally {
        setIsLoading(false)
        inFlightRef.current = null
      }
    })()

    inFlightRef.current = fetchPromise
    return fetchPromise
  }, [baseUrl])

  useEffect(() => {
    refreshUserConfig().catch(() => null)
  }, [refreshUserConfig])

  const value = useMemo(
    () => ({
      userConfig,
      isLoading,
      error,
      refreshUserConfig,
    }),
    [error, isLoading, refreshUserConfig, userConfig]
  )

  return <UserConfigContext.Provider value={value}>{children}</UserConfigContext.Provider>
}

export function useUserConfig() {
  const context = useContext(UserConfigContext)
  if (!context) {
    throw new Error("useUserConfig must be used within a UserConfigProvider")
  }
  return context
}

