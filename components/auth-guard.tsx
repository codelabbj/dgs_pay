"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { 
  startBackgroundTokenRefresh, 
  stopBackgroundTokenRefresh
} from "@/utils/auth"

interface AuthGuardProps {
  children: React.ReactNode
}

// Client-side only wrapper to prevent hydration issues
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

  return <>{children}</>
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()

  // Simple authentication check
  const checkAuth = () => {
    const accessToken = localStorage.getItem("access")
    const refreshToken = localStorage.getItem("refresh")
    const hasTokens = !!(accessToken && refreshToken)
    
    console.log('AuthGuard checkAuth:', {
      pathname,
      hasTokens,
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
      isAuthenticated
    })
    
    setIsAuthenticated(hasTokens)
    setIsLoading(false)
  }

  // Check authentication on mount and pathname change
  useEffect(() => {
    console.log('AuthGuard useEffect triggered, pathname:', pathname)
    checkAuth()
    
    return () => {
      stopBackgroundTokenRefresh()
    }
  }, [pathname])

  // Listen for authentication state changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle changes to auth-related keys
      if (e.key === 'access' || e.key === 'refresh' || e.key === 'exp') {
        console.log('Storage change detected for auth key:', e.key, 'newValue:', !!e.newValue, 'oldValue:', !!e.oldValue)
        
        // Only recheck if we're adding tokens, not removing them
        if (e.newValue && !e.oldValue) {
          console.log('New auth data added, rechecking auth')
          setTimeout(checkAuth, 100)
        } else if (!e.newValue && e.oldValue) {
          console.log('Auth data removed, this might be a logout - not rechecking')
          // Don't recheck if tokens are being removed (logout scenario)
        }
      }
    }

    const handleAuthStateChange = (e: CustomEvent) => {
      console.log('Custom auth event detected, rechecking auth')
      setTimeout(checkAuth, 100)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener)
    }
  }, [])

  // Handle redirects based on authentication state
  useEffect(() => {
    if (isLoading) return

    const publicRoutes = ["/login", "/register", "/forgot-password"]
    const isPublicRoute = publicRoutes.includes(pathname)

    console.log('AuthGuard redirect logic:', {
      pathname,
      isPublicRoute,
      isAuthenticated,
      isLoading
    })

    if (isAuthenticated) {
      // User is authenticated
      if (isPublicRoute) {
        // User is on public route but authenticated, redirect to dashboard
        console.log('Redirecting authenticated user from public route to dashboard')
        router.push("/")
        return
      } else {
        // User is on protected route and authenticated, start background refresh
        console.log('User authenticated on protected route, allowing access')
        // Temporarily disable background refresh to test
        // startBackgroundTokenRefresh()
      }
    } else {
      // User is not authenticated - double-check before redirecting
      const currentAccessToken = localStorage.getItem("access")
      const currentRefreshToken = localStorage.getItem("refresh")
      const hasCurrentTokens = !!(currentAccessToken && currentRefreshToken)
      
      console.log('Double-checking tokens before redirect:', { hasCurrentTokens, accessToken: !!currentAccessToken, refreshToken: !!currentRefreshToken })
      
      if (hasCurrentTokens) {
        // Tokens exist but state is wrong, update state
        console.log('Tokens exist but state is wrong, updating state')
        setIsAuthenticated(true)
        return
      }
      
      if (!isPublicRoute) {
        // User is on protected route but not authenticated, redirect to login
        console.log('Redirecting unauthenticated user from protected route to login')
        router.push("/login")
        return
      } else {
        // User is on public route and not authenticated, allow rendering
        console.log('User not authenticated on public route, allowing access')
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-blue-600">{t("loading")}</span>
        </div>
      </div>
    )
  }

  // Don't render anything while redirecting
  const publicRoutes = ["/login", "/register", "/forgot-password"]
  const isPublicRoute = publicRoutes.includes(pathname)
  
  if (!isPublicRoute && !isAuthenticated) {
    console.log('Blocking access to protected route, user not authenticated')
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-blue-600">{t("loading")}</span>
        </div>
      </div>
    )
  }

  console.log('AuthGuard rendering children, final state:', { isAuthenticated, pathname, isPublicRoute })
  return <ClientOnly>{children}</ClientOnly>
}
