"use client"

import type React from "react"

import { useEffect, useState } from "react"
// import { useRouter, usePathname } from "next/navigation"
// import { useLanguage } from "@/contexts/language-context"

// interface AuthGuardProps {
//   children: React.ReactNode
// }

export function AuthGuard({ children }: AuthGuardProps) {
  // const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  // const router = useRouter()
  // const pathname = usePathname()
  // const { t } = useLanguage()

  // useEffect(() => {
   
  //   const checkAuth = () => {
  //     const token = localStorage.getItem("auth-token")
  //     const isAuth = !!token

  //     setIsAuthenticated(isAuth)

  //     const publicRoutes = ["/login", "/register", "/forgot-password"]
  //     const isPublicRoute = publicRoutes.includes(pathname)

  //     if (!isAuth && !isPublicRoute) {
  //       router.push("/login")
  //     } else if (isAuth && isPublicRoute) {
  //       router.push("/")
  //     }
  //   }

    
  //   checkAuth()

   
  //   const handleStorageChange = (e: StorageEvent) => {
  //     if (e.key === "auth-token") {
  //       checkAuth()
  //     }
  //   }

  //   window.addEventListener("storage", handleStorageChange)
  //   return () => window.removeEventListener("storage", handleStorageChange)
  // }, [pathname, router])

 
  // if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-blue-600">{("loading")}</span>
        </div>
      </div>
    )
  }

  // return <>{children}</>
// }
