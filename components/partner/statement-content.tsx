"use client"

import { useCallback, useEffect, useState } from "react"
import { BadgeCheck, RefreshCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/partner-api"
import { EmptyState, ErrorBanner, Loading, Panel, Shell, useTr } from "./kit"

interface Agg {
  count: number
  amount: string
  fees: string
}

interface WalletStatement {
  currency: string
  status: "ok" | "warning" | "alert"
  wallet_balance: string
  computed_balance: string
  difference: string
  opening_balance: string
  entries: number
  anomalies: { code: string; label: string; severity: string; count: number; samples: { reference: string; amount: string; status: string }[] }[]
  activity: {
    payins_success: Agg
    payins_pending: Agg
    payouts_success: Agg
    payouts_pending: Agg
    payouts_failed: Agg
    credited_payins: string
    debited_payouts: string
    refunded_payouts: string
    refunded_payins: string
    manual_credits: string
    manual_debits: string
    card_fees: string
    card_terminations: string
    fees_paid: string
  }
}

const n = (v: string | number, cur: string) =>
  `${Number(v).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${cur}`

export function StatementContent() {
  const tr = useTr()
  const [data, setData] = useState<{ verified: boolean; wallets: WalletStatement[] } | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setData((await api<{ verified: boolean; wallets: WalletStatement[] }>("balance/statement/")).data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Shell
      eyebrow={tr("Finance", "Finance")}
      title={tr("Relevé de solde", "Balance statement")}
      description={tr(
        "Votre solde recalculé à partir de chacun de vos mouvements : dépôts, commissions, retraits, remboursements, ajustements et frais cartes.",
        "Your balance recomputed from every movement: deposits, commissions, payouts, refunds, adjustments and card fees.",
      )}
      actions={
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {tr("Recalculer", "Recompute")}
        </Button>
      }
    >
      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && !data ? (
        <Loading />
      ) : data && data.wallets.length === 0 ? (
        <Panel>
          <EmptyState title={tr("Aucun wallet", "No wallet")} />
        </Panel>
      ) : data ? (
        <>
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              data.verified
                ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
            }`}
          >
            {data.verified ? <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" /> : <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />}
            <p>
              {data.verified
                ? tr("Solde vérifié : chaque wallet correspond exactement à son historique.", "Balance verified: each wallet matches its history exactly.")
                : tr(
                    "Un point demande l’attention de DGS (voir ci-dessous). Nos équipes sont alertées automatiquement.",
                    "Something needs DGS attention (see below). Our team is alerted automatically.",
                  )}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {data.wallets.map((w) => {
              const a = w.activity
              const cur = w.currency
              return (
                <Panel
                  key={cur}
                  title={`${tr("Wallet", "Wallet")} ${cur}`}
                  description={`${w.entries} ${tr("mouvement(s)", "movement(s)")}`}
                  actions={
                    w.status === "ok" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <BadgeCheck className="h-4 w-4" /> {tr("Vérifié", "Verified")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <TriangleAlert className="h-4 w-4" /> {tr("À vérifier", "Under review")}
                      </span>
                    )
                  }
                >
                  <div className="space-y-1 p-4 text-sm">
                    {Number(w.opening_balance) !== 0 && <Line k={tr("Solde d’ouverture", "Opening balance")} v={n(w.opening_balance, cur)} />}
                    <Line k={`${tr("Dépôts réussis", "Successful deposits")} (${a.payins_success.count})`} v={n(a.payins_success.amount, cur)} />
                    <Line k={tr("− commissions DGS sur dépôts", "− DGS deposit commissions")} v={n(a.payins_success.fees, cur)} muted />
                    <Line k={tr("= crédité sur votre wallet", "= credited to your wallet")} v={`+ ${n(a.credited_payins, cur)}`} />
                    <Line k={`${tr("Retraits / envois", "Payouts")} (${a.payouts_success.count + a.payouts_pending.count})`} v={`− ${n(a.debited_payouts, cur)}`} />
                    {Number(a.refunded_payouts) > 0 && <Line k={tr("Retraits échoués remboursés", "Failed payouts refunded")} v={`+ ${n(a.refunded_payouts, cur)}`} />}
                    {Number(a.refunded_payins) > 0 && <Line k={tr("Dépôts remboursés", "Deposits refunded")} v={`− ${n(a.refunded_payins, cur)}`} />}
                    {Number(a.manual_credits) > 0 && <Line k={tr("Recharges / ajustements", "Top-ups / adjustments")} v={`+ ${n(a.manual_credits, cur)}`} />}
                    {Number(a.manual_debits) > 0 && <Line k={tr("Retraits manuels / ajustements", "Manual withdrawals / adjustments")} v={`− ${n(a.manual_debits, cur)}`} />}
                    {Number(a.card_fees) > 0 && <Line k={tr("Frais cartes", "Card fees")} v={`− ${n(a.card_fees, cur)}`} />}
                    {Number(a.card_terminations) > 0 && <Line k={tr("Soldes de cartes résiliées", "Terminated card balances")} v={`+ ${n(a.card_terminations, cur)}`} />}
                    <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                      <span>{tr("Solde recalculé", "Recomputed balance")}</span>
                      <span className="tabular-nums">{n(w.computed_balance, cur)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tr("Solde de votre wallet", "Your wallet balance")}</span>
                      <span className="tabular-nums">{n(w.wallet_balance, cur)}</span>
                    </div>
                    <p className="pt-2 text-xs text-muted-foreground">
                      {tr("Total des frais payés", "Total fees paid")} : {n(a.fees_paid, cur)}
                      {a.payins_pending.count + a.payouts_pending.count > 0 &&
                        ` · ${a.payins_pending.count + a.payouts_pending.count} ${tr("opération(s) en cours", "operation(s) in progress")}`}
                    </p>
                    {w.anomalies.map((an) => (
                      <div key={an.code} className="mt-2 rounded-lg border border-amber-300 p-2 text-xs dark:border-amber-500/40">
                        <p className="font-medium">
                          {an.label} — {an.count}
                        </p>
                        {an.samples.slice(0, 5).map((s) => (
                          <p key={s.reference} className="font-mono text-muted-foreground">
                            {s.reference} · {n(s.amount, cur)} · {s.status}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </Panel>
              )
            })}
          </div>
        </>
      ) : null}
    </Shell>
  )
}

function Line({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${muted ? "text-muted-foreground" : ""}`}>
      <span>{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  )
}
