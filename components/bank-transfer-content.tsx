"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { smartFetch } from "@/utils/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react"

interface Bank {
  code: string
  name: string
}

interface ResolvedAccount {
  account_name?: string
  account_number?: string
  bank_code?: string
  [key: string]: unknown
}

function extractBanks(payload: unknown): Bank[] {
  if (!payload) return []
  if (Array.isArray(payload)) {
    return payload
      .map((b: any) => ({
        code: String(b.code || b.bank_code || ""),
        name: String(b.name || b.bank_name || ""),
      }))
      .filter((b) => b.code && b.name)
  }
  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>
    const nested = obj.data ?? obj.banks ?? obj.results
    if (Array.isArray(nested)) return extractBanks(nested)
    if (nested && typeof nested === "object") {
      const nestedObj = nested as Record<string, unknown>
      return extractBanks(nestedObj.data ?? nestedObj.banks ?? nestedObj.results)
    }
  }
  return []
}

function extractError(errorData: any, fallback: string): string {
  if (!errorData) return fallback
  if (typeof errorData.error === "string") return errorData.error
  if (typeof errorData.detail === "string") return errorData.detail
  if (typeof errorData.message === "string") return errorData.message
  if (typeof errorData === "object") {
    return Object.entries(errorData)
      .map(([field, errors]) =>
        Array.isArray(errors) ? `${field}: ${errors.join(", ")}` : `${field}: ${errors}`
      )
      .join("\n")
  }
  return fallback
}

export function BankTransferContent() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const [banks, setBanks] = useState<Bank[]>([])
  const [operatorCode, setOperatorCode] = useState("")
  const [search, setSearch] = useState("")
  const [banksLoading, setBanksLoading] = useState(false)
  const [banksError, setBanksError] = useState<string | null>(null)

  const [bankCode, setBankCode] = useState("")
  const [selectedBankName, setSelectedBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [resolved, setResolved] = useState<ResolvedAccount | null>(null)
  const [resolveLoading, setResolveLoading] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)

  const [amount, setAmount] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [description, setDescription] = useState("")
  const [clientReference, setClientReference] = useState("")
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null)

  const selectedBank = useMemo(() => {
    const fromList = banks.find((b) => b.code === bankCode)
    if (fromList) return fromList
    if (bankCode && selectedBankName) return { code: bankCode, name: selectedBankName }
    return null
  }, [banks, bankCode, selectedBankName])

  const loadBanks = useCallback(async (searchTerm = "") => {
    try {
      setBanksLoading(true)
      setBanksError(null)
      const params = new URLSearchParams()
      // Ouverture / liste courte = 20 ; recherche = jusqu'à 50
      const q = searchTerm.trim()
      params.set("limit", q ? "50" : "20")
      if (q) params.set("search", q)

      const res = await smartFetch(`${baseUrl}/api/v2/banks/?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(extractError(data, `Erreur ${res.status}`))
      }

      const list = extractBanks(data)
      setBanks(list)
      // Ne garder que si le backend a bien résolu un opérateur NGN
      // (évite d'envoyer Moov BJ / XOF par erreur sur bank-transfer)
      if (data?.operator_code) {
        setOperatorCode(String(data.operator_code))
      }
      if (!list.length) {
        setBanksError(
          q
            ? `Aucune banque pour « ${q} ».`
            : "Aucune banque trouvée. Vérifie permission Pal NGN / clés Pal."
        )
      }
    } catch (err) {
      setBanks([])
      setBanksError(err instanceof Error ? err.message : "Impossible de charger les banques")
    } finally {
      setBanksLoading(false)
    }
  }, [baseUrl])

  // Ouverture (search="") → 20 banques ; saisie → recherche API après 350ms
  useEffect(() => {
    const term = search.trim()
    const timer = setTimeout(() => {
      loadBanks(term)
    }, term ? 350 : 0)
    return () => clearTimeout(timer)
  }, [search, loadBanks])

  const handleResolve = async () => {
    try {
      setResolveLoading(true)
      setResolveError(null)
      setResolved(null)
      setTransferSuccess(null)

      // Pas d'operator_code forcé : le backend choisit uniquement un opérateur NGN
      const body: Record<string, string> = {
        bank_code: bankCode,
        account_number: accountNumber.replace(/\D/g, ""),
      }

      const res = await smartFetch(`${baseUrl}/api/v2/banks/resolve-account/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(extractError(data, `Erreur ${res.status}`))
      }

      const account = (data?.data && typeof data.data === "object" ? data.data : data) as ResolvedAccount
      setResolved(account)

      const accountName = String(account.account_name || "").trim()
      if (accountName) {
        const parts = accountName.split(/\s+/).filter(Boolean)
        if (parts.length >= 2) {
          setFirstName(parts[0])
          setLastName(parts.slice(1).join(" "))
        } else if (parts.length === 1) {
          setFirstName(parts[0])
        }
      }
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "Vérification échouée")
    } finally {
      setResolveLoading(false)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setTransferLoading(true)
      setTransferError(null)
      setTransferSuccess(null)

      // Ne pas envoyer Moov BJ / XOF : auto-résolution NGN côté API
      const payload: Record<string, unknown> = {
        amount: parseInt(amount, 10),
        account_number: accountNumber.replace(/\D/g, ""),
        bank_code: bankCode,
        bank_name: selectedBank?.name || "",
        beneficiary_first_name: firstName.trim(),
        beneficiary_last_name: lastName.trim(),
        description: description.trim(),
        client_reference:
          clientReference.trim() ||
          `BANK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      }

      const res = await smartFetch(`${baseUrl}/api/v2/bank-transfer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(extractError(data, `Erreur ${res.status}`))
      }

      setTransferSuccess(
        `Virement créé — réf. ${data.reference || "N/A"} · statut ${data.status_display || data.status || "pending"}`
      )
      setAmount("")
      setDescription("")
      setClientReference("")
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "Échec du virement")
    } finally {
      setTransferLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6 pb-20 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Virement bancaire NGN
        </h1>
        <p className="text-neutral-500 mt-1">
          Flux Postman : liste banques → vérifier compte → virement (wallet NGN)
        </p>
        {operatorCode && (
          <Badge variant="outline" className="mt-2">
            Opérateur: {operatorCode}
          </Badge>
        )}
      </div>

      {/* Step 1 — Banks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            1. Banques NGN
          </CardTitle>
          <CardDescription>
            À l’ouverture : 20 premières banques. Tape pour rechercher en live (API Pal).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="bank-search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bank-search"
                  className="pl-9"
                  placeholder="Tape pour filtrer (Access, PALMPAY…)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {banksLoading ? "Recherche en cours…" : "Recherche API automatique pendant la saisie"}
              </p>
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearch("")}
                disabled={banksLoading}
                title="Réinitialiser la liste (20 premières)"
              >
                {banksLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {banksError && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{banksError}</span>
            </div>
          )}

          <div>
            <Label>Banque</Label>
            <Select
              value={bankCode}
              onValueChange={(v) => {
                const bank = banks.find((b) => b.code === v)
                setBankCode(v)
                setSelectedBankName(bank?.name || "")
                setResolved(null)
                setResolveError(null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={banksLoading ? "Chargement…" : "Choisir une banque"} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {banks.map((bank) => (
                  <SelectItem key={bank.code} value={bank.code}>
                    {bank.name} ({bank.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {banksLoading ? "…" : `${banks.length} banque(s)${search.trim() ? " (filtre)" : " (top 20)"}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 — Resolve */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" />
            2. Vérifier le compte
          </CardTitle>
          <CardDescription>
            POST /api/v2/banks/resolve-account/
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="account-number">Numéro de compte</Label>
            <Input
              id="account-number"
              inputMode="numeric"
              placeholder="Ex: 0123456789"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value)
                setResolved(null)
              }}
            />
          </div>
          <Button
            type="button"
            onClick={handleResolve}
            disabled={!bankCode || accountNumber.replace(/\D/g, "").length < 5 || resolveLoading}
          >
            {resolveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            Vérifier le compte
          </Button>

          {resolveError && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{resolveError}</span>
            </div>
          )}

          {resolved && (
            <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">
                  {String(resolved.account_name || "Compte validé")}
                </p>
                <p className="text-xs opacity-80">
                  {String(resolved.account_number || accountNumber)} · banque{" "}
                  {String(resolved.bank_code || bankCode)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3 — Transfer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5" />
            3. Envoyer le virement
          </CardTitle>
          <CardDescription>
            POST /api/v2/bank-transfer/ — débit wallet NGN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Montant (NGN) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  required
                  placeholder="5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>Banque sélectionnée</Label>
                <Input
                  readOnly
                  value={
                    selectedBank
                      ? `${selectedBank.name} (${selectedBank.code})`
                      : "—"
                  }
                />
              </div>
              <div>
                <Label htmlFor="first-name">Prénom bénéficiaire *</Label>
                <Input
                  id="first-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="last-name">Nom bénéficiaire *</Label>
                <Input
                  id="last-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Paiement fournisseur…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="client-ref">Référence client (optionnel)</Label>
              <Input
                id="client-ref"
                placeholder="VIR-2024-001"
                value={clientReference}
                onChange={(e) => setClientReference(e.target.value)}
              />
            </div>

            {transferError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="whitespace-pre-wrap">{transferError}</span>
              </div>
            )}
            {transferSuccess && (
              <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{transferSuccess}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={
                transferLoading ||
                !bankCode ||
                !amount ||
                !firstName.trim() ||
                !lastName.trim() ||
                accountNumber.replace(/\D/g, "").length < 5
              }
              className="w-full sm:w-auto"
            >
              {transferLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer le virement
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
