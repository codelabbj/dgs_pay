"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDownLeft, ArrowDownToLine, ArrowLeft, ArrowUpFromLine, ArrowUpRight, Ban, Lock, Minus, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  api,
  cardFee,
  dateTime,
  fromMinor,
  money,
  newReference,
  type CardOperation,
  type Paginated,
  type PartnerCard,
  type Program,
} from "@/lib/partner-api"
import { useCardTabs } from "./cards-overview"
import { OP_LABEL } from "./card-operations"
import { ComplianceBadge, ConfirmDialog, EmptyState, ErrorBanner, Loading, Mono, Panel, Shell, StatusPill, useTr } from "./kit"

interface LedgerRow {
  type: string
  direction: "credit" | "debit" | "none"
  amount: string
  fee: string
  description: string
  merchant: Record<string, any>
  status: string
  occurred_at: string
}

const LEDGER_LABEL: Record<string, [string, string]> = {
  fund: ["Recharge", "Top-up"],
  withdraw: ["Retrait", "Withdrawal"],
  purchase: ["Achat", "Purchase"],
  settlement: ["Règlement", "Settlement"],
  reversal: ["Annulation", "Reversal"],
  refund: ["Remboursement marchand", "Merchant refund"],
  decline: ["Refus", "Declined"],
  provider_fee: ["Frais", "Fee"],
  termination: ["Résiliation", "Termination"],
  other: ["Autre", "Other"],
}

type Action = "fund" | "withdraw" | "freeze" | "unfreeze" | "terminate" | null

export function CardDetail({ id }: { id: string }) {
  const tr = useTr()
  const tabs = useCardTabs()
  const [card, setCard] = useState<PartnerCard | null>(null)
  const [ledger, setLedger] = useState<LedgerRow[]>([])
  const [ops, setOps] = useState<CardOperation[]>([])
  const [maplerad, setMaplerad] = useState<any[] | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<Action>(null)
  const [amount, setAmount] = useState("")

  const safeId = encodeURIComponent(id)

  const load = useCallback(async () => {
    setError("")
    try {
      // /ledger/ renvoie la carte SANS données sensibles (jamais de PAN complet ni de CVV ici).
      const [l, o] = await Promise.all([
        api<{ card: PartnerCard; results: LedgerRow[] }>(`maplerad/cards/${safeId}/ledger/`),
        api<Paginated<CardOperation>>("maplerad/operations/", { query: { card_id: id, page_size: 50 } }),
      ])
      setCard(l.data.card)
      setLedger(l.data.results)
      setOps(o.data.results)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
    api<Program>("maplerad/cards/program/").then((r) => setProgram(r.data)).catch(() => setProgram(null))
  }, [id, safeId])

  useEffect(() => {
    load()
  }, [load])

  const loadMaplerad = async () => {
    if (maplerad) return
    try {
      const { data } = await api<any>(`maplerad/cards/${safeId}/transactions/`, { query: { page_size: 50 } })
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setMaplerad(rows)
    } catch {
      setMaplerad([])
    }
  }

  const amountNum = Number(amount.replace(",", "."))
  const fee = useMemo(() => {
    if (!program || !(amountNum > 0)) return 0
    return action === "fund"
      ? cardFee(amountNum, program.fund_fee_percent, program.fund_fee_fixed)
      : cardFee(amountNum, program.withdraw_fee_percent, program.withdraw_fee_fixed)
  }, [program, amountNum, action])

  const moveMoney = async (kind: "fund" | "withdraw", totp: string) => {
    const { data, status } = await api<CardOperation>(`maplerad/cards/${safeId}/${kind}/`, {
      method: "POST",
      body: { amount: amountNum.toFixed(2), client_reference: newReference(kind === "fund" ? "DASH-FUND" : "DASH-WD") },
      totp,
    })
    setAmount("")
    setNotice(
      status === 202
        ? tr(
            "Opération en attente de confirmation : le montant reste réservé et sera crédité ou remboursé automatiquement.",
            "Operation awaiting confirmation: the amount stays reserved and will be credited or refunded automatically.",
          )
        : kind === "fund"
          ? tr(`Carte rechargée de ${money(data.amount)}.`, `Card topped up with ${money(data.amount)}.`)
          : tr(`${money(data.amount)} retirés vers votre wallet USD.`, `${money(data.amount)} withdrawn to your USD wallet.`),
    )
    await load()
  }

  const dead = card && ["TERMINATED", "FAILED"].includes(card.status)
  const dgsFrozen = card?.frozen_by === "dgs"

  return (
    <Shell
      eyebrow={tr("Cartes virtuelles", "Virtual cards")}
      title={card ? card.masked_pan || tr("Carte en création", "Card being created") : tr("Carte", "Card")}
      description={card ? `${card.brand || "—"} · ${tr("utilisateur", "user")} ${card.external_ref || "—"}` : undefined}
      tabs={tabs}
      actions={
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href="/cards/list">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tr("Cartes", "Cards")}
            </Link>
          </Button>
          {card && !dead && !dgsFrozen && (
            <>
              {card.status === "ACTIVE" && (
                <Button size="sm" onClick={() => setAction("fund")} disabled={program?.suspended}>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  {tr("Recharger", "Top up")}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setAction("withdraw")}>
                <ArrowUpFromLine className="mr-2 h-4 w-4" />
                {tr("Retirer", "Withdraw")}
              </Button>
              {card.status === "DISABLED" ? (
                <Button size="sm" variant="outline" onClick={() => setAction("unfreeze")}>
                  <Unlock className="mr-2 h-4 w-4" />
                  {tr("Dégeler", "Unfreeze")}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setAction("freeze")}>
                  <Lock className="mr-2 h-4 w-4" />
                  {tr("Geler", "Freeze")}
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => setAction("terminate")}>
                <Ban className="mr-2 h-4 w-4" />
                {tr("Résilier", "Terminate")}
              </Button>
            </>
          )}
        </>
      }
    >
      {error && <ErrorBanner message={error} onRetry={load} />}
      {notice && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
          {notice}
        </div>
      )}
      {dgsFrozen && (
        <ErrorBanner
          message={tr(
            `Carte bloquée par la conformité DGS${card?.frozen_reason ? ` : ${card.frozen_reason}` : ""}. Contactez DGS pour la débloquer.`,
            `Card blocked by DGS compliance${card?.frozen_reason ? `: ${card.frozen_reason}` : ""}. Contact DGS to unblock it.`,
          )}
        />
      )}

      {loading && !card ? (
        <Loading />
      ) : card ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1F34] via-[#123456] to-[#1c4a7a] p-5 text-white shadow-lg">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/70">{card.brand || "CARD"} · USD</span>
                <StatusPill status={card.status} className="bg-white/10 text-white ring-white/20" />
              </div>
              <p className="mt-8 font-mono text-lg tracking-[0.2em]">{card.masked_pan || "•••• •••• •••• ••••"}</p>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/60">{tr("Solde", "Balance")}</p>
                  <p className="text-2xl font-semibold tabular-nums">{money(card.balance)}</p>
                  <p className="text-[11px] text-white/60">{dateTime(card.balance_synced_at)}</p>
                </div>
                <ComplianceBadge frozenBy={card.frozen_by} />
              </div>
            </div>
            <Panel title={tr("Identifiants", "Identifiers")} className="lg:col-span-2">
              <dl className="grid gap-x-6 gap-y-3 p-4 text-sm sm:grid-cols-2">
                {[
                  [tr("ID carte", "Card ID"), card.id],
                  [tr("Votre utilisateur (external_ref)", "Your user (external_ref)"), card.external_ref || "—"],
                  [tr("Client Maplerad", "Maplerad customer"), card.customer_id || "—"],
                  [tr("Référence création", "Creation reference"), card.reference || "—"],
                  [tr("Créée", "Created"), dateTime(card.created_at)],
                  [tr("Résiliée", "Terminated"), dateTime(card.terminated_at)],
                ].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="truncate font-mono text-xs">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>

          <Tabs defaultValue="ledger" onValueChange={(v) => v === "maplerad" && loadMaplerad()}>
            <TabsList>
              <TabsTrigger value="ledger">{tr("Historique", "History")}</TabsTrigger>
              <TabsTrigger value="ops">{tr("Opérations", "Operations")} ({ops.length})</TabsTrigger>
              <TabsTrigger value="maplerad">{tr("Transactions réseau", "Network transactions")}</TabsTrigger>
            </TabsList>
            <TabsContent value="ledger">
              <Panel>
                {ledger.length === 0 ? (
                  <EmptyState title={tr("Aucun mouvement", "No movement")} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{tr("Mouvement", "Movement")}</TableHead>
                          <TableHead className="hidden sm:table-cell">{tr("Marchand", "Merchant")}</TableHead>
                          <TableHead className="text-right">{tr("Montant", "Amount")}</TableHead>
                          <TableHead className="hidden md:table-cell">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledger.map((row, i) => {
                          const Icon = row.direction === "credit" ? ArrowDownLeft : row.direction === "debit" ? ArrowUpRight : Minus
                          const [fr, en] = LEDGER_LABEL[row.type] || [row.type, row.type]
                          return (
                            <TableRow key={`${row.occurred_at}-${i}`}>
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                                    <Icon className="h-3.5 w-3.5" />
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium">{tr(fr, en)}</p>
                                    <p className="max-w-[16rem] truncate text-xs text-muted-foreground">{row.description || row.status}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden text-sm sm:table-cell">{row.merchant?.name || "—"}</TableCell>
                              <TableCell className={`text-right font-medium tabular-nums ${row.direction === "credit" ? "text-emerald-600" : ""}`}>
                                {row.direction === "credit" ? "+" : row.direction === "debit" ? "−" : ""}
                                {money(row.amount)}
                              </TableCell>
                              <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{dateTime(row.occurred_at)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Panel>
            </TabsContent>
            <TabsContent value="ops">
              <Panel>
                {ops.length === 0 ? (
                  <EmptyState title={tr("Aucune opération", "No operation")} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{tr("Opération", "Operation")}</TableHead>
                          <TableHead>{tr("Statut", "Status")}</TableHead>
                          <TableHead className="text-right">{tr("Montant · frais", "Amount · fee")}</TableHead>
                          <TableHead className="hidden md:table-cell">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ops.map((op) => (
                          <TableRow key={op.id}>
                            <TableCell>
                              <p className="text-sm font-medium">{tr(...(OP_LABEL[op.kind] || [op.kind, op.kind]))}</p>
                              <Mono>{op.client_reference || op.reference || op.id.slice(0, 8)}</Mono>
                            </TableCell>
                            <TableCell>
                              <StatusPill status={op.status} />
                              {op.error && <p className="mt-1 max-w-[18rem] truncate text-[11px] text-muted-foreground">{op.error}</p>}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {money(op.amount)}
                              <p className="text-[11px] text-muted-foreground">{money(op.fee)}</p>
                            </TableCell>
                            <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{dateTime(op.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Panel>
            </TabsContent>
            <TabsContent value="maplerad">
              <Panel>
                {maplerad === null ? (
                  <Loading />
                ) : maplerad.length === 0 ? (
                  <EmptyState title={tr("Aucune transaction", "No transaction")} />
                ) : (
                  <ul className="divide-y">
                    {maplerad.map((tx: any, i: number) => {
                      const debit = String(tx.entry || tx.mode || "").toUpperCase() === "DEBIT"
                      return (
                        <li key={tx.id || i} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{tx.description || tx.merchant?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {dateTime(tx.created_at)} · {tx.status}
                            </p>
                          </div>
                          <p className={`text-sm font-semibold tabular-nums ${debit ? "" : "text-emerald-600"}`}>
                            {debit ? "−" : "+"}
                            {money(fromMinor(tx.amount), tx.currency || "USD")}
                          </p>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Panel>
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      <ConfirmDialog
        open={action === "fund" || action === "withdraw"}
        onOpenChange={(v) => {
          if (!v) {
            setAction(null)
            setAmount("")
          }
        }}
        title={action === "fund" ? tr("Recharger la carte", "Top up card") : tr("Retirer de la carte", "Withdraw from card")}
        description={
          action === "fund"
            ? tr("Débité de votre wallet USD DGS (montant + frais).", "Debited from your DGS USD wallet (amount + fee).")
            : tr(
                `Crédité sur votre wallet USD DGS, frais déduits. Solde carte : ${money(card?.balance)}.`,
                `Credited to your DGS USD wallet, fee deducted. Card balance: ${money(card?.balance)}.`,
              )
        }
        confirmLabel={action === "fund" ? tr("Recharger", "Top up") : tr("Retirer", "Withdraw")}
        canConfirm={amountNum > 0}
        onConfirm={(totp) => moveMoney(action === "withdraw" ? "withdraw" : "fund", totp)}
      >
        <div className="space-y-1.5">
          <Label htmlFor="card-amount">{tr("Montant (USD)", "Amount (USD)")}</Label>
          <Input id="card-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        {amountNum > 0 && program && (
          <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tr("Frais", "Fee")}</span>
              <span className="tabular-nums">{money(fee)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{action === "fund" ? tr("Total débité", "Total debited") : tr("Vous recevez", "You receive")}</span>
              <span className="tabular-nums">{money(action === "fund" ? amountNum + fee : Math.max(amountNum - fee, 0))}</span>
            </div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={action === "freeze" || action === "unfreeze"}
        onOpenChange={(v) => !v && setAction(null)}
        title={action === "freeze" ? tr("Geler la carte", "Freeze card") : tr("Dégeler la carte", "Unfreeze card")}
        description={
          action === "freeze"
            ? tr("Plus aucun paiement ne passera tant que la carte est gelée.", "No payment will go through while the card is frozen.")
            : tr("La carte redevient utilisable immédiatement.", "The card becomes usable immediately.")
        }
        confirmLabel={action === "freeze" ? tr("Geler", "Freeze") : tr("Dégeler", "Unfreeze")}
        onConfirm={async (totp) => {
          await api(`maplerad/cards/${safeId}/${action}/`, { method: "POST", totp })
          await load()
        }}
      />

      <ConfirmDialog
        open={action === "terminate"}
        onOpenChange={(v) => !v && setAction(null)}
        title={tr("Résilier la carte", "Terminate card")}
        description={tr(
          `Le solde (${money(card?.balance)}) est d’abord reversé sur votre wallet USD sans frais, puis la carte est fermée définitivement. Action irréversible.`,
          `The balance (${money(card?.balance)}) is first returned to your USD wallet with no fee, then the card is permanently closed. This cannot be undone.`,
        )}
        confirmLabel={tr("Résilier définitivement", "Terminate permanently")}
        destructive
        onConfirm={async (totp) => {
          await api(`maplerad/cards/${safeId}/terminate/`, {
            method: "POST",
            body: { client_reference: newReference("DASH-TERM") },
            totp,
          })
          setNotice(tr("Carte résiliée, solde reversé sur votre wallet USD.", "Card terminated, balance returned to your USD wallet."))
          await load()
        }}
      />
    </Shell>
  )
}
