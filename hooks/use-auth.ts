import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, isAuthenticatedLenient, hasAuthData } from '@/utils/auth'

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const router = useRouter()

  const checkAuth = () => {
    const hasAnyAuthData = hasAuthData()
    // Use lenient check initially to prevent redirect loops
    const isAuth = hasAnyAuthData && isAuthenticatedLenient()
    
    setIsAuthenticated(isAuth)
    setHasChecked(true)
    setIsLoading(false)
  }

  useEffect(() => {
    // Check immediately
    checkAuth()

    // Set up periodic checks to catch auth state changes
    const interval = setInterval(() => {
      checkAuth()
    }, 500) // Check every 500ms

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access' || e.key === 'refresh' || e.key === 'exp') {
        setTimeout(() => {
          checkAuth()
        }, 100)
      }
    }

    // Listen for custom auth state change events
    const handleAuthStateChange = (e: CustomEvent) => {
      setTimeout(() => {
        checkAuth()
      }, 100)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener)
    }
  }, [])

  const requireAuth = (redirectTo = '/login') => {
    if (hasChecked && !isAuthenticated) {
      router.push(redirectTo)
      return false
    }
    return true
  }

  return {
    isLoading: isLoading || !hasChecked,
    isAuthenticated,
    hasChecked,
    requireAuth,
    checkAuth
  }
}
