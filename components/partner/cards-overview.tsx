"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CreditCard, Hourglass, PauseCircle, RefreshCw, ShieldAlert, Users, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, money, type Program } from "@/lib/partner-api"
import { ErrorBanner, Kpi, Loading, Panel, Shell, StatusPill, useTr } from "./kit"

interface Overview {
  program: Program | null
  cards: { total: number; alive: number; end_users: number; by_status: Record<string, number>; compliance_frozen: number; total_balance_usd: string }
  operations: { open: number; open_amount_usd: string; fund_30d_count: number; fund_30d_usd: string; withdraw_30d_usd: string; fees_month_usd: string }
}

export function useCardTabs() {
  const tr = useTr()
  return [
    { href: "/cards", label: tr("Vue d’ensemble", "Overview"), exact: true },
    { href: "/cards/list", label: tr("Cartes", "Cards") },
    { href: "/cards/operations", label: tr("Opérations", "Operations") },
  ]
}

export function CardsOverview() {
  const tr = useTr()
  const tabs = useCardTabs()
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setData((await api<Overview>("maplerad/cards/overview/")).data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const p = data?.program

  return (
    <Shell
      eyebrow={tr("Cartes virtuelles", "Virtual cards")}
      title={tr("Vue d’ensemble", "Overview")}
      description={tr(
        "Les cartes VISA / Mastercard USD de vos utilisateurs finaux. Les recharges sont débitées de votre wallet USD DGS, les retraits y sont crédités.",
        "Your end users’ USD VISA / Mastercard cards. Top-ups are debited from your DGS USD wallet, withdrawals are credited to it.",
      )}
      tabs={tabs}
      actions={
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {tr("Actualiser", "Refresh")}
        </Button>
      }
    >
      {error && <ErrorBanner message={error} onRetry={load} />}

      {data && !p && (
        <ErrorBanner
          message={tr(
            "Le programme carte n’est pas activé sur votre compte. Contactez DGS pour l’ouvrir.",
            "The card program is not enabled on your account. Contact DGS to open it.",
          )}
        />
      )}
      {p?.suspended && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
          <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-amber-900 dark:text-amber-300">
            {tr(
              "Créations et recharges de cartes temporairement suspendues par DGS (maintenance). Les retraits et résiliations restent possibles.",
              "Card creation and top-ups are temporarily suspended by DGS (maintenance). Withdrawals and terminations remain available.",
            )}
          </p>
        </div>
      )}

      {loading && !data ? (
        <Loading />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label={tr("Cartes actives", "Live cards")} value={data.cards.alive} hint={`${data.cards.total} ${tr("au total", "in total")}`} icon={CreditCard} />
            <Kpi label={tr("Utilisateurs porteurs", "Cardholders")} value={data.cards.end_users} icon={Users} />
            <Kpi label={tr("Solde total sur cartes", "Total card balance")} value={money(data.cards.total_balance_usd)} hint={tr("Dernier solde lu", "Last known balance")} icon={Wallet} />
            <Kpi
              label={tr("Opérations en attente", "Pending operations")}
              value={data.operations.open}
              hint={money(data.operations.open_amount_usd)}
              tone={data.operations.open ? "warning" : "default"}
              icon={Hourglass}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title={tr("Activité (30 jours)", "Activity (30 days)")} className="lg:col-span-2">
              <div className="grid gap-4 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">{tr("Recharges", "Top-ups")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{money(data.operations.fund_30d_usd)}</p>
                  <p className="text-xs text-muted-foreground">{data.operations.fund_30d_count} {tr("opération(s)", "operation(s)")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{tr("Retraits", "Withdrawals")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{money(data.operations.withdraw_30d_usd)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{tr("Frais payés (mois)", "Fees paid (month)")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{money(data.operations.fees_month_usd)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t px-4 py-3">
                {Object.entries(data.cards.by_status).map(([status, n]) => (
                  <span key={status} className="inline-flex items-center gap-1.5 text-xs">
                    <StatusPill status={status} /> <span className="tabular-nums">{n}</span>
                  </span>
                ))}
                {data.cards.compliance_frozen > 0 && (
                  <Link href="/cards/list?frozen_by=dgs" className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                    <ShieldAlert className="h-3.5 w-3.5" /> {data.cards.compliance_frozen} {tr("bloquée(s) conformité", "compliance-blocked")}
                  </Link>
                )}
              </div>
            </Panel>

            <Panel title={tr("Votre programme", "Your program")} description={tr("Frais débités de votre wallet USD", "Fees debited from your USD wallet")}>
              {p ? (
                <dl className="space-y-2 p-4 text-sm">
                  <Row k={tr("Création VISA", "VISA creation")} v={money(p.creation_fees?.VISA ?? p.creation_fee)} />
                  <Row k={tr("Création Mastercard", "Mastercard creation")} v={money(p.creation_fees?.MASTERCARD ?? p.creation_fee)} />
                  <Row k={tr("Solde chargé à la création", "Balance loaded at creation")} v={money(p.creation_prefund ?? "0")} />
                  <Row k={tr("Recharge", "Top-up")} v={`${Number(p.fund_fee_percent)} % + ${money(p.fund_fee_fixed)}`} />
                  <Row k={tr("Retrait", "Withdrawal")} v={`${Number(p.withdraw_fee_percent)} % + ${money(p.withdraw_fee_fixed)}`} />
                  <Row k={tr("Mensuel / carte", "Monthly / card")} v={money(p.monthly_fee)} />
                  <div className="my-2 border-t" />
                  <Row k={tr("Recharge min → max", "Top-up min → max")} v={`${money(p.limits.min_fund_amount)} → ${money(p.limits.max_fund_amount)}`} />
                  <Row k={tr("Par jour / carte", "Per day / card")} v={money(p.limits.daily_fund_limit_per_card)} />
                  <Row k={tr("Solde max carte", "Max card balance")} v={money(p.limits.max_card_balance)} />
                  <Row k={tr("Cartes / utilisateur", "Cards / user")} v={String(p.limits.max_cards_per_end_user)} />
                </dl>
              ) : (
                <p className="p-4 text-sm text-muted-foreground">—</p>
              )}
            </Panel>
          </div>

          {data.operations.open > 0 && (
            <Link
              href="/cards/operations?status=open"
              className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-sm hover:bg-muted/40"
            >
              <Hourglass className="h-5 w-5 text-violet-600" />
              <p className="flex-1">
                {tr(
                  "Opérations en attente de confirmation : le montant reste réservé et sera crédité ou remboursé automatiquement. Ne les relancez pas.",
                  "Operations awaiting confirmation: the amount stays reserved and will be credited or refunded automatically. Do not retry them.",
                )}
              </p>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </>
      ) : null}
    </Shell>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium tabular-nums">{v}</dd>
    </div>
  )
}
