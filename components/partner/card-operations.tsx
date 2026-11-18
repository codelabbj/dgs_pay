"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, dateTime, money, type CardOperation, type Paginated } from "@/lib/partner-api"
import { useCardTabs } from "./cards-overview"
import { EmptyState, ErrorBanner, Loading, Mono, Pager, Panel, Shell, StatusPill, useTr } from "./kit"

export const OP_LABEL: Record<string, [string, string]> = {
  create: ["Création", "Creation"],
  fund: ["Recharge", "Top-up"],
  withdraw: ["Retrait", "Withdrawal"],
  terminate: ["Résiliation", "Termination"],
  provider_charge: ["Frais réseau refacturé", "Network fee"],
  monthly_fee: ["Frais mensuel", "Monthly fee"],
  termination_refund: ["Solde restitué", "Balance returned"],
}

const PAGE_SIZE = 25

export function CardOperations() {
  const tr = useTr()
  const tabs = useCardTabs()
  const params = useSearchParams()
  const [status, setStatus] = useState(params.get("status") || "all")
  const [kind, setKind] = useState("all")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<CardOperation> | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setError("")
    try {
      setData((await api<Paginated<CardOperation>>("maplerad/operations/", { query: { status, kind, q, page, page_size: PAGE_SIZE } })).data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    }
  }, [status, kind, q, page])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  return (
    <Shell
      eyebrow={tr("Cartes virtuelles", "Virtual cards")}
      title={tr("Opérations carte", "Card operations")}
      description={tr(
        "« Confirmation en cours » : le réseau n’a pas encore répondu. Le montant reste réservé et DGS tranche automatiquement — ne relancez jamais l’opération.",
        "“Awaiting confirmation”: the network hasn’t answered yet. The amount stays reserved and DGS settles it automatically — never retry the operation.",
      )}
      tabs={tabs}
    >
      <Panel>
        <div className="flex flex-col gap-2 border-b p-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder={tr("client_reference, utilisateur, référence AGG-…", "client_reference, user, AGG- reference…")}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="md:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("Tous statuts", "All statuses")}</SelectItem>
              <SelectItem value="open">{tr("En attente", "Pending")}</SelectItem>
              <SelectItem value="success">{tr("Réussies", "Successful")}</SelectItem>
              <SelectItem value="failed">{tr("Échouées", "Failed")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={kind} onValueChange={(v) => { setKind(v); setPage(1) }}>
            <SelectTrigger className="md:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("Tous types", "All types")}</SelectItem>
              {Object.entries(OP_LABEL).map(([k, [fr, en]]) => (
                <SelectItem key={k} value={k}>{tr(fr, en)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <div className="p-3"><ErrorBanner message={error} onRetry={load} /></div>}
        {!data ? (
          <Loading />
        ) : data.results.length === 0 ? (
          <EmptyState title={tr("Aucune opération", "No operation")} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr("Opération", "Operation")}</TableHead>
                    <TableHead>{tr("Carte · utilisateur", "Card · user")}</TableHead>
                    <TableHead>{tr("Statut", "Status")}</TableHead>
                    <TableHead className="text-right">{tr("Montant · frais", "Amount · fee")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.results.map((op) => {
                    const [fr, en] = OP_LABEL[op.kind] || [op.kind, op.kind]
                    return (
                      <TableRow key={op.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{tr(fr, en)}</p>
                          <Mono>{op.client_reference || op.reference || op.id.slice(0, 8)}</Mono>
                          <p className="text-[11px] text-muted-foreground">{dateTime(op.created_at)}</p>
                        </TableCell>
                        <TableCell>
                          {op.card_id ? (
                            <Link href={`/cards/${encodeURIComponent(op.card_id)}`} className="font-mono text-xs text-primary hover:underline">
                              {op.card_id.slice(0, 16)}…
                            </Link>
                          ) : (
                            <Mono>—</Mono>
                          )}
                          <p className="text-xs">{op.end_user_ref || "—"}</p>
                        </TableCell>
                        <TableCell className="max-w-[18rem]">
                          <StatusPill status={op.status} />
                          {op.error && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{op.error}</p>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <p className="font-medium">{money(op.amount)}</p>
                          <p className="text-[11px] text-muted-foreground">{money(op.fee)}</p>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <Pager page={page} pageSize={PAGE_SIZE} count={data.count} onPage={setPage} />
          </>
        )}
      </Panel>
    </Shell>
  )
}
