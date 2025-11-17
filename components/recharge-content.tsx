"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, AlertCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { smartFetch } from "@/utils/auth"
import { toast } from "@/hooks/use-toast"

// Types for recharge requests
interface RechargeRequest {
  uid: string
  reference: string
  amount: number
  payment_method: string
  payment_method_display: string
  proof_image: string | null
  bank_reference: string
  mobile_reference: string
  notes: string
  status: string
  status_display: string
  rejection_reason: string
  created_at: string
  approved_at: string | null
}

interface RechargeListResponse {
  count: number
  next: string | null
  previous: string | null
  results: RechargeRequest[]
}

interface CreateRechargeForm {
  amount: string
  payment_method: string
  notes: string
  bank_reference: string
  mobile_reference: string
  proof_image: File | null
}

export function RechargeContent() {
  const [recharges, setRecharges] = useState<RechargeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  
  const { t } = useLanguage()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  // Create recharge form state
  const [createForm, setCreateForm] = useState<CreateRechargeForm>({
    amount: "",
    payment_method: "cash",
    notes: "",
    bank_reference: "",
    mobile_reference: "",
    proof_image: null
  })

  useEffect(() => {
    fetchRecharges()
  }, [currentPage, statusFilter, methodFilter])

  const fetchRecharges = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(methodFilter !== "all" && { payment_method: methodFilter })
      })

      const response = await smartFetch(`${baseUrl}/api/v2/recharges/?${params}`)
      
      if (response.ok) {
        const data: RechargeListResponse = await response.json()
        setRecharges(data.results)
        setTotalCount(data.count)
        setTotalPages(Math.ceil(data.count / 10)) // Assuming 10 items per page
      } else {
        setError(`Failed to fetch recharges: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching recharges:', error)
      setError('Failed to fetch recharges')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRecharge = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null) // Clear previous errors
    
    try {
      const parsedAmount = parseInt(createForm.amount, 10)
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        setCreateError(t("errorInvalidAmount"))
        setCreateLoading(false)
        return
      }

      const formData = new FormData()
      formData.append("amount", String(parsedAmount))
      formData.append("payment_method", createForm.payment_method)
      if (createForm.notes.trim()) {
        formData.append("notes", createForm.notes.trim())
      }
      if (createForm.payment_method === "bank_transfer" && createForm.bank_reference.trim()) {
        formData.append("bank_reference", createForm.bank_reference.trim())
      }
      if (createForm.payment_method === "mobile_money" && createForm.mobile_reference.trim()) {
        formData.append("mobile_reference", createForm.mobile_reference.trim())
      }
      if (createForm.proof_image) {
        formData.append("proof_image", createForm.proof_image)
      }

      const response = await smartFetch(`${baseUrl}/api/v2/recharge/`, {
        method: "POST",
        body: formData
      })
      
      if (response.ok) {
        toast({
          title: t("success"),
          description: t("rechargeRequestCreated"),
        })
        setCreateDialogOpen(false)
        setCreateForm({
          amount: "",
          payment_method: "cash",
          notes: "",
          bank_reference: "",
          mobile_reference: "",
          proof_image: null
        })
        fetchRecharges()
      } else {
        try {
          const errorData = await response.json()
          console.log('Error response data:', errorData)
          console.log('Error data type:', typeof errorData)
          console.log('Error data keys:', Object.keys(errorData))
          
          let errorMessage = t("failedToCreateRecharge")
          
          // Handle different error response formats
          if (Array.isArray(errorData.detail)) {
            // Handle validation errors array (FastAPI style)
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
            // Extract error values from field keys (e.g., {"amount":["Solde insuffisant: 0 XOF"]})
            const fieldErrors = Object.entries(errorData).map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`
              }
              return `${field}: ${errors}`
            }).join('\n')
            errorMessage = fieldErrors
          } else {
            errorMessage = `Failed to create recharge request: ${response.status} ${response.statusText}`
          }
          
          console.log('Final error message:', errorMessage)
          setCreateError(errorMessage)
          toast({
            title: t("errorTitle"),
            description: errorMessage,
            variant: "destructive"
          })
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          const errorMsg = `${t("failedToCreateRecharge")}: ${response.status} ${response.statusText}`
          setCreateError(errorMsg)
          toast({
            title: t("errorTitle"),
            description: errorMsg,
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error creating recharge:', error)
      const errorMsg = t("failedToCreateRecharge")
      setCreateError(errorMsg)
      toast({
        title: t("errorTitle"),
        description: errorMsg,
        variant: "destructive"
      })
    } finally {
      setCreateLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchRecharges()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && recharges.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-crimson-600" />
          <span className="text-lg font-medium">{t("loading")}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t("rechargeRequests")}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {t("trackRechargeRequestsAndStatus")}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecharges}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t("loading")}</span>
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>{t("createRecharge")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("createRechargeRequest")}</DialogTitle>
                <DialogDescription>
                  {t("rechargeRequestDescription")}
                </DialogDescription>
              </DialogHeader>
              
              {/* Error Display */}
              {createError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t("errorTitle")}</p>
                      <div className="text-xs mt-2 whitespace-pre-wrap break-words bg-red-100 dark:bg-red-900/30 p-2 rounded border">
                        {createError}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleCreateRecharge} className="space-y-4">
                <div>
                  <Label htmlFor="amount">{t("rechargeAmountLabel")}</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                    placeholder={t("enterAmount")}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="payment_method">{t("rechargePaymentMethodLabel")}</Label>
                  <Select
                    value={createForm.payment_method}
                    onValueChange={(value) =>
                      setCreateForm({
                        ...createForm,
                        payment_method: value,
                        bank_reference: "",
                        mobile_reference: ""
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectPaymentMethod")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t("cash")}</SelectItem>
                      <SelectItem value="bank_transfer">{t("bankTransfer")}</SelectItem>
                      <SelectItem value="mobile_money">{t("mobileMoney")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {createForm.payment_method === "bank_transfer" && (
                  <div>
                    <Label htmlFor="bank_reference">{t("bankReferenceLabel")}</Label>
                    <Input
                      id="bank_reference"
                      value={createForm.bank_reference}
                      onChange={(e) => setCreateForm({ ...createForm, bank_reference: e.target.value })}
                      placeholder={t("bankReferencePlaceholder")}
                    />
                  </div>
                )}
                {createForm.payment_method === "mobile_money" && (
                  <div>
                    <Label htmlFor="mobile_reference">{t("mobileReferenceLabel")}</Label>
                    <Input
                      id="mobile_reference"
                      value={createForm.mobile_reference}
                      onChange={(e) => setCreateForm({ ...createForm, mobile_reference: e.target.value })}
                      placeholder={t("mobileReferencePlaceholder")}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="proof_image">{t("proofImageLabel")}</Label>
                  <Input
                    id="proof_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCreateForm({ ...createForm, proof_image: e.target.files?.[0] || null })}
                  />
                  {createForm.proof_image && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {t("selectedFileLabel")}: {createForm.proof_image.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="notes">{t("rechargeNotesLabel")}</Label>
                  <Textarea
                    id="notes"
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    placeholder={t("rechargeNotesPlaceholder")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createLoading}>
                  {createLoading ? t("creating") : t("createRecharge")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder={t("rechargeSearchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t("rechargeFilterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatus")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="approved">{t("approved")}</SelectItem>
                <SelectItem value="completed">{t("completed")}</SelectItem>
                <SelectItem value="rejected">{t("rejected")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t("rechargeFilterByMethod")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("rechargeAllMethods")}</SelectItem>
                <SelectItem value="cash">{t("cash")}</SelectItem>
                <SelectItem value="bank_transfer">{t("bankTransfer")}</SelectItem>
                <SelectItem value="mobile_money">{t("mobileMoney")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recharges Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("rechargeRequests")}</CardTitle>
          <CardDescription>
            {totalCount} {t("rechargeTotalRequests")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-600">
              {error}
            </div>
          ) : recharges.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              {t("rechargeNoRequestsFound")}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("reference")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("rechargePaymentMethod")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("created")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recharges.map((recharge) => (
                    <TableRow key={recharge.uid}>
                      <TableCell className="font-medium">{recharge.reference}</TableCell>
                      <TableCell>{recharge.amount.toLocaleString()} XOF</TableCell>
                      <TableCell>{recharge.payment_method_display}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(recharge.status)}>
                          {recharge.status_display}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(recharge.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          {t("viewDetails")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-neutral-500">
                    {t("showingLabel")} {((currentPage - 1) * 10) + 1} {t("toLabel")} {Math.min(currentPage * 10, totalCount)} {t("ofLabel")} {totalCount} {t("resultsLabel")}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
