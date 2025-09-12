"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { smartFetch, getUserData } from "@/utils/auth"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  CreditCard,
  Users,
  Wallet,
  Store,
  Zap,
  Code,
  Settings,
  LogOut,
  Search,
  Bell,
  User,
  Moon,
  Sun,
  Menu,
  X,
  Crown,
  ChevronDown,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Temporarily disable useAuth to test
  // const { isLoading, isAuthenticated, requireAuth, checkAuth } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  // Temporarily bypass authentication check
  // if (!requireAuth()) {
  //   return null
  // }
  
  // Load user profile
  useEffect(() => {
    // Add a delay to ensure authentication is fully established
    const timer = setTimeout(() => {
      console.log('Dashboard layout: Starting to load user profile after delay')
      loadUserProfile()
    }, 1000) // Wait 1 second for auth to be fully established
    
    return () => clearTimeout(timer)
  }, [])

  // Refresh user profile when pathname changes (user navigates between pages)
  useEffect(() => {
    if (pathname) {
      console.log('Dashboard layout: Pathname changed, refreshing user profile')
      loadUserProfile()
    }
  }, [pathname])

  // Refresh user profile when window regains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Dashboard layout: Window focused, refreshing user profile')
      loadUserProfile()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Periodic refresh every 30 seconds to keep data fresh
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Dashboard layout: Periodic refresh of user profile')
      loadUserProfile()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])
  
  // Temporarily disable authentication re-check
  // useEffect(() => {
  //   checkAuth()
  // }, [checkAuth])
  
  const loadUserProfile = async () => {
    try {
      // First, try to get user data from localStorage
      const userData = getUserData()
      if (userData) {
        setUserProfile(userData)
      }

      // Then try to fetch fresh data from API
      try {
        const response = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/v1/api/user-details`)
        
        if (response.ok) {
          const data = await response.json()
          setUserProfile(data)
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(data))
        }
      } catch (apiError) {
        console.error('API call failed:', apiError)
        // Don't throw, just use cached data
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }
  
  const handleLogout = async () => {
    try {
      // Try to call logout API if we have valid tokens
      // if (isAuthenticated) { // This line was removed as per the edit hint
      //   await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/logout`, {
      //     method: "POST",
      //   })
      // }
      // The original code had this block commented out, so it's removed.
      // The user's edit hint implies removing the useAuth hook, so this block
      // should also be removed as it relies on isAuthenticated.
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage and redirect
      localStorage.removeItem("access")
      localStorage.removeItem("refresh")
      localStorage.removeItem("exp")
      localStorage.removeItem("user")
      router.push("/login")
    }
  }
  
  const getUserInitials = () => {
    if (!userProfile) return "U"
    const firstName = userProfile.first_name || ""
    const lastName = userProfile.last_name || ""
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const { theme, setTheme } = useTheme()

  const getVerificationStatus = () => {
    if (!userProfile) return null
    // Check if account is verified based on account_status
    return userProfile.account_status === 'verify'
  }
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigation = [
    { name: t("dashboard"), href: "/", icon: BarChart3 },
    { name: t("transactions"), href: "/transactions", icon: CreditCard },
    // { name: t("customers"), href: "/customers", icon: Users },
    // { name: t("payDirect"), href: "/payouts", icon: Wallet },
    // { name: t("myStore"), href: "/store", icon: Store },
    { name: t("payDirect"), href: "/pay", icon: Zap },
    { name: t("developers"), href: "/developers", icon: Code },
    { name: t("settings"), href: "/settings", icon: Settings },
  ]

  if (!mounted) {
    return null
  }

  // Show loading until authentication is verified
  // if (isLoading) { // This line was removed as per the edit hint
  //   return ( // This line was removed as per the edit hint
  //     <div className="min-h-screen bg-slate-50/30 dark:bg-neutral-950 flex items-center justify-center"> // This line was removed as per the edit hint
  //       <div className="flex items-center space-x-2"> // This line was removed as per the edit hint
  //         <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div> // This line was removed as per the edit hint
  //         <span className="text-lg font-medium text-blue-600">Verifying authentication...</span> // This line was removed as per the edit hint
  //       </div> // This line was removed as per the edit hint
  //     </div> // This line was removed as per the edit hint
  //   ) // This line was removed as per the edit hint
  // } // This line was removed as per the edit hint

  return (
    <div className="bg-slate-50/30 dark:bg-neutral-950 h-screen flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-r border-slate-100 dark:border-neutral-800 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100 dark:border-neutral-800 bg-crimson-600 dark:bg-crimson-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12  backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <img 
                src={theme === "dark" ? "/logo_dark1.png" : "/logo_light11.png"} 
                alt="Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              {/* <img 
                src={theme === "dark" ? "/logo_dark1.png" : "/logo_light11.png"} 
                alt="Logo" 
                className="h-14 object-contain"
              /> */}
              <p className="text-lg font-bold text-black/80 dark:text-white/80">{t("companyShortName")}</p>
              <p className="text-xs text-black/80 dark:text-white/80">{t("merchantDashboard")}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-black dark:text-white hover:bg-white/20"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <nav className="px-4 py-8 space-y-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center space-x-4 px-4 py-4 mx-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-crimson-600 text-crimson-600 dark:text-crimson-200 shadow-lg shadow-crimson-600/25 scale-105"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-crimson-600 dark:hover:text-crimson-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:scale-105"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`h-5 w-5 ${isActive ? "text-black dark:text-white" : "text-neutral-500 group-hover:text-crimson-600"}`}
                  />
                  <span>{item.name}</span>
                  {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <Link href="/profile" className="block">
            <div className="bg-slate-50 dark:bg-neutral-800 rounded-2xl p-4 mb-4 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-2 ring-crimson-600 dark:ring-crimson-400 text-black dark:text-white">
                    <AvatarImage src={userProfile?.logo || ""} />
                    <AvatarFallback className="bg-crimson-600 text-black dark:text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Verification Status Icon */}
                  {userProfile && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-neutral-800 border-2 border-white dark:border-neutral-800 flex items-center justify-center">
                      {getVerificationStatus() ? (
                        <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "Loading..."}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {userProfile?.entreprise_name || ""}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-neutral-600 dark:text-neutral-400 hover:text-crimson-600 dark:hover:text-crimson-400 hover:bg-slate-50 dark:hover:bg-neutral-800"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {t("signOut")}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top navbar - Fixed */}
        <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-neutral-800 h-20 flex items-center justify-between px-8 shadow-sm flex-shrink-0 z-30">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-slate-50 dark:hover:bg-neutral-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder={t("search")}
                className="pl-12 w-96 h-12 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
              />
            </div> */}
          </div>

          <div className="flex items-center space-x-4">
            {/* Live/Sandbox Toggle */}
            <div className="flex items-center space-x-3 bg-slate-50 dark:bg-neutral-800 rounded-2xl px-4 py-2">
              <span
                className={`text-sm font-medium ${!isLiveMode ? "text-neutral-500" : "text-neutral-700 dark:text-neutral-300"}`}
              >
                {t("sandbox")}
              </span>
              <Switch
                checked={isLiveMode}
                onCheckedChange={setIsLiveMode}
                className="data-[state=checked]:bg-crimson-600"
              />
              <span
                className={`text-sm font-medium ${isLiveMode ? "text-neutral-500" : "text-neutral-700 dark:text-neutral-300"}`}
              >
                {t("live")}
              </span>
              {isLiveMode && (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white ml-2">
                  {t("live").toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-2xl"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-2xl"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-crimson-600 rounded-full animate-pulse"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-2xl px-3 py-2"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8 ring-2 ring-crimson-600 text-black dark:text-white">
                      <AvatarImage src={userProfile?.logo || ""} />
                      <AvatarFallback className="bg-crimson-600 text-black dark:text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Verification Status Icon */}
                    {userProfile && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-neutral-800 border-2 border-white dark:border-neutral-800 flex items-center justify-center">
                        {getVerificationStatus() ? (
                          <CheckCircle className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="w-2.5 h-2.5 text-yellow-600 dark:text-yellow-400" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">
                      {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "Loading..."}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {userProfile?.entreprise_name || ""}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-100 dark:border-neutral-800">
                <DropdownMenuLabel>{t("myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem className="rounded-xl cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {t("profile")}
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem className="rounded-xl cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("settings")}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl text-crimson-600 focus:text-crimson-600 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-neutral-950">
          <div className="p-8 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}