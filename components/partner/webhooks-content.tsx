"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { Check, Copy, KeyRound, RotateCw, ShieldCheck, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, dateTime, type Paginated } from "@/lib/partner-api"
import { ConfirmDialog, EmptyState, ErrorBanner, Loading, Mono, Pager, Panel, Shell, useTr } from "./kit"

interface Config {
  callback_url: string
  signing_enabled: boolean
  signature: { header: string; algorithm: string; timestamp_header: string; event_id_header: string; tolerance_seconds: number }
  event_types: { type: string; description: string }[]
  undelivered: number
}

interface OutboxEvent {
  uid: string
  event_id: string
  event_type: string
  delivered: boolean
  attempts: number
  last_status_code: number | null
  last_error: string
  created_at: string
  delivered_at: string | null
  payload: any
}

const VERIFY_SNIPPET = `import hmac, hashlib, time

def verify_dgs(raw_body: bytes, headers: dict, secret: str) -> bool:
    signature = headers.get("X-Dgs-Signature", "")
    timestamp = int(headers.get("X-Dgs-Timestamp", "0"))
    if abs(time.time() - timestamp) > 300:          # anti-rejeu
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

# Dédoublonnez avec X-Dgs-Event-Id, répondez 2xx vite,
# puis revérifiez l'état via l'API avant de créditer quoi que ce soit.`

const API_ROUTES: [string, string, string, string][] = [
  ["GET", "/api/v2/maplerad/cards/program/", "Frais et limites de votre programme", "Your program fees and limits"],
  ["POST", "/api/v2/maplerad/customers/", "Enrôler un utilisateur (idempotent par external_ref)", "Enroll a user (idempotent by external_ref)"],
  ["POST", "/api/v2/maplerad/cards/", "Créer une carte {customer_id, brand, client_reference}", "Create a card {customer_id, brand, client_reference}"],
  ["GET", "/api/v2/maplerad/cards/?external_ref=…", "Cartes (filtres status, q, page)", "Cards (filters status, q, page)"],
  ["GET", "/api/v2/maplerad/cards/<id>/", "Détail avec PAN/CVV — à relayer au seul porteur, jamais stocker", "Detail with PAN/CVV — relay to the holder only, never store"],
  ["POST", "/api/v2/maplerad/cards/<id>/fund/", "Recharger {amount, client_reference} → 201 / 202 / 422", "Top up {amount, client_reference} → 201 / 202 / 422"],
  ["POST", "/api/v2/maplerad/cards/<id>/withdraw/", "Retirer {amount, client_reference} → 201 / 202 / 422", "Withdraw {amount, client_reference} → 201 / 202 / 422"],
  ["POST", "/api/v2/maplerad/cards/<id>/freeze/ · unfreeze/", "Geler / dégeler", "Freeze / unfreeze"],
  ["POST", "/api/v2/maplerad/cards/<id>/terminate/", "Résilier (solde reversé sans frais)", "Terminate (balance returned, no fee)"],
  ["GET", "/api/v2/maplerad/cards/<id>/ledger/ · transactions/", "Historique DGS · transactions réseau", "DGS history · network transactions"],
  ["GET", "/api/v2/maplerad/operations/<client_reference>/", "État d'une opération (rapprochement)", "Operation status (reconciliation)"],
  ["GET", "/api/v2/maplerad/crypto/addresses/", "Adresses de dépôt crypto", "Crypto deposit addresses"],
  ["GET", "/api/v2/transactions/?channel=card|crypto|mobile|bank", "Transactions filtrées par canal", "Transactions filtered by channel"],
]

export function WebhooksContent() {
  const tr = useTr()
  const [config, setConfig] = useState<Config | null>(null)
  const [error, setError] = useState("")
  const [rotateOpen, setRotateOpen] = useState(false)
  const [secret, setSecret] = useState("")
  const [copied, setCopied] = useState(false)

  const loadConfig = useCallback(async () => {
    setError("")
    try {
      setConfig((await api<Config>("partner/webhooks/")).data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return (
    <Shell
      eyebrow={tr("Développeurs", "Developers")}
      title={tr("Webhooks & événements", "Webhooks & events")}
      description={tr(
        "DGS vous notifie de chaque changement (transactions, cartes, crypto) par un POST signé sur votre URL de callback, rejoué jusqu’à ce que vous répondiez 2xx.",
        "DGS notifies you of every change (transactions, cards, crypto) with a signed POST to your callback URL, retried until you answer 2xx.",
      )}
    >
      {error && <ErrorBanner message={error} onRetry={loadConfig} />}
      {!config ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title={tr("Réception", "Delivery")} className="lg:col-span-2">
              <div className="space-y-4 p-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{tr("URL de callback", "Callback URL")}</p>
                  <p className="mt-1 break-all font-mono text-xs">{config.callback_url || tr("Non configurée — renseignez-la dans Développeurs.", "Not set — configure it in Developers.")}</p>
                </div>
                <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    {config.signing_enabled ? (
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                    ) : (
                      <ShieldOff className="mt-0.5 h-4 w-4 text-amber-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {config.signing_enabled ? tr("Événements signés", "Signed events") : tr("Événements non signés", "Unsigned events")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {config.signature.header} = {config.signature.algorithm} · {config.signature.timestamp_header} ·{" "}
                        {config.signature.event_id_header}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant={config.signing_enabled ? "outline" : "default"} onClick={() => setRotateOpen(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {config.signing_enabled ? tr("Régénérer le secret", "Rotate secret") : tr("Générer le secret", "Generate secret")}
                  </Button>
                </div>
                {secret && (
                  <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10">
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-300">
                      {tr("Copiez ce secret maintenant : il ne sera plus jamais affiché.", "Copy this secret now: it will never be shown again.")}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 break-all text-xs">{secret}</code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          await navigator.clipboard.writeText(secret)
                          setCopied(true)
                        }}
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
            <Panel title={tr("Vérifier la signature", "Verify the signature")}>
              <pre className="max-h-80 overflow-auto p-4 text-[11px] leading-relaxed">{VERIFY_SNIPPET}</pre>
            </Panel>
          </div>

          <Tabs defaultValue="log">
            <TabsList>
              <TabsTrigger value="log">
                {tr("Journal", "Log")}
                {config.undelivered > 0 && (
                  <span className="ml-2 rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">{config.undelivered}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="types">{tr("Types d’événements", "Event types")}</TabsTrigger>
              <TabsTrigger value="api">{tr("API cartes & crypto", "Cards & crypto API")}</TabsTrigger>
            </TabsList>
            <TabsContent value="log">
              <EventsLog />
            </TabsContent>
            <TabsContent value="types">
              <Panel>
                <ul className="divide-y">
                  {config.event_types.map((e) => (
                    <li key={e.type} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                      <code className="w-56 shrink-0 text-xs font-semibold">{e.type}</code>
                      <span className="text-sm text-muted-foreground">{e.description}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </TabsContent>
            <TabsContent value="api">
              <Panel
                description={tr(
                  "Toujours envoyer un client_reference unique : un renvoi rend l’opération existante, jamais un deuxième débit. 202 = en attente : ne remboursez pas, attendez l’événement card.operation.*.",
                  "Always send a unique client_reference: a retry returns the existing operation, never a second debit. 202 = pending: do not refund, wait for the card.operation.* event.",
                )}
              >
                <ul className="divide-y">
                  {API_ROUTES.map(([method, path, fr, en]) => (
                    <li key={path + method} className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:gap-4">
                      <span
                        className={`w-12 shrink-0 text-center text-[11px] font-bold ${method === "GET" ? "text-sky-600" : "text-emerald-600"}`}
                      >
                        {method}
                      </span>
                      <code className="text-xs md:w-[26rem] md:shrink-0">{path}</code>
                      <span className="text-sm text-muted-foreground">{tr(fr, en)}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </TabsContent>
          </Tabs>
        </>
      )}

      <ConfirmDialog
        open={rotateOpen}
        onOpenChange={setRotateOpen}
        title={tr("Générer un secret de signature", "Generate a signing secret")}
        description={tr(
          "L’ancien secret cesse immédiatement de fonctionner. Mettez à jour votre serveur juste après, sinon vos vérifications échoueront.",
          "The previous secret stops working immediately. Update your server right after, or your verification will fail.",
        )}
        confirmLabel={tr("Générer", "Generate")}
        onConfirm={async (totp) => {
          const { data } = await api<{ webhook_signing_secret: string }>("partner/webhooks/signing-secret/", { method: "POST", totp })
          setSecret(data.webhook_signing_secret)
          setCopied(false)
          await loadConfig()
        }}
      />
    </Shell>
  )
}

function EventsLog() {
  const tr = useTr()
  const [delivered, setDelivered] = useState("all")
  const [eventType, setEventType] = useState("all")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<OutboxEvent> | null>(null)
  const [error, setError] = useState("")
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState("")

  const load = useCallback(async () => {
    setError("")
    try {
      setData((await api<Paginated<OutboxEvent>>("partner/webhooks/events/", { query: { delivered, event_type: eventType, page, page_size: 25 } })).data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    }
  }, [delivered, eventType, page])

  useEffect(() => {
    load()
  }, [load])

  const retry = async (uid: string) => {
    setBusy(uid)
    try {
      await api(`partner/webhooks/events/${uid}/retry/`, { method: "POST" })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy("")
    }
  }

  return (
    <Panel>
      <div className="flex flex-col gap-2 border-b p-3 md:flex-row">
        <Select value={delivered} onValueChange={(v) => { setDelivered(v); setPage(1) }}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr("Tous", "All")}</SelectItem>
            <SelectItem value="false">{tr("Non livrés", "Undelivered")}</SelectItem>
            <SelectItem value="true">{tr("Livrés", "Delivered")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={eventType} onValueChange={(v) => { setEventType(v); setPage(1) }}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr("Tous types", "All types")}</SelectItem>
            <SelectItem value="card.">card.*</SelectItem>
            <SelectItem value="card.transaction">card.transaction</SelectItem>
            <SelectItem value="card.operation.">card.operation.*</SelectItem>
            <SelectItem value="card.terminated">card.terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <div className="p-3"><ErrorBanner message={error} onRetry={load} /></div>}
      {!data ? (
        <Loading />
      ) : data.results.length === 0 ? (
        <EmptyState title={tr("Aucun événement", "No event")} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tr("Événement", "Event")}</TableHead>
                  <TableHead>{tr("Livraison", "Delivery")}</TableHead>
                  <TableHead className="hidden md:table-cell">{tr("Créé", "Created")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map((e) => (
                  <Fragment key={e.uid}>
                    <TableRow className="cursor-pointer" onClick={() => setOpen(open === e.uid ? null : e.uid)}>
                      <TableCell>
                        <p className="font-mono text-sm">{e.event_type}</p>
                        <Mono>{e.event_id}</Mono>
                      </TableCell>
                      <TableCell>
                        {e.delivered ? (
                          <span className="text-sm text-emerald-600">
                            {tr("Livré", "Delivered")} · HTTP {e.last_status_code}
                          </span>
                        ) : (
                          <div>
                            <span className="text-sm text-amber-600">
                              {tr("En attente", "Pending")} · {e.attempts} {tr("essai(s)", "attempt(s)")}
                            </span>
                            {e.last_error && <p className="max-w-[18rem] truncate text-[11px] text-muted-foreground">{e.last_error}</p>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{dateTime(e.created_at)}</TableCell>
                      <TableCell className="text-right">
                        {!e.delivered && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            disabled={busy === e.uid}
                            onClick={(ev) => {
                              ev.stopPropagation()
                              retry(e.uid)
                            }}
                          >
                            <RotateCw className={`h-4 w-4 ${busy === e.uid ? "animate-spin" : ""}`} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {open === e.uid && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/30">
                          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all text-[11px]">{JSON.stringify(e.payload, null, 2)}</pre>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
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
