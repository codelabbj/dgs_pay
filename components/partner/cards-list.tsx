"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, dateTime, money, type Paginated, type PartnerCard } from "@/lib/partner-api"
import { useCardTabs } from "./cards-overview"
import { ComplianceBadge, EmptyState, ErrorBanner, Loading, Mono, Pager, Panel, Shell, StatusPill, useTr } from "./kit"

const PAGE_SIZE = 25

export function CardsList() {
  const tr = useTr()
  const tabs = useCardTabs()
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState(params.get("status") || "all")
  const [frozenBy, setFrozenBy] = useState(params.get("frozen_by") || "all")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<PartnerCard> | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setError("")
    try {
      setData((await api<Paginated<PartnerCard>>("maplerad/cards/", { query: { q, status, frozen_by: frozenBy, page, page_size: PAGE_SIZE } })).data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    }
  }, [q, status, frozenBy, page])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  return (
    <Shell eyebrow={tr("Cartes virtuelles", "Virtual cards")} title={tr("Cartes", "Cards")} tabs={tabs}>
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
              placeholder={tr("Votre identifiant utilisateur (external_ref), ID carte, PAN masqué…", "Your user id (external_ref), card id, masked PAN…")}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("Tous statuts", "All statuses")}</SelectItem>
              <SelectItem value="ACTIVE">{tr("Active", "Active")}</SelectItem>
              <SelectItem value="DISABLED">{tr("Gelée", "Frozen")}</SelectItem>
              <SelectItem value="PENDING">{tr("En création", "Creating")}</SelectItem>
              <SelectItem value="TERMINATED">{tr("Résiliée", "Terminated")}</SelectItem>
              <SelectItem value="FAILED">{tr("Échec", "Failed")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={frozenBy} onValueChange={(v) => { setFrozenBy(v); setPage(1) }}>
            <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("Tous gels", "All freezes")}</SelectItem>
              <SelectItem value="partner">{tr("Gelées par vous", "Frozen by you")}</SelectItem>
              <SelectItem value="dgs">{tr("Bloquées conformité", "Compliance blocked")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && <div className="p-3"><ErrorBanner message={error} onRetry={load} /></div>}
        {!data ? (
          <Loading />
        ) : data.results.length === 0 ? (
          <EmptyState
            title={tr("Aucune carte", "No cards")}
            hint={tr("Les cartes se créent via l’API : POST /api/v2/maplerad/cards/", "Cards are created through the API: POST /api/v2/maplerad/cards/")}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr("Carte", "Card")}</TableHead>
                    <TableHead>{tr("Utilisateur", "User")}</TableHead>
                    <TableHead>{tr("Statut", "Status")}</TableHead>
                    <TableHead className="text-right">{tr("Solde", "Balance")}</TableHead>
                    <TableHead className="hidden md:table-cell">{tr("Créée", "Created")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.results.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/cards/${encodeURIComponent(c.id)}`)}>
                      <TableCell>
                        <p className="font-medium">{c.masked_pan || "•••• ••••"}</p>
                        <Mono>{c.brand || "—"} · {c.id.slice(0, 18)}</Mono>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{c.external_ref || "—"}</p>
                        <Mono>{c.customer_id.slice(0, 14)}</Mono>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusPill status={c.status} />
                          <ComplianceBadge frozenBy={c.frozen_by} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{money(c.balance)}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{dateTime(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
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
