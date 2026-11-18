"use client"

import { useCallback, useEffect, useState } from "react"
import { Laptop, MapPin, RefreshCw, ShieldAlert, Smartphone, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { smartFetch } from "@/utils/auth"
import { EmptyState, ErrorBanner, Loading, Panel, Shell, useTr } from "./kit"

interface Ev {
  id: string
  created_at: string
  event: string
  event_label: string
  success: boolean
  reason: string | null
  ip_address: string | null
  browser: string | null
  os: string | null
  device: string | null
  city: string | null
  country: string | null
  country_code: string | null
  is_new_device: boolean
  is_new_country: boolean
}

const LABEL_EN: Record<string, string> = {
  login_success: "Sign-in", login_failed: "Sign-in refused", login_locked: "Sign-in blocked (too many failures)",
  token_refresh: "Session renewed", token_refresh_failed: "Renewal refused", logout: "Sign-out",
  api_key_generated: "API keys generated", password_changed: "Password changed",
  password_change_failed: "Password change refused", password_reset: "Password reset",
  totp_enabled: "2FA enabled", totp_disabled: "2FA disabled", totp_failed: "Invalid 2FA code",
}

export function MySecurity() {
  const tr = useTr()
  const [rows, setRows] = useState<Ev[] | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setError("")
    try {
      const res = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/v1/api/me/auth-events?limit=100`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.detail || `Erreur ${res.status}`)
      setRows(data.results || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Shell
      eyebrow={tr("Sécurité", "Security")}
      title={tr("Mes connexions", "My sign-ins")}
      description={tr(
        "Chaque connexion à votre compte, génération de clés API et changement de mot de passe. Si vous ne reconnaissez pas un accès, changez votre mot de passe et régénérez vos clés API immédiatement.",
        "Every sign-in to your account, API key generation and password change. If you don’t recognise an access, change your password and regenerate your API keys immediately.",
      )}
      actions={
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {tr("Actualiser", "Refresh")}
        </Button>
      }
    >
      {error && <ErrorBanner message={error} onRetry={load} />}
      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Panel><EmptyState title={tr("Aucune activité enregistrée", "No activity recorded")} /></Panel>
      ) : (
        <Panel>
          <ul className="divide-y">
            {rows.map((e) => {
              const Icon = e.device === "mobile" ? Smartphone : e.device === "api" ? Terminal : Laptop
              return (
                <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${e.success ? "bg-muted" : "bg-red-100 text-red-700 dark:bg-red-500/15"}`}>
                    {e.success ? <Icon className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {tr(e.event_label, LABEL_EN[e.event] || e.event_label)}
                      {e.is_new_country && <span className="ml-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{tr("Nouveau pays", "New country")}</span>}
                      {e.is_new_device && <span className="ml-2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{tr("Nouvel appareil", "New device")}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[e.browser, e.os].filter(Boolean).join(" · ") || "—"} · <span className="font-mono">{e.ip_address || "—"}</span>
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[e.city, e.country || e.country_code].filter(Boolean).join(", ") || tr("Lieu inconnu", "Unknown location")}
                      {e.reason ? ` · ${e.reason}` : ""}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}
    </Shell>
  )
}
