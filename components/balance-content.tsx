"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { smartFetch } from "@/utils/auth"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Counter, Spot, useGrow } from "@/components/dash-ui"
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  History,
  Minus,
  Plus,
  RefreshCw,
  Star,
  Wallet as WalletIcon,
} from "lucide-react"


interface WalletData {
  uid: string
  currency_code: string
  currency_name?: string
  balance: number
  formatted_balance: string
  is_default: boolean
  is_active: boolean
  is_frozen: boolean
  last_transaction_at: string | null
}


interface BalanceData {
  uid: string
  balance: number
  formatted_balance: string
  total_payin: number
  total_payout: number
  total_fees_paid: number
  is_active: boolean
  is_frozen: boolean
  last_transaction_at: string | null
  wallets?: WalletData[]
  default_currency?: string
}


interface HistoryItem {
  uid: string
  type: string
  type_display: string
  amount: number
  formatted_amount: string
  balance_before: number
  balance_after: number
  description: string
  currency_code?: string
  created_at: string
}


type Filter = "all" | "in" | "out"
type Tab = "history" | "reports"


const isCredit = (type: string) => type.includes("credit") || type.includes("payin")
const BASE = process.env.NEXT_PUBLIC_BASE_URL
const isoDay = (d: Date) => d.toISOString().split("T")[0]


export function BalanceContent() {
  const { t } = useLanguage()
  const grown = useGrow()


  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("history")


  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")


  const [reportFormat, setReportFormat] = useState<"csv" | "xlsx" | "pdf">("csv")
  const [range, setRange] = useState({ from: "", to: "" })
  const [reportBusy, setReportBusy] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)


  /* ---------- Données ---------- */


  const loadBalance = async () => {
    try {
      const res = await smartFetch(`${BASE}/api/v2/balance/`)
      if (res.ok) setBalance(await res.json())
    } catch (e) {
      console.error("Failed to load balance:", e)
    } finally {
      setLoading(false)
    }
  }


  const loadHistory = async (p: number) => {
    setHistoryLoading(true)
    try {
      const res = await smartFetch(`${BASE}/api/v2/balance/history/?page=${p}`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data.results || [])
        setHasNext(Boolean(data.next))
      }
    } catch (e) {
      console.error("Failed to load balance history:", e)
    } finally {
      setHistoryLoading(false)
    }
  }


  useEffect(() => {
    loadBalance()
  }, [])


  useEffect(() => {
    loadHistory(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])


  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([loadBalance(), loadHistory(page)])
    setRefreshing(false)
  }


  const setDefaultWallet = async (uid: string) => {
    try {
      setSettingDefault(uid)
      const res = await smartFetch(`${BASE}/api/v2/wallets/${uid}/set-default/`, { method: "POST" })
      if (res.ok) await loadBalance()
    } catch (e) {
      console.error("Failed to set default wallet:", e)
    } finally {
      setSettingDefault(null)
    }
  }


  const initializeWallets = async () => {
    try {
      const res = await smartFetch(`${BASE}/api/v2/wallets/initialize/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (res.ok) await loadBalance()
    } catch (e) {
      console.error("Failed to initialize wallets:", e)
    }
  }


  const downloadReport = async (key: string, from: string, to: string) => {
    if (!from || !to) return
    setReportBusy(key)
    setReportError(null)
    try {
      const params = new URLSearchParams({ from, to, format: reportFormat })
      const res = await smartFetch(`${BASE}/api/v2/reports/transactions/?${params}`)
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions-report-${from}-to-${to}.${reportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      console.error("Failed to generate report:", e)
      setReportError("Impossible de générer le rapport. Réessayez.")
    } finally {
      setReportBusy(null)
    }
  }


  /* ---------- Dérivés ---------- */


  const wallets = balance?.wallets || []
  const defaultWallet =
    wallets.find((w) => w.is_default) ||
    wallets.find((w) => w.currency_code === (balance?.default_currency || "XOF")) ||
    wallets[0]
  const shown = wallets.find((w) => w.uid === selectedUid) || defaultWallet
  const currency = shown?.currency_code || balance?.default_currency || "XOF"
  const mainAmount = Number(shown?.balance ?? balance?.balance ?? 0)
  const isActive = shown?.is_active ?? balance?.is_active
  const payin = Number(balance?.total_payin || 0)
  const payout = Number(balance?.total_payout || 0)
  const fees = Number(balance?.total_fees_paid || 0)
  const payinShare = payin + payout > 0 ? (payin / (payin + payout)) * 100 : 50


  const groups = useMemo(() => {
    const list = history.filter((h) => filter === "all" || (filter === "in" ? isCredit(h.type) : !isCredit(h.type)))
    const map = new Map<string, HistoryItem[]>()
    for (const h of list) {
      const day = new Date(h.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
      map.set(day, [...(map.get(day) || []), h])
    }
    return Array.from(map.entries())
  }, [history, filter])


  const today = new Date()
  const daysAgo = (n: number) => isoDay(new Date(today.getTime() - n * 86400000))
  const presets = [
    { key: "7", label: "7 jours", from: daysAgo(7) },
    { key: "30", label: t("last30Days"), from: daysAgo(30) },
    { key: "90", label: "90 jours", from: daysAgo(90) },
  ]


  /* ---------- Rendu ---------- */


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="dash-rise flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("balance")}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl transition-transform hover:-translate-y-0.5">
            <Link href="/recharge"><Plus className="mr-2 h-4 w-4" />{t("rechargeRequests")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl transition-transform hover:-translate-y-0.5">
            <Link href="/withdraw"><Minus className="mr-2 h-4 w-4" />{t("withdrawalRequests")}</Link>
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={refresh} aria-label="Actualiser">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>


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
              <span>{shown?.currency_name || t("currentBalance")}</span>
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
            {shown && !shown.is_default && shown.uid && (
              <button
                disabled={settingDefault === shown.uid}
                onClick={() => setDefaultWallet(shown.uid)}
                className="mt-4 text-xs text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline disabled:opacity-50"
              >
                {t("setAsDefault")}
              </button>
            )}
            {wallets.length === 0 && (
              <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={initializeWallets}>
                Initialiser les wallets
              </Button>
            )}
          </div>


          <div className="rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-emerald-400 transition-[width] duration-1000 ease-out" style={{ width: grown ? `${payinShare}%` : "0%" }} />
              <div className="h-full flex-1 bg-rose-400/80" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              {[
                { label: t("totalPayin"), v: payin, dot: "bg-emerald-400" },
                { label: t("totalPayout"), v: payout, dot: "bg-rose-400" },
                { label: t("totalFeesPaid"), v: fees, dot: "bg-amber-300" },
              ].map((x) => (
                <div key={x.label} className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${x.dot}`} />
                    <span className="truncate">{x.label}</span>
                  </div>
                  <div className="mt-1 truncate font-medium"><Counter value={x.v} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Wallets */}
      {wallets.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {wallets.map((w, i) => {
            const active = w.uid === shown?.uid
            return (
              <button key={w.uid} onClick={() => setSelectedUid(w.uid)} className="text-left">
                <Spot delay={140 + i * 60} className={`p-4 ${active ? "border-ring ring-1 ring-ring/40" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <WalletIcon className="h-4 w-4 text-muted-foreground" />
                      {w.currency_code}
                    </span>
                    {w.is_default && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                  </div>
                  <div className="mt-3 truncate text-xl font-semibold tabular-nums text-foreground">
                    <Counter value={Number(w.balance)} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{w.currency_name || w.currency_code}</p>
                </Spot>
              </button>
            )
          })}
        </div>
      )}


      {/* Onglets */}
      <div style={{ animationDelay: "300ms" }} className="dash-rise">
        <div className="inline-flex rounded-xl bg-muted p-1">
          {([
            { id: "history", label: t("balanceHistory"), icon: History },
            { id: "reports", label: t("reports"), icon: FileText },
          ] as const).map((x) => (
            <button
              key={x.id}
              onClick={() => setTab(x.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                tab === x.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <x.icon className="h-4 w-4" />
              {x.label}
            </button>
          ))}
        </div>


        {tab === "history" && (
          <div key="history" className="dash-rise mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{t("completeHistoryOfBalanceChanges")}</p>
              <div className="flex gap-1.5">
                {([["all", "Tout"], ["in", "Entrées"], ["out", "Sorties"]] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setFilter(id)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      filter === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>


            {historyLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : groups.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">{t("noBalanceHistoryAvailable")}</div>
            ) : (
              <div className="space-y-6">
                {groups.map(([day, items]) => (
                  <div key={day}>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{day}</p>
                    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                      {items.map((h, i) => {
                        const credit = isCredit(h.type)
                        return (
                          <div
                            key={h.uid}
                            style={{ animationDelay: `${i * 40}ms` }}
                            className="dash-rise flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className={`shrink-0 rounded-full p-2 ${credit ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                                {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{h.type_display}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {new Date(h.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                  {h.description ? ` · ${h.description}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className={`text-sm font-semibold tabular-nums ${credit ? "text-success" : "text-destructive"}`}>
                                {credit ? "+" : "-"}{h.formatted_amount}
                              </p>
                              <p className="text-xs tabular-nums text-muted-foreground">
                                {Math.round(h.balance_after).toLocaleString("fr-FR")} {h.currency_code || ""}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}


            {(page > 1 || hasNext) && (
              <div className="mt-5 flex items-center justify-between">
                <Button variant="outline" size="sm" className="rounded-xl" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />Précédent
                </Button>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button variant="outline" size="sm" className="rounded-xl" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
                  Suivant<ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}


        {tab === "reports" && (
          <div key="reports" className="dash-rise mt-4 space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-foreground">{t("transactionReports")}</h2>
                <p className="text-sm text-muted-foreground">Téléchargez vos transactions pour l&apos;analyse ou la comptabilité.</p>
              </div>
              <div className="inline-flex rounded-xl bg-muted p-1">
                {(["csv", "xlsx", "pdf"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setReportFormat(f)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium uppercase transition-all ${
                      reportFormat === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>


            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {presets.map((p) => (
                <button
                  key={p.key}
                  disabled={reportBusy !== null}
                  onClick={() => downloadReport(p.key, p.from, isoDay(today))}
                  className="group flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-ring/40 hover:bg-muted disabled:opacity-60"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <p className="text-xs uppercase text-muted-foreground">{reportFormat}</p>
                  </div>
                  {reportBusy === p.key ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
                  )}
                </button>
              ))}
            </div>


            <div className="rounded-xl border border-border p-4">
              <p className="mb-3 text-sm font-medium text-foreground">{t("customRange")}</p>
              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="r-from" className="text-xs text-muted-foreground">{t("fromDate")}</Label>
                  <Input id="r-from" type="date" value={range.from} max={range.to || undefined} onChange={(e) => setRange({ ...range, from: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-to" className="text-xs text-muted-foreground">{t("toDate")}</Label>
                  <Input id="r-to" type="date" value={range.to} min={range.from || undefined} onChange={(e) => setRange({ ...range, to: e.target.value })} />
                </div>
                <Button
                  className="rounded-xl"
                  disabled={!range.from || !range.to || reportBusy !== null}
                  onClick={() => downloadReport("custom", range.from, range.to)}
                >
                  {reportBusy === "custom" ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  {t("generateReport")}
                </Button>
              </div>
            </div>


            {reportError && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />{reportError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}