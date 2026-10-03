"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { smartFetch } from "@/utils/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/contexts/language-context"
import { useUserConfig } from "@/contexts/user-config-context"
import { useUserProfile } from "@/contexts/user-profile-context"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  LinkIcon,
  MapPin,
  Minus,
  Plus,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"


/* ---------- Helpers ---------- */


function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target)
      return
    }
    const start = performance.now()
    const begin = from.current
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      const v = begin + (target - begin) * eased
      setValue(v)
      from.current = v
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}


const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR")


function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const v = useCountUp(value)
  return (
    <span className="tabular-nums">
      {fmt(v)}
      {suffix}
    </span>
  )
}


/** Carte avec halo lumineux qui suit la souris + entrée en cascade */
function Spot({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`)
  }
  return (
    <div
      onMouseMove={onMove}
      style={{ animationDelay: `${delay}ms` }}
      className={`dash-rise group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-lg ${className}`}
    >
      <div className="dash-spot pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  )
}


function useGrow(delay = 150) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setOn(true), delay)
    return () => clearTimeout(id)
  }, [delay])
  return on
}


/* ---------- Page ---------- */


export function DashboardContent() {
  const { t } = useLanguage()
  const { userConfig } = useUserConfig()
  const { userProfile } = useUserProfile()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL


  const [stats, setStats] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const grown = useGrow()


  const isAccountVerified = userProfile?.account_status === "verify"
  const needsVerification = Boolean(userProfile && (!isAccountVerified || userConfig?.is_active === false))


  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats()
      fetchBalance()
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const fetchStats = async () => {
    try {
      const res = await smartFetch(`${baseUrl}/prod/v1/api/statistic`)
      if (res.ok) setStats(await res.json())
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }


  const fetchBalance = async () => {
    try {
      const res = await smartFetch(`${baseUrl}/api/v2/balance/`)
      if (res.ok) setBalance(await res.json())
      else if (res.status === 403) setBalance(null)
    } catch (error) {
      console.error("Error fetching balance:", error)
    } finally {
      setLoading(false)
    }
  }


  const setDefault = async (uid: string) => {
    try {
      const res = await smartFetch(`${baseUrl}/api/v2/wallets/${uid}/set-default/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) await fetchBalance()
    } catch (err) {
      console.error("Error setting default wallet:", err)
    }
  }


  const wallets: any[] = balance?.wallets || []
  const defaultWallet =
    wallets.find((w) => w.is_default) ||
    wallets.find((w) => w.currency_code === balance?.default_currency) ||
    wallets[0]
  const shown = wallets.find((w) => w.uid === selectedUid) || defaultWallet
  const currency = shown?.currency_code || balance?.default_currency || "XOF"
  const mainAmount = Number(shown?.balance ?? balance?.balance ?? 0)
  const isActive = shown?.is_active ?? balance?.is_active


  const payin = Number(balance?.total_payin || 0)
  const payout = Number(balance?.total_payout || 0)
  const fees = Number(balance?.total_fees_paid || 0)
  const txCount = Number(stats?.total_success_transaction || 0)
  const flowTotal = payin + payout
  const payinShare = flowTotal > 0 ? (payin / flowTotal) * 100 : 50


  const countries = stats?.country_payment
    ? Object.entries(stats.country_payment).map(([country, pct]) => ({
        country: t(country as any) || country,
        percentage: typeof pct === "number" ? pct : 0,
      }))
    : []


  const palette = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]
  const methods = stats?.payment_methode
    ? Object.entries(stats.payment_methode).map(([name, d]: [string, any], i) => ({
        name,
        value: d?.percentage || 0,
        color: palette[i % palette.length],
      }))
    : []


  const kpis = [
    { label: t("totalPayin"), value: payin, suffix: ` ${currency}`, icon: ArrowDownLeft, tone: "text-success bg-success/10" },
    { label: t("totalPayout"), value: payout, suffix: ` ${currency}`, icon: ArrowUpRight, tone: "text-destructive bg-destructive/10" },
    { label: t("totalFeesPaid"), value: fees, suffix: ` ${currency}`, icon: Coins, tone: "text-warning bg-warning/10" },
    { label: t("successfulTransactions"), value: txCount, suffix: "", icon: CheckCircle2, tone: "text-ring bg-ring/10" },
  ]


  const actions = [
    { label: t("rechargeRequests"), href: "/recharge", icon: Plus },
    { label: t("withdrawalRequests"), href: "/withdraw", icon: Minus },
    { label: t("payDirect"), href: "/pay", icon: Zap },
  ]


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="dash-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("dashboard")}
            {userProfile?.first_name ? <span className="text-muted-foreground"> · {userProfile.first_name}</span> : null}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button key={a.href} asChild variant="outline" size="sm" className="rounded-xl transition-transform hover:-translate-y-0.5">
              <Link href={a.href}>
                <a.icon className="mr-2 h-4 w-4" />
                {a.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>


      {needsVerification && (
        <div className="dash-rise flex items-start gap-4 rounded-2xl border border-warning/30 bg-warning/10 p-5">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-warning" />
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{t("accountVerificationRequired")}</p>
            <p className="text-sm text-muted-foreground">
              {!isAccountVerified ? t("accountNotVerifiedDescription") : t("aggregatorNotActiveDescription")}
            </p>
            {!isAccountVerified && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/profile">{t("completeMyProfile")}</Link>
              </Button>
            )}
          </div>
        </div>
      )}


      {/* Carte principale */}
      <div
        style={{ animationDelay: "60ms" }}
        className="dash-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(210_68%_14%)] via-[hsl(210_66%_21%)] to-[hsl(211_70%_32%)] p-6 text-white shadow-xl sm:p-8"
      >
        <div className="dash-sheen pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span>{t("currentBalance")}</span>
              <span className="flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white">
                <span className="relative flex h-2 w-2">
                  {isActive && <span className="dash-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                </span>
                {isActive ? t("balanceActive") : t("balanceInactive")}
              </span>
              {shown?.is_frozen && <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs text-amber-200">{t("balanceFrozen")}</span>}
            </div>
            <div key={shown?.uid} className="dash-rise mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              <Counter value={mainAmount} />
              <span className="ml-2 text-xl font-medium text-white/60 sm:text-2xl">{currency}</span>
            </div>


            {wallets.length > 1 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {wallets.map((w) => {
                  const active = w.uid === shown?.uid
                  return (
                    <button
                      key={w.uid}
                      onClick={() => setSelectedUid(w.uid)}
                      className={`rounded-full px-4 py-1.5 text-sm transition-all duration-200 ${
                        active ? "bg-white text-[hsl(210_68%_14%)] shadow-md" : "bg-white/10 text-white/80 hover:bg-white/20"
                      }`}
                    >
                      {w.currency_code}
                      {w.is_default && <span className="ml-1.5 text-[10px] opacity-60">★</span>}
                    </button>
                  )
                })}
              </div>
            )}
            {shown && !shown.is_default && (
              <button onClick={() => setDefault(shown.uid)} className="mt-3 text-xs text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline">
                {t("setAsDefault")}
              </button>
            )}
          </div>


          {/* Flux entrant / sortant */}
          <div className="rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-white/70">{t("totalPayin")} / {t("totalPayout")}</span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-emerald-400 transition-[width] duration-1000 ease-out" style={{ width: grown ? `${payinShare}%` : "0%" }} />
              <div className="h-full flex-1 bg-rose-400/80" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {t("payin")}
                </div>
                <div className="mt-1 font-medium"><Counter value={payin} /></div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  {t("payout")}
                </div>
                <div className="mt-1 font-medium"><Counter value={payout} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <Spot key={k.label} delay={140 + i * 70} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <span className={`rounded-xl p-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${k.tone}`}>
                <k.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              <Counter value={k.value} suffix={k.suffix} />
            </div>
          </Spot>
        ))}
      </div>


      {/* Répartition */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Spot delay={420} className="p-6">
          <h2 className="font-semibold text-foreground">{t("whereCustomers")}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{t("customerDistribution")}</p>
          {countries.length > 0 ? (
            <div className="space-y-4">
              {countries.map((c, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {c.country}
                    </span>
                    <span className="font-medium tabular-nums text-foreground">{c.percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-out"
                      style={{ width: grown ? `${c.percentage}%` : "0%", transitionDelay: `${i * 90}ms` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">{t("noDataAvailable")}</div>
          )}
        </Spot>


        <Spot delay={490} className="p-6">
          <h2 className="font-semibold text-foreground">{t("mostUsedPayment")}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{t("paymentMethodDistribution")}</p>
          {methods.length > 0 ? (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={methods} dataKey="value" innerRadius={52} outerRadius={80} paddingAngle={4} stroke="none" animationDuration={1000}>
                      {methods.map((m, i) => (
                        <Cell key={i} fill={m.color} className="outline-none transition-opacity hover:opacity-80" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-2">
                {methods.map((m) => (
                  <div key={m.name} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted">
                    <span className="flex items-center gap-2 text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                      {m.name}
                    </span>
                    <span className="font-medium tabular-nums">{m.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">{t("noDataAvailable")}</div>
          )}
        </Spot>
      </div>


      {/* Configuration */}
      {userConfig && (
        <Spot delay={560} className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">{t("configuration")}</h2>
              <p className="text-sm text-muted-foreground">{t("currentApiFeeAndSecurity")}</p>
            </div>
            <Button asChild variant="ghost" size="icon" className="rounded-xl">
              <Link href="/settings"><Settings className="h-5 w-5 transition-transform duration-500 hover:rotate-90" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{t("status")}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`rounded-full ${userConfig.is_active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {userConfig.is_active ? t("balanceActive") : t("balanceInactive")}
                </Badge>
                {userConfig.require_ip_whitelist && <ShieldCheck className="h-4 w-4 text-success" />}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {userConfig.require_ip_whitelist ? t("ipWhitelistRequired") : t("ipWhitelistDisabled")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{t("fees")}</p>
              <p className="text-sm text-foreground">
                {t("payin")} <span className="font-semibold">{userConfig.use_fixed_fees && userConfig.payin_fee_fixed != null ? `${userConfig.payin_fee_fixed.toLocaleString()} XOF` : `${userConfig.payin_fee_rate}%`}</span>
              </p>
              <p className="text-sm text-foreground">
                {t("payout")} <span className="font-semibold">{userConfig.use_fixed_fees && userConfig.payout_fee_fixed != null ? `${userConfig.payout_fee_fixed.toLocaleString()} XOF` : `${userConfig.payout_fee_rate}%`}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{userConfig.use_fixed_fees ? t("fixedFeeMode") : t("percentageFeeMode")}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{t("webhook")}</p>
              <div className="flex items-center gap-2 break-all text-sm text-foreground">
                <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{userConfig.webhook_url || t("notConfigured")}</span>
              </div>
              {userConfig.ip_whitelist?.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">{t("whitelistedIPs")} {userConfig.ip_whitelist.length}</p>
              )}
            </div>
          </div>
        </Spot>
      )}
    </div>
  )
}