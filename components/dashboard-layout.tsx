"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Building2,
  CheckCircle,
  ChevronDown,
  Code,
  CreditCard,
  LogOut,
  Menu,
  Minus,
  Moon,
  Plus,
  Settings,
  Sun,
  User,
  Wallet,
  X,
  Zap,
  AlertCircle,
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import { useUserProfile } from "@/contexts/user-profile-context"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

/** Logo : clair en mode clair, version claire en mode sombre (via CSS, sans attendre le montage). */
function Logo({ className }: { className?: string }) {
  return (
    <>
      <img src="/logo_light11.png" alt="DGS Pay" className={cn("object-contain dark:hidden", className)} />
      <img src="/logo_dark1.png" alt="DGS Pay" className={cn("hidden object-contain dark:block", className)} />
    </>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userProfile } = useUserProfile()
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Fermeture avec Échap + blocage du scroll quand le menu mobile est ouvert
  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false)
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [sidebarOpen])

  const handleLogout = () => {
    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
    localStorage.removeItem("exp")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const fullName = userProfile ? `${userProfile.first_name ?? ""} ${userProfile.last_name ?? ""}`.trim() : ""
  const initials = userProfile
    ? `${(userProfile.first_name || "").charAt(0)}${(userProfile.last_name || "").charAt(0)}`.toUpperCase() || "U"
    : "U"
  const isVerified = userProfile?.account_status === "verify"

  const navigation = [
    { name: t("dashboard"), href: "/", icon: BarChart3 },
    { name: t("transactions"), href: "/transactions", icon: CreditCard },
    { name: t("balance"), href: "/balance", icon: Wallet },
    { name: t("withdrawalRequests"), href: "/withdraw", icon: Minus },
    { name: t("rechargeRequests"), href: "/recharge", icon: Plus },
    { name: t("payDirect"), href: "/pay", icon: Zap },
    { name: t("bankTransferNgn"), href: "/bank-transfer", icon: Building2 },
    { name: t("developers"), href: "/developers", icon: Code },
    { name: t("settings"), href: "/settings", icon: Settings },
  ]

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  const StatusIcon = ({ className }: { className?: string }) =>
    isVerified ? (
      <CheckCircle className={cn("text-success", className)} />
    ) : (
      <AlertCircle className={cn("text-warning", className)} />
    )

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Fond sombre derrière le menu mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Navigation principale"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r bg-card transition-transform duration-200 ease-out",
          "lg:static lg:w-64 lg:max-w-none lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Logo className="h-9 w-9" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-base font-bold text-foreground">{t("companyShortName")}</p>
              <p className="truncate text-xs text-muted-foreground">{t("merchantDashboard")}</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex-shrink-0 space-y-2 border-t p-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
          >
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userProfile?.logo || ""} />
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {userProfile && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card">
                  <StatusIcon className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-foreground">{fullName || "…"}</p>
              <p className="truncate text-xs text-muted-foreground">{userProfile?.entreprise_name || ""}</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t("signOut")}
          </Button>
        </div>
      </aside>

      {/* Zone principale */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-16 flex-shrink-0 items-center justify-between gap-2 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Logo visible sur mobile uniquement (la sidebar est cachée) */}
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <Logo className="h-7 w-7" />
              <span className="font-bold text-foreground">{t("companyShortName")}</span>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Changer de thème"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.logo || ""} />
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden max-w-[10rem] text-left leading-tight md:block">
                    <p className="truncate text-sm font-medium">{fullName || "…"}</p>
                    <p className="truncate text-xs text-muted-foreground">{userProfile?.entreprise_name || ""}</p>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t("myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    {t("profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
