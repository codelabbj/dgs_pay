"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle } from "lucide-react"
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

    // Store form reference before async operation
    const form = e.currentTarget

    try {
      const formData = new FormData(form)
      const payload = {
        type_trans: formData.get("type_trans"),
        phone: formData.get("phone"),
        amount: Number(formData.get("amount")),
        beneficiary: {
          name: formData.get("beneficiary_name"),
          account_number: formData.get("beneficiary_account"),
          email: formData.get("beneficiary_email")
        }
      }

      console.log('Submitting transaction with payload:', payload)

      const res = await smartFetch(`${baseUrl}/prod/v1/api/customer-transaction`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', res.status, 'ok:', res.ok)

      if (res.ok) {
        const data = await res.json()
        console.log('Success response data:', data)
        // Clear error state first, then set success
        setError(null)
        setSuccess(`Transaction created successfully! Reference: ${data.reference || 'N/A'}`)
        // Reset form using stored reference
        form.reset()
      } else {
        console.log('Error response, status:', res.status)
        // Clear success state first, then set error
        setSuccess(null)
        const errorData = await res.json()
        console.log('Error response data:', errorData)
        let errorMessage = 'Failed to create transaction'
        
        if (Array.isArray(errorData.detail)) {
          // Handle validation errors array
          const validationErrors = errorData.detail.map((err: any) => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ')
          errorMessage = `Validation errors: ${validationErrors}`
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData && typeof errorData === 'object') {
          // Extract error values from field keys
          const fieldErrors = Object.entries(errorData).map(([field, errors]) => {
            if (Array.isArray(errors)) {
              return `${field}: ${errors.join(', ')}`
            }
            return `${field}: ${errors}`
          }).join('\n')
          errorMessage = fieldErrors
        } else {
          errorMessage = `Failed to create transaction: ${res.status} ${res.statusText}`
        }
        
        setError(errorMessage)
        console.error('Transaction creation error:', errorData)
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      // Clear success state first, then set error
      setSuccess(null)
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
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Transaction Error</p>
                  <div className="text-xs mt-2 whitespace-pre-wrap break-words bg-red-100 dark:bg-red-900/30 p-2 rounded border">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Success</p>
                  <p className="text-xs mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}
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
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input name="phone" id="phone" defaultValue="2250102059707" required />
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
            {/* <div className="space-y-4">
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
            </div> */}

            {/* Additional Fields */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wave_id">Wave ID</Label>
                <Input name="wave_id" id="wave_id" defaultValue="wave_1234567890" />
              </div>
              
            </div> */}

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
