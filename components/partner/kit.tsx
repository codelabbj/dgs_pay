"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { ApiError } from "@/lib/partner-api"
import { cn } from "@/lib/utils"

/** Texte bilingue : tr("Cartes", "Cards"). */
export function useTr() {
  const { language } = useLanguage()
  return (fr: string, en: string) => (language === "en" ? en : fr)
}

// ── Statuts ─────────────────────────────────────────────────────────────────

const TONE = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/30",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30",
  gray: "bg-muted text-muted-foreground ring-border",
} as const

const STATUS: Record<string, [string, string, keyof typeof TONE]> = {
  ACTIVE: ["Active", "Active", "green"],
  DISABLED: ["Gelée", "Frozen", "blue"],
  PENDING: ["En création", "Creating", "amber"],
  FAILED: ["Échec", "Failed", "red"],
  TERMINATED: ["Résiliée", "Terminated", "gray"],
  success: ["Réussie", "Successful", "green"],
  failed: ["Échouée", "Failed", "red"],
  pending: ["En cours", "Pending", "amber"],
  processing: ["En cours", "Processing", "amber"],
  unknown: ["Confirmation en cours", "Awaiting confirmation", "violet"],
  review: ["Vérification DGS", "DGS review", "violet"],
  cancelled: ["Annulée", "Cancelled", "gray"],
  refunded: ["Remboursée", "Refunded", "gray"],
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const tr = useTr()
  const [fr, en, tone] = STATUS[status] || [status || "—", status || "—", "gray"]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {tr(fr, en)}
    </span>
  )
}

export function ComplianceBadge({ frozenBy }: { frozenBy: string }) {
  const tr = useTr()
  if (frozenBy !== "dgs") return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
      <ShieldAlert className="h-3 w-3" /> {tr("Conformité DGS", "DGS compliance")}
    </span>
  )
}

// ── Mise en page ────────────────────────────────────────────────────────────

export function Shell({
  eyebrow,
  title,
  description,
  tabs,
  actions,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  tabs?: { href: string; label: string; exact?: boolean }[]
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname() || ""
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href))
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {tabs && (
        <nav className="-mx-1 flex gap-1 overflow-x-auto border-b px-1">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(tab.href, tab.exact) ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {isActive(tab.href, tab.exact) && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </Link>
          ))}
        </nav>
      )}
      {children}
    </div>
  )
}

export function Kpi({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: "default" | "warning" | "danger"
  icon?: React.ElementType
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        tone === "warning" && "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/5",
        tone === "danger" && "border-red-300 bg-red-50/60 dark:border-red-500/40 dark:bg-red-500/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-sm", className)}>
      {(title || actions) && (
        <header className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 max-w-md text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const tr = useTr()
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="h-7">
          {tr("Réessayer", "Retry")}
        </Button>
      )}
    </div>
  )
}

export function Loading() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-xs text-muted-foreground", className)}>{children}</span>
}

export function Pager({ page, pageSize, count, onPage }: { page: number; pageSize: number; count: number; onPage: (p: number) => void }) {
  const tr = useTr()
  const pages = Math.max(Math.ceil(count / pageSize), 1)
  return (
    <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
      <span>
        {count} {tr("résultat(s)", "result(s)")} · {page}/{pages}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="h-7" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          {tr("Précédent", "Previous")}
        </Button>
        <Button size="sm" variant="outline" className="h-7" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          {tr("Suivant", "Next")}
        </Button>
      </div>
    </div>
  )
}

/** Dialogue de confirmation ; demande le code 2FA si le serveur l'exige. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  children,
  canConfirm = true,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel: string
  destructive?: boolean
  children?: React.ReactNode
  canConfirm?: boolean
  onConfirm: (totp: string) => Promise<void>
}) {
  const tr = useTr()
  const [totp, setTotp] = useState("")
  const [needTotp, setNeedTotp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const close = (v: boolean) => {
    if (!v) {
      setTotp("")
      setNeedTotp(false)
      setError("")
    }
    onOpenChange(v)
  }

  const submit = async () => {
    setBusy(true)
    setError("")
    try {
      await onConfirm(totp.trim())
      close(false)
    } catch (e) {
      if (e instanceof ApiError && e.needsTotp) {
        setNeedTotp(true)
        setError(totp ? tr("Code 2FA invalide.", "Invalid 2FA code.") : tr("Saisissez votre code 2FA.", "Enter your 2FA code."))
      } else {
        setError(e instanceof Error ? e.message : tr("Action impossible.", "Action failed."))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">{description}</div>
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4">
          {children}
          {needTotp && (
            <div className="space-y-1.5">
              <Label htmlFor="partner-totp">{tr("Code 2FA", "2FA code")}</Label>
              <Input
                id="partner-totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                className="font-mono tracking-[0.4em]"
              />
            </div>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => close(false)} disabled={busy}>
            {tr("Annuler", "Cancel")}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={submit} disabled={busy || !canConfirm}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
