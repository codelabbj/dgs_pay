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
        amount: formData.get("amount"),
        currency: formData.get("currency"),
        payment_method: formData.get("payment_method"),
        country: formData.get("country"),
        description: formData.get("description"),
      }

      const res = await smartFetch(`${baseUrl}/prod/v1/api/transaction`, {
        method: "POST",
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">{t("amount")}</Label>
                <Input name="amount" id="amount" type="number" required />
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
                <Label htmlFor="payment_method">{t("paymentMethod")}</Label>
                <Select name="payment_method" defaultValue="wave">
                  <SelectTrigger id="payment_method">
                    <SelectValue placeholder={t("selectPaymentMethod")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wave">{t("wave")}</SelectItem>
                    <SelectItem value="orange">{t("orange")}</SelectItem>
                    <SelectItem value="free">{t("free")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="country">{t("country")}</Label>
                <Input name="country" id="country" defaultValue="SN" required />
              </div>
            </div>
            <div>
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea name="description" id="description" required />
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
