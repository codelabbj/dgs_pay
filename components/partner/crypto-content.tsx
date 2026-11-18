"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Copy, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, dateTime, money, type Paginated } from "@/lib/partner-api"
import { EmptyState, ErrorBanner, Loading, Mono, Pager, Panel, Shell, StatusPill, useTr } from "./kit"

interface CryptoTx {
  uid: string
  reference: string
  type_trans: "payin" | "payout"
  amount: string
  currency: string
  status: string
  client_reference: string | null
  commission_amount: string
  error_message: string | null
  created_at: string
  channel_details: {
    coin: string
    chain: string
    address: string
    tx_hash: string
    received_amount: string | null
    expected_amount: string | null
    unsolicited: boolean
    outcome_unknown: boolean
  }
}

interface CryptoAddress {
  address: string
  coin: string
  chain: string
  customer_id: string
  external_ref: string
  deposits: number
  total_received: string
  created_at: string
}

const EXPLORERS: Record<string, string> = {
  tron: "https://tronscan.org/#/transaction/",
  solana: "https://solscan.io/tx/",
  eth: "https://etherscan.io/tx/",
  bsc: "https://bscscan.com/tx/",
  polygon: "https://polygonscan.com/tx/",
  base: "https://basescan.org/tx/",
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-6 w-6"
      onClick={async (e) => {
        e.stopPropagation()
        await navigator.clipboard.writeText(value)
        setDone(true)
        setTimeout(() => setDone(false), 1200)
      }}
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

function short(value: string, n = 8) {
  return value.length > n * 2 + 1 ? `${value.slice(0, n)}…${value.slice(-n)}` : value
}

export function CryptoContent() {
  const tr = useTr()
  return (
    <Shell
      eyebrow="Crypto"
      title={tr("Opérations crypto", "Crypto operations")}
      description={tr(
        "Dépôts et envois en stablecoins (USDT, USDC…) de vos utilisateurs. Un dépôt n’est crédité qu’une fois, à hauteur du montant réellement reçu on-chain.",
        "Your users’ stablecoin (USDT, USDC…) deposits and payouts. A deposit is credited once, for the amount actually received on-chain.",
      )}
    >
      <Tabs defaultValue="tx">
        <TabsList>
          <TabsTrigger value="tx">{tr("Transactions", "Transactions")}</TabsTrigger>
          <TabsTrigger value="addresses">{tr("Adresses de dépôt", "Deposit addresses")}</TabsTrigger>
        </TabsList>
        <TabsContent value="tx">
          <CryptoTransactions />
        </TabsContent>
        <TabsContent value="addresses">
          <CryptoAddresses />
        </TabsContent>
      </Tabs>
    </Shell>
  )
}

function CryptoTransactions() {
  const tr = useTr()
  const [type, setType] = useState("all")
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ count: number; results: CryptoTx[] } | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setError("")
    try {
      const { data } = await api<{ count: number; results: CryptoTx[] }>("transactions/", {
        query: { channel: "crypto", type, status, search, page, page_size: 20 },
      })
      setData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    }
  }, [type, status, search, page])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  return (
    <Panel>
      <div className="flex flex-col gap-2 border-b p-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder={tr("Référence, client_reference…", "Reference, client_reference…")} className="pl-9" />
        </div>
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr("Dépôts et envois", "Deposits and payouts")}</SelectItem>
            <SelectItem value="payin">{tr("Dépôts", "Deposits")}</SelectItem>
            <SelectItem value="payout">{tr("Envois", "Payouts")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr("Tous statuts", "All statuses")}</SelectItem>
            <SelectItem value="pending">{tr("En attente", "Pending")}</SelectItem>
            <SelectItem value="processing">{tr("En cours", "Processing")}</SelectItem>
            <SelectItem value="success">{tr("Réussies", "Successful")}</SelectItem>
            <SelectItem value="failed">{tr("Échouées", "Failed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <div className="p-3"><ErrorBanner message={error} onRetry={load} /></div>}
      {!data ? (
        <Loading />
      ) : data.results.length === 0 ? (
        <EmptyState title={tr("Aucune opération crypto", "No crypto operation")} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tr("Opération", "Operation")}</TableHead>
                  <TableHead>{tr("Jeton · réseau", "Token · network")}</TableHead>
                  <TableHead>{tr("Adresse · hash", "Address · hash")}</TableHead>
                  <TableHead>{tr("Statut", "Status")}</TableHead>
                  <TableHead className="text-right">{tr("Montant", "Amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map((tx) => {
                  const d = tx.channel_details || ({} as CryptoTx["channel_details"])
                  const explorer = EXPLORERS[(d.chain || "").toLowerCase()]
                  return (
                    <TableRow key={tx.uid}>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {tx.type_trans === "payin" ? tr("Dépôt", "Deposit") : tr("Envoi", "Payout")}
                          {d.unsolicited && (
                            <span className="ml-2 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                              {tr("spontané", "unsolicited")}
                            </span>
                          )}
                        </p>
                        <Mono>{tx.reference}</Mono>
                        <p className="text-[11px] text-muted-foreground">{dateTime(tx.created_at)}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium">{d.coin || tx.currency}</span>
                        <span className="text-muted-foreground"> · {d.chain || "—"}</span>
                      </TableCell>
                      <TableCell>
                        {d.address ? (
                          <span className="inline-flex items-center gap-1">
                            <Mono>{short(d.address)}</Mono>
                            <CopyButton value={d.address} />
                          </span>
                        ) : (
                          <Mono>—</Mono>
                        )}
                        {d.tx_hash && (
                          <div>
                            {explorer ? (
                              <a href={`${explorer}${d.tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-primary hover:underline">
                                {short(d.tx_hash)}
                              </a>
                            ) : (
                              <Mono>{short(d.tx_hash)}</Mono>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[16rem]">
                        <StatusPill status={d.outcome_unknown && !["success", "failed"].includes(tx.status) ? "unknown" : tx.status} />
                        {tx.error_message && <p className="mt-1 text-[11px] text-muted-foreground">{tx.error_message}</p>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <p className="font-medium">{money(tx.amount, d.coin || tx.currency)}</p>
                        {d.expected_amount && (
                          <p className="text-[11px] text-muted-foreground">
                            {tr("attendu", "expected")} {money(d.expected_amount, d.coin || tx.currency)}
                          </p>
                        )}
                        {Number(tx.commission_amount) > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            {tr("frais", "fee")} {money(tx.commission_amount, d.coin || tx.currency)}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Pager page={page} pageSize={20} count={data.count} onPage={setPage} />
        </>
      )}
    </Panel>
  )
}

function CryptoAddresses() {
  const tr = useTr()
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<CryptoAddress> | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setError("")
    try {
      setData((await api<Paginated<CryptoAddress>>("maplerad/crypto/addresses/", { query: { q, page, page_size: 25 } })).data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    }
  }, [q, page])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  return (
    <Panel
      description={tr(
        "Chaque utilisateur a une adresse permanente par jeton et réseau. Tout dépôt reçu dessus vous est notifié et crédité, même sans demande préalable.",
        "Each user has a permanent address per token and network. Any deposit received on it is notified and credited to you, even without a prior request.",
      )}
      title={tr("Adresses de dépôt", "Deposit addresses")}
    >
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder={tr("Adresse ou client Maplerad", "Address or Maplerad customer")} className="pl-9" />
        </div>
      </div>
      {error && <div className="p-3"><ErrorBanner message={error} onRetry={load} /></div>}
      {!data ? (
        <Loading />
      ) : data.results.length === 0 ? (
        <EmptyState title={tr("Aucune adresse", "No address")} hint={tr("Une adresse est créée au premier dépôt crypto d’un utilisateur.", "An address is created on a user’s first crypto deposit.")} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tr("Adresse", "Address")}</TableHead>
                  <TableHead>{tr("Jeton · réseau", "Token · network")}</TableHead>
                  <TableHead>{tr("Utilisateur", "User")}</TableHead>
                  <TableHead className="text-right">{tr("Reçu", "Received")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map((a) => (
                  <TableRow key={a.address}>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <Mono className="text-foreground">{short(a.address, 10)}</Mono>
                        <CopyButton value={a.address} />
                      </span>
                      <p className="text-[11px] text-muted-foreground">{dateTime(a.created_at)}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{a.coin}</span> <span className="text-muted-foreground">· {a.chain}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{a.external_ref || "—"}</p>
                      <Mono>{a.customer_id.slice(0, 14)}</Mono>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <p className="font-medium">{money(a.total_received, a.coin)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {a.deposits} {tr("dépôt(s)", "deposit(s)")}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager page={page} pageSize={25} count={data.count} onPage={setPage} />
        </>
      )}
    </Panel>
  )
}
