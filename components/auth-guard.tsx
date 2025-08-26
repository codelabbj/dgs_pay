"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { 
  isAuthenticated, 
  startBackgroundTokenRefresh, 
  stopBackgroundTokenRefresh
} from "@/utils/auth"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()

  useEffect(() => {
    const checkAuth = () => {
      const publicRoutes = ["/login", "/register", "/forgot-password"]
      const isPublicRoute = publicRoutes.includes(pathname)
      
      if (isAuthenticated()) {
        // User is authenticated
        if (isPublicRoute) {
          // User is on public route but authenticated, redirect to dashboard
          router.push("/")
        } else {
          // User is on protected route and authenticated, start background refresh
          startBackgroundTokenRefresh()
        }
      } else {
        // User is not authenticated
        if (!isPublicRoute) {
          // User is on protected route but not authenticated, redirect to login
          router.push("/login")
        }
      }
      
      setIsLoading(false)
    }

    // Check authentication with a small delay to ensure localStorage is ready
    const timer = setTimeout(checkAuth, 100)

    return () => {
      clearTimeout(timer)
      stopBackgroundTokenRefresh()
    }
  }, [pathname, router])

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

  return <>{children}</>
}
