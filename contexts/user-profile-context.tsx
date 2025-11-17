"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { smartFetch, getUserData } from "@/utils/auth"

const DEFAULT_REFRESH_INTERVAL_MS = 60_000
const STALE_ON_FOCUS_MS = 5 * 60_000

type RefreshOptions = {
  force?: boolean
  maxAgeMs?: number
}

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  country: string | null
  entreprise_name: string | null
  website: string | null
  logo: string | null
  otp: string | null
  otp_created_at: string | null
  ip_adress: string | null
  success_url: string | null
  cancel_url: string | null
  callback_url: string | null
  reason_for_rejection: string | null
  account_status: string
  customer_pay_fee: boolean
  created_at: string
  updated_at: string
  fullname: string
  is_active: boolean
  is_partner: boolean
  trade_commerce: string | null
  gerant_doc: string | null
  entreprise_number: string | null
}

interface UserProfileContextValue {
  userProfile: UserProfile | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refreshUserProfile: (options?: RefreshOptions) => Promise<UserProfile | null>
  updateCachedProfile: (data: UserProfile | null) => void
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined)

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFetchedRef = useRef<number | null>(null)
  const inFlightRef = useRef<Promise<UserProfile | null> | null>(null)
  const userProfileRef = useRef<UserProfile | null>(null)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const updateCachedProfile = useCallback((data: UserProfile | null) => {
    setUserProfile(data)
    userProfileRef.current = data
    if (data) {
      localStorage.setItem("user", JSON.stringify(data))
      lastFetchedRef.current = Date.now()
    } else {
      localStorage.removeItem("user")
      lastFetchedRef.current = null
    }
  }, [])

  const refreshUserProfile = useCallback(
    async (options?: RefreshOptions) => {
      const { force = false, maxAgeMs = DEFAULT_REFRESH_INTERVAL_MS } = options ?? {}
      const now = Date.now()
      const currentProfile = userProfileRef.current

      if (!force && lastFetchedRef.current && now - lastFetchedRef.current < maxAgeMs) {
        return currentProfile
      }

      if (inFlightRef.current) {
        return inFlightRef.current
      }

      const fetchPromise = (async () => {
        setIsRefreshing(true)
        setError(null)
        try {
          const response = await smartFetch(`${baseUrl}/v1/api/user-details`)
          if (!response.ok) {
            throw new Error(`User profile request failed with status ${response.status}`)
          }
          const data: UserProfile = await response.json()
          updateCachedProfile(data)
          return data
        } catch (err) {
          console.error("Failed to refresh user profile", err)
          if (!userProfileRef.current) {
            setError(err instanceof Error ? err.message : "Failed to load profile")
          }
          throw err
        } finally {
          setIsLoading(false)
          setIsRefreshing(false)
          inFlightRef.current = null
        }
      })()

      inFlightRef.current = fetchPromise
      return fetchPromise
    },
    [baseUrl, updateCachedProfile]
  )

  useEffect(() => {
    const cached = getUserData()
    if (cached) {
      updateCachedProfile(cached)
      setIsLoading(false)
    }

    refreshUserProfile({ force: !cached })

    const handleFocus = () => {
      refreshUserProfile({ maxAgeMs: STALE_ON_FOCUS_MS })
    }

    window.addEventListener("focus", handleFocus)
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [refreshUserProfile, updateCachedProfile])

  const value = useMemo(
    () => ({
      userProfile,
      isLoading,
      isRefreshing,
      error,
      refreshUserProfile,
      updateCachedProfile,
    }),
    [error, isLoading, isRefreshing, refreshUserProfile, updateCachedProfile, userProfile]
  )

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
}

export function useUserProfile() {
  const context = useContext(UserProfileContext)
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider")
  }
  return context
}

