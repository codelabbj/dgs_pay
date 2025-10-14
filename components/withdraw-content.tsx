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
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Minus, AlertCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { smartFetch } from "@/utils/auth"
import { toast } from "@/hooks/use-toast"

// Types for withdrawal requests
interface WithdrawalRequest {
  uid: string
  reference: string
  amount: number
  phone: string
  operator_code: string
  status: string
  status_display: string
  code: string | null
  admin_notes: string
  rejection_reason: string
  created_at: string
  approved_at: string | null
  processed_at: string | null
}

interface WithdrawalListResponse {
  count: number
  next: string | null
  previous: string | null
  results: WithdrawalRequest[]
}

export function WithdrawContent() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [operatorFilter, setOperatorFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  
  const { t } = useLanguage()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  // Static operator options (same as other components)
  const OPERATOR_OPTIONS = [
    { value: "wave-ci", label: "Wave CI" },
    { value: "mtn-ci", label: "MTN CI" },
    { value: "orange-ci", label: "Orange CI" }
  ]

  // Create withdrawal form state
  const [createForm, setCreateForm] = useState({
    amount: "",
    phone: "",
    operator_code: "",
    code: ""
  })

  useEffect(() => {
    fetchWithdrawals()
  }, [currentPage, statusFilter, operatorFilter])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(operatorFilter !== "all" && { operator_code: operatorFilter })
      })

      const response = await smartFetch(`${baseUrl}/api/v2/balance/withdrawals/?${params}`)
      
      if (response.ok) {
        const data: WithdrawalListResponse = await response.json()
        setWithdrawals(data.results)
        setTotalCount(data.count)
        setTotalPages(Math.ceil(data.count / 10)) // Assuming 10 items per page
      } else {
        setError(`Failed to fetch withdrawals: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      setError('Failed to fetch withdrawals')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null) // Clear previous errors
    
    try {
      const response = await smartFetch(`${baseUrl}/api/v2/balance/withdraw/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseInt(createForm.amount),
          phone: createForm.phone,
          operator_code: createForm.operator_code,
          code: createForm.code || null
        })
      })
      
      if (response.ok) {
        toast({
          title: t("success"),
          description: t("withdrawalRequestCreated"),
        })
        setCreateDialogOpen(false)
        setCreateForm({ amount: "", phone: "", operator_code: "", code: "" })
        fetchWithdrawals()
      } else {
        try {
          const errorData = await response.json()
          console.log('Error response data:', errorData)
          console.log('Error data type:', typeof errorData)
          console.log('Error data keys:', Object.keys(errorData))
          
          let errorMessage = t("failedToCreateWithdrawal")
          
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
            errorMessage = `${t("failedToCreateWithdrawal")}: ${response.status} ${response.statusText}`
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
          const errorMsg = `${t("failedToCreateWithdrawal")}: ${response.status} ${response.statusText}`
          setCreateError(errorMsg)
          toast({
            title: t("errorTitle"),
            description: errorMsg,
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error creating withdrawal:', error)
      const errorMsg = t("failedToCreateWithdrawal")
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
    fetchWithdrawals()
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

  if (loading && withdrawals.length === 0) {
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
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t("withdrawalRequests")}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {t("withdrawalTrackRequests")}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWithdrawals}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t("withdrawalRefresh")}</span>
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>{t("createWithdrawal")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("createWithdrawalRequest")}</DialogTitle>
                <DialogDescription>
                  {t("withdrawalRequestDescription")}
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
              
              <form onSubmit={handleCreateWithdrawal} className="space-y-4">
                <div>
                  <Label htmlFor="amount">{t("withdrawalAmountLabel")}</Label>
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+2250102059707"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="operator">Operator</Label>
                  <Select
                    value={createForm.operator_code}
                    onValueChange={(value) => setCreateForm({ ...createForm, operator_code: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATOR_OPTIONS.map((operator) => (
                        <SelectItem key={operator.value} value={operator.value}>
                          {operator.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="code">Code (Optional)</Label>
                  <Input
                    id="code"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    placeholder="Enter code"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Withdrawal"}
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
                  placeholder="Search by reference, phone, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={operatorFilter} onValueChange={setOperatorFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operators</SelectItem>
                {OPERATOR_OPTIONS.map((operator) => (
                  <SelectItem key={operator.value} value={operator.value}>
                    {operator.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>
            {totalCount} total withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-600">
              {error}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No withdrawal requests found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.uid}>
                      <TableCell className="font-medium">{withdrawal.reference}</TableCell>
                      <TableCell>{withdrawal.amount.toLocaleString()} XOF</TableCell>
                      <TableCell>{withdrawal.phone}</TableCell>
                      <TableCell>{withdrawal.operator_code}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(withdrawal.status)}>
                          {withdrawal.status_display}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(withdrawal.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
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
                    Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} results
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
