"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/contexts/language-context"
import { smartFetch } from "@/utils/auth"

export function PayinContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { t } = useLanguage()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData(e.currentTarget)
      const payload = {
        type_trans: formData.get("type_trans"),
        phone: formData.get("phone"),
        country_code: formData.get("country_code"),
        transac_reference: formData.get("transac_reference"),
        amount: Number(formData.get("amount")),
        network: formData.get("network"),
        currency: formData.get("currency"),
        beneficiary: {
          name: formData.get("beneficiary_name"),
          account_number: formData.get("beneficiary_account"),
          email: formData.get("beneficiary_email")
        },
        success_url: formData.get("success_url"),
        cancel_url: formData.get("cancel_url"),
        callback_url: formData.get("callback_url"),
        wave_id: formData.get("wave_id"),
        description: formData.get("description"),
        for_customer_account: formData.get("for_customer_account") === "true"
      }

      const res = await smartFetch(`${baseUrl}/prod/v1/api/transaction`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess(`Transaction created successfully! Reference: ${data.reference || 'N/A'}`)
        // Reset form
        e.currentTarget.reset()
      } else {
        const errorData = await res.json()
        setError(errorData.detail || `Failed to create transaction: ${res.status}`)
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      setError('Failed to create transaction')
    } finally {
      setIsLoading(false)
    }
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
            {/* Transaction Type */}
            <div>
              <Label htmlFor="type_trans">Transaction Type</Label>
              <Select name="type_trans" defaultValue="payout">
                <SelectTrigger id="type_trans">
                  <SelectValue placeholder="Select Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payout">Payout</SelectItem>
                  <SelectItem value="payin">Payin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Basic Transaction Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">{t("amount")}</Label>
                <Input name="amount" id="amount" type="number" defaultValue="100" required />
              </div>
              <div>
                <Label htmlFor="currency">{t("currency")}</Label>
                <Select name="currency" defaultValue="XOF">
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
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input name="phone" id="phone" defaultValue="2250102059707" required />
              </div>
              <div>
                <Label htmlFor="country_code">Country Code</Label>
                <Select name="country_code" defaultValue="CI">
                  <SelectTrigger id="country_code">
                    <SelectValue placeholder="Select Country Code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ci">Ivory Coast</SelectItem>
                    <SelectItem value="bj">Benin</SelectItem>
                    {/* <SelectItem value="ML">Mali</SelectItem>
                    <SelectItem value="BF">Burkina Faso</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="network">{t("network")}</Label>
                <Select name="network" defaultValue="wave">
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
                <Label htmlFor="transac_reference">Transaction Reference</Label>
                <Input name="transac_reference" id="transac_reference" defaultValue="TRANSAC12345611181" required />
              </div>
            </div>

            {/* Beneficiary Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Beneficiary Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="beneficiary_name">Beneficiary Name</Label>
                  <Input name="beneficiary_name" id="beneficiary_name" defaultValue="John Doe" required />
                </div>
                <div>
                  <Label htmlFor="beneficiary_account">Account Number</Label>
                  <Input name="beneficiary_account" id="beneficiary_account" defaultValue="1234567890" required />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="beneficiary_email">Beneficiary Email</Label>
                  <Input name="beneficiary_email" id="beneficiary_email" type="email" defaultValue="aliloulayei@gmail.com" required />
                </div>
              </div>
            </div>

            {/* URLs */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">URLs</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="success_url">Success URL</Label>
                  <Input name="success_url" id="success_url" defaultValue="https://example.com/success" required />
                </div>
                <div>
                  <Label htmlFor="cancel_url">Cancel URL</Label>
                  <Input name="cancel_url" id="cancel_url" defaultValue="https://example.com/cancel" required />
                </div>
                <div>
                  <Label htmlFor="callback_url">Callback URL</Label>
                  <Input name="callback_url" id="callback_url" defaultValue="https://example.com/callback" required />
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wave_id">Wave ID</Label>
                <Input name="wave_id" id="wave_id" defaultValue="wave_1234567890" />
              </div>
              <div>
                <Label htmlFor="for_customer_account">For Customer Account</Label>
                <Select name="for_customer_account" defaultValue="false">
                  <SelectTrigger id="for_customer_account">
                    <SelectValue placeholder="Select Option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea name="description" id="description" defaultValue="Paiement d'un service" required />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-black text-white hover:bg-gray-800 transition-colors font-medium" 
              disabled={isLoading}
            >
              {isLoading ? t("processing") : t("createTransaction")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
