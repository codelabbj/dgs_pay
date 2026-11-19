// Client des routes partenaire DGS (/api/v2/…) : cartes, crypto, webhooks signés.
import { smartFetch } from "@/utils/auth"

const BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/api/v2`

export class ApiError extends Error {
  status: number
  code?: string
  data?: any
  constructor(message: string, status: number, code?: string, data?: any) {
    super(message)
    this.status = status
    this.code = code
    this.data = data
  }
  get needsTotp() {
    return this.code === "totp_required" || this.code === "totp_invalid"
  }
}

function messageOf(data: any, status: number): string {
  if (!data) return `Erreur ${status}`
  if (typeof data === "string") return data
  if (typeof data.error === "string" && data.error.startsWith("totp")) return data.message || "Code 2FA requis."
  if (typeof data.error === "string") return data.error
  if (data.detail) return String(data.detail)
  if (data.message) return String(data.message)
  return `Erreur ${status}`
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: any; totp?: string; query?: Record<string, string | number | undefined> } = {},
): Promise<{ data: T; status: number }> {
  const params = new URLSearchParams()
  Object.entries(opts.query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== "all") params.append(k, String(v))
  })
  const qs = params.toString()
  const headers: Record<string, string> = {}
  if (opts.totp) headers["X-TOTP-Code"] = opts.totp
  const res = await smartFetch(`${BASE}/${path}${qs ? `?${qs}` : ""}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  let data: any = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok && res.status !== 202) {
    const code = data?.code || (typeof data?.error === "string" && data.error.startsWith("totp") ? data.error : undefined)
    throw new ApiError(messageOf(data, res.status), res.status, code, data)
  }
  return { data: data as T, status: res.status }
}

export function newReference(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 20)
      : Math.random().toString(36).slice(2, 14)
  return `${prefix}-${rand}`
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface PartnerCard {
  id: string
  reference: string
  customer_id: string
  external_ref: string
  status: string
  brand: string
  currency: string
  masked_pan: string
  name: string
  balance: string
  balance_synced_at: string | null
  frozen_by: string
  frozen_reason: string
  terminated_at: string | null
  created_at: string | null
}

export interface CardOperation {
  id: string
  kind: string
  status: string
  amount: string
  fee: string
  currency: string
  client_reference: string
  card_id: string | null
  end_user_ref: string
  reference: string | null
  error: string
  created_at: string | null
  resolved_at: string | null
}

export interface Program {
  currency: string
  creation_fee: string
  creation_fees?: { VISA: string; MASTERCARD: string }
  creation_prefund?: string
  contactless?: boolean
  fund_fee_percent: string
  fund_fee_fixed: string
  withdraw_fee_percent: string
  withdraw_fee_fixed: string
  monthly_fee: string
  suspended: boolean
  /** Wallets utilisables pour recharger : 1 USD = rate (taux DGS). */
  funding_rates?: { currency: string; rate: string }[]
  limits: {
    max_cards_per_end_user: number
    min_fund_amount: string
    max_fund_amount: string
    daily_fund_limit_per_card: string
    max_card_balance: string
  }
}

export interface Paginated<T> {
  count: number
  page: number
  page_size: number
  results: T[]
}

// ── Formatage ───────────────────────────────────────────────────────────────

export function money(value: string | number | null | undefined, currency = "USD", opts: { sign?: boolean } = {}) {
  if (value === null || value === undefined || value === "") return "—"
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  const s = n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: currency === "XOF" ? 0 : 2 })
  const symbol = currency === "USD" ? "$" : currency
  return `${opts.sign && n > 0 ? "+" : ""}${s} ${symbol}`
}

export function dateTime(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

/** Frais calculés EXACTEMENT comme DGS (arrondi au demi-centime supérieur). */
export function cardFee(amount: number, percent: string | number, fixed: string | number) {
  const raw = (amount * Number(percent || 0)) / 100 + Number(fixed || 0)
  return Math.round((raw + Number.EPSILON) * 100) / 100
}

/** Montants des transactions Maplerad : centimes. */
export function fromMinor(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n / 100 : 0
}
