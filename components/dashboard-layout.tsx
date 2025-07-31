"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
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
    { name: t("payouts"), href: "/payouts", icon: Wallet },
    // { name: t("myStore"), href: "/store", icon: Store },
    // { name: t("payDirect"), href: "/direct", icon: Zap },
    { name: t("developers"), href: "/developers", icon: Code },
    { name: t("settings"), href: "/settings", icon: Settings },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="bg-rose-50/30 dark:bg-neutral-950 h-screen flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-r border-rose-100 dark:border-neutral-800 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-rose-100 dark:border-neutral-800 bg-crimson-600 dark:bg-crimson-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <Crown className="w-6 h-6 text-black dark:text-white" />
            </div>
            <div>
              <span className="font-bold text-xl text-black dark:text-white">pay</span>
              <p className="text-xs text-black/80 dark:text-white/80">Merchant Dashboard</p>
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
                      : "text-neutral-700 dark:text-neutral-300 hover:text-crimson-600 dark:hover:text-crimson-400 hover:bg-rose-50 dark:hover:bg-neutral-800 hover:scale-105"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`h-5 w-5 ${isActive ? "text-white" : "text-neutral-500 group-hover:text-crimson-600"}`}
                  />
                  <span>{item.name}</span>
                  {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-rose-100 dark:border-neutral-800 flex-shrink-0">
          <div className="bg-rose-50 dark:bg-neutral-800 rounded-2xl p-4 mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 ring-2 ring-crimson-600">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback className="bg-crimson-600 text-white">JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-neutral-900 dark:text-white">John Doe</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400"></p>
              </div>
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-neutral-600 dark:text-neutral-400 hover:text-crimson-600 dark:hover:text-crimson-400 hover:bg-rose-50 dark:hover:bg-neutral-800"
            onClick={() => {
              localStorage.removeItem("auth-token")
              localStorage.removeItem("user")
              window.location.href = "/login"
            }}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {t("signOut")}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top navbar - Fixed */}
        <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-rose-100 dark:border-neutral-800 h-20 flex items-center justify-between px-8 shadow-sm flex-shrink-0 z-30">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-rose-50 dark:hover:bg-neutral-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder={t("search")}
                className="pl-12 w-96 h-12 bg-rose-50/50 dark:bg-neutral-800 border-rose-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live/Sandbox Toggle */}
            <div className="flex items-center space-x-3 bg-rose-50 dark:bg-neutral-800 rounded-2xl px-4 py-2">
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
              className="hover:bg-rose-50 dark:hover:bg-neutral-800 rounded-2xl"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-rose-50 dark:hover:bg-neutral-800 rounded-2xl"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-crimson-600 rounded-full animate-pulse"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 hover:bg-rose-50 dark:hover:bg-neutral-800 rounded-2xl px-3 py-2"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-crimson-600">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-crimson-600 text-white">JD</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-neutral-500"></p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-rose-100 dark:border-neutral-800">
                <DropdownMenuLabel>{t("myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl">
                  <User className="mr-2 h-4 w-4" />
                  {t("profile")}
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl text-crimson-600 focus:text-crimson-600"
                  onClick={() => {
                    localStorage.removeItem("auth-token")
                    localStorage.removeItem("user")
                    window.location.href = "/login"
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-rose-50/30 dark:bg-neutral-950">
          <div className="p-8 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}