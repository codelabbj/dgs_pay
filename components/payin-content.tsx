"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/contexts/language-context"
import { authenticatedFetch } from "@/utils/auth"

export default function PayinContent() {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    type_trans: "paying",
    phone: "",
    country_code: "SN",
    transac_reference: "",
    amount: "",
    network: "wave",
    currency: "XOF",
    beneficiary: {
      name: "",
      account_number: "",
      email: "",
    },
    success_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
    callback_url: "https://example.com/callback",
    wave_id: "",
    description: "",
    for_customer_account: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const handleChange = (e: any) => {
    const { name, value } = e.target
    if (name.startsWith("beneficiary.")) {
      setForm((prev) => ({
        ...prev,
        beneficiary: {
          ...prev.beneficiary,
          [name.replace("beneficiary.", "")]: value,
        },
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelect = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Then try to fetch fresh data from API
      

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    const accessToken = localStorage.getItem('access')
      if (!accessToken) {
        console.log('No access token available, using cached data')
        setIsLoading(false)
        return
      }
      // Check if token is expired
      const exp = localStorage.getItem('exp')
      if (exp) {
        const expDate = new Date(exp)
        const now = new Date()
        if (expDate <= now) {
          console.log('Token expired, using cached data')
          setIsLoading(false)
          return
        }
      }
      
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      }
      const res = await fetch(`${baseUrl}/api/v1/transaction`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSuccess(t("transactionCreatedSuccess"))
        setForm({
          type_trans: "paying",
          phone: "",
          country_code: "SN",
          transac_reference: "",
          amount: "",
          network: "wave",
          currency: "XOF",
          beneficiary: {
            name: "",
            account_number: "",
            email: "",
          },
          success_url: "https://example.com/success",
          cancel_url: "https://example.com/cancel",
          callback_url: "https://example.com/callback",
          wave_id: "",
          description: "",
          for_customer_account: false,
        })
      } else {
        const data = await res.json()
        setError(data.details || data.message || t("failedToCreateTransaction"))
      }
    } catch (err) {
      setError(t("failedToCreateTransaction"))
    }
    setIsLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t("directPayTransaction")}</CardTitle>
          <CardDescription>{t("fillFormPayinTransaction")}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 text-center text-sm text-red-600 dark:text-red-400">{error}</div>}
          {success && <div className="mb-4 text-center text-sm text-green-600 dark:text-green-400">{success}</div>}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input name="phone" id="phone" value={form.phone} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="country_code">{t("countryCode")}</Label>
                <Input name="country_code" id="country_code" value={form.country_code} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="transac_reference">{t("transactionReference")}</Label>
                <Input name="transac_reference" id="transac_reference" value={form.transac_reference} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="amount">{t("amount")}</Label>
                <Input name="amount" id="amount" type="number" value={form.amount} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="network">{t("network")}</Label>
                <Select value={form.network} onValueChange={(v) => handleSelect("network", v)}>
                  <SelectTrigger id="network">
                    <SelectValue placeholder={t("selectNetwork")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wave">{t("wave")}</SelectItem>
                    <SelectItem value="orange">{t("orange")}</SelectItem>
                    <SelectItem value="free">{t("free")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency">{t("currency")}</Label>
                <Select value={form.currency} onValueChange={(v) => handleSelect("currency", v)}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder={t("selectCurrency")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XOF">{t("xof")}</SelectItem>
                    <SelectItem value="USD">{t("usd")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="wave_id">{t("waveId")}</Label>
                <Input name="wave_id" id="wave_id" value={form.wave_id} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="beneficiary.name">{t("beneficiaryName")}</Label>
                <Input name="beneficiary.name" id="beneficiary.name" value={form.beneficiary.name} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="beneficiary.account_number">{t("beneficiaryAccountNumber")}</Label>
                <Input name="beneficiary.account_number" id="beneficiary.account_number" value={form.beneficiary.account_number} onChange={handleChange} required />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="beneficiary.email">{t("beneficiaryEmail")}</Label>
                <Input name="beneficiary.email" id="beneficiary.email" value={form.beneficiary.email} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea name="description" id="description" value={form.description} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="success_url">{t("successUrl")}</Label>
                <Input name="success_url" id="success_url" value={form.success_url} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="cancel_url">{t("cancelUrl")}</Label>
                <Input name="cancel_url" id="cancel_url" value={form.cancel_url} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="callback_url">{t("callbackUrl")}</Label>
                <Input name="callback_url" id="callback_url" value={form.callback_url} onChange={handleChange} required />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="for_customer_account"
                name="for_customer_account"
                checked={form.for_customer_account}
                onChange={(e) => setForm((prev) => ({ ...prev, for_customer_account: e.target.checked }))}
              />
              <Label htmlFor="for_customer_account">{t("forCustomerAccount")}</Label>
            </div>
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? t("processing") : t("createTransaction")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
