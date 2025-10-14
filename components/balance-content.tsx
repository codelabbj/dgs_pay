"use client"

import React, { useState, useEffect } from "react"
import { smartFetch } from "@/utils/auth"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  Eye, 
  EyeOff,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  Phone,
  CreditCard,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { format } from "date-fns"

interface Balance {
  uid: string
  balance: number
  formatted_balance: string
  total_payin: number
  total_payout: number
  total_fees_paid: number
  is_active: boolean
  is_frozen: boolean
  last_transaction_at: string | null
}

interface BalanceHistoryItem {
  uid: string
  type: string
  type_display: string
  amount: number
  formatted_amount: string
  balance_before: number
  balance_after: number
  description: string
  created_at: string
}

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

interface Operator {
  uid: string
  operator_name: string
  operator_code: string
  min_payin_amount: number
  max_payin_amount: number
  min_payout_amount: number
  max_payout_amount: number
  supports_smartlink: boolean
}

interface UserConfig {
  customer_id: string
  uid: string
  is_active: boolean
  webhook_url: string
  payin_fee_rate: string
  payout_fee_rate: string
  use_fixed_fees: boolean
  payin_fee_fixed: number | null
  payout_fee_fixed: number | null
  daily_payin_limit: number | null
  daily_payout_limit: number | null
  monthly_payin_limit: number | null
  monthly_payout_limit: number | null
  ip_whitelist: string[]
  require_ip_whitelist: boolean
  notes: string
  created_at: string
}

export function BalanceContent() {
  const { t } = useLanguage()
  const [balance, setBalance] = useState<Balance | null>(null)
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryItem[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [recharges, setRecharges] = useState<RechargeRequest[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Static operator options (same as payin-content.tsx)
  const OPERATOR_OPTIONS = [
    { value: "wave-ci", label: "Wave CI" },
    { value: "mtn-ci", label: "MTN CI" },
    { value: "orange-ci", label: "Orange CI" }
  ]
  
  // Withdrawal form state
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false)
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    phone: "",
    operator_code: "",
    code: ""
  })
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  
  // Recharge form state
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false)
  const [rechargeForm, setRechargeForm] = useState({
    amount: "",
    payment_method: "cash",
    notes: ""
  })
  const [rechargeLoading, setRechargeLoading] = useState(false)

  // Pagination state
  const [historyPage, setHistoryPage] = useState(1)
  const [withdrawalsPage, setWithdrawalsPage] = useState(1)
  const [rechargesPage, setRechargesPage] = useState(1)
  
  // Report state
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportForm, setReportForm] = useState({
    from: "",
    to: "",
    format: "csv"
  })
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    loadBalanceData()
    loadOperators()
    loadUserConfig()
  }, [])

  useEffect(() => {
    if (activeTab === "history") {
      loadBalanceHistory()
    } else if (activeTab === "withdrawals") {
      loadWithdrawals()
    } else if (activeTab === "recharges") {
      loadRecharges()
    }
  }, [activeTab])

  const loadBalanceData = async () => {
    try {
      const response = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/balance/`)
      if (response.ok) {
        const data = await response.json()
        setBalance(data)
      }
    } catch (error) {
      console.error("Failed to load balance:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadBalanceHistory = async () => {
    try {
      const response = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/balance/history/?page=${historyPage}`)
      if (response.ok) {
        const data = await response.json()
        setBalanceHistory(data.results || [])
      }
    } catch (error) {
      console.error("Failed to load balance history:", error)
    }
  }

  const loadWithdrawals = async () => {
    try {
      const response = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/balance/withdrawals/?page=${withdrawalsPage}`)
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.results || [])
      }
    } catch (error) {
      console.error("Failed to load withdrawals:", error)
    }
  }

  const loadRecharges = async () => {
    try {
      const response = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/recharges/?page=${rechargesPage}`)
      if (response.ok) {
        const data = await response.json()
        setRecharges(data.results || [])
      }
    } catch (error) {
      console.error("Failed to load recharges:", error)
    }
  }

  const loadOperators = async () => {
    try {
      const response = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/operators/`)
      if (response.ok) {
        const data = await response.json()
        setOperators(data)
      }
    } catch (error) {
      console.error("Failed to load operators:", error)
    }
  }

  const loadUserConfig = async () => {
    try {
      const response = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/my-config/`)
      if (response.ok) {
        const data = await response.json()
        setUserConfig(data)
      }
    } catch (error) {
      console.error("Failed to load user config:", error)
    }
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setReportLoading(true)
    
    try {
      const params = new URLSearchParams({
        from: reportForm.from,
        to: reportForm.to,
        format: reportForm.format
      })
      
      const response = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/reports/transactions/?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transactions-report-${reportForm.from}-to-${reportForm.to}.${reportForm.format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        setReportDialogOpen(false)
        setReportForm({ from: "", to: "", format: "csv" })
      }
    } catch (error) {
      console.error("Failed to generate report:", error)
    } finally {
      setReportLoading(false)
    }
  }

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawalLoading(true)
    
    try {
      const response = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/balance/withdraw/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseInt(withdrawalForm.amount),
          phone: withdrawalForm.phone,
          operator_code: withdrawalForm.operator_code,
          code: withdrawalForm.code || null
        })
      })
      
      if (response.ok) {
        setWithdrawalDialogOpen(false)
        setWithdrawalForm({ amount: "", phone: "", operator_code: "", code: "" })
        loadBalanceData()
        loadWithdrawals()
      }
    } catch (error) {
      console.error("Failed to create withdrawal:", error)
    } finally {
      setWithdrawalLoading(false)
    }
  }

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRechargeLoading(true)
    
    try {
      const response = await smartFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/recharge/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseInt(rechargeForm.amount),
          payment_method: rechargeForm.payment_method,
          notes: rechargeForm.notes
        })
      })
      
      if (response.ok) {
        setRechargeDialogOpen(false)
        setRechargeForm({ amount: "", payment_method: "cash", notes: "" })
        loadRecharges()
      }
    } catch (error) {
      console.error("Failed to create recharge:", error)
    } finally {
      setRechargeLoading(false)
    }
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

  const getTransactionIcon = (type: string) => {
    if (type.includes("credit") || type.includes("payin")) {
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />
    } else if (type.includes("debit") || type.includes("payout")) {
      return <ArrowUpRight className="h-4 w-4 text-red-600" />
    }
    return <TrendingUp className="h-4 w-4 text-blue-600" />
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t("balance")}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage your account balance, withdrawals, and recharges
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center space-x-2"
          >
            {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showBalance ? t("hideBalances") : t("showBalances")}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadBalanceData}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t("loading")}</span>
          </Button>
        </div>
      </div>

      {/* Balance Overview */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("currentBalance")}</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalance ? balance.formatted_balance : "••••••"}
              </div>
              <p className="text-xs text-muted-foreground">
                {balance.is_active ? t("balanceActive") : t("balanceInactive")} • {balance.is_frozen ? t("balanceFrozen") : t("balanceAvailable")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalPayin")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalance ? `${balance.total_payin.toLocaleString()} XOF` : "••••••"}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("allTimePaymentsReceived")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalPayout")}</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalance ? `${balance.total_payout.toLocaleString()} XOF` : "••••••"}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("allTimePaymentsSent")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalFeesPaid")}</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalance ? `${balance.total_fees_paid.toLocaleString()} XOF` : "••••••"}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("transactionFeesPaid")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">{t("balanceHistory")}</TabsTrigger>
          <TabsTrigger value="withdrawals">{t("withdrawalRequests")}</TabsTrigger>
          <TabsTrigger value="recharges">{t("rechargeRequests")}</TabsTrigger>
          <TabsTrigger value="reports">{t("reports")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t("quickActions")}</CardTitle>
                <CardDescription>
                  {t("performCommonBalanceOperations")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Minus className="h-4 w-4 mr-2" />
                      {t("requestWithdrawal")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("requestWithdrawal")}</DialogTitle>
                      <DialogDescription>
                        {t("submitWithdrawalRequest")}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="withdrawal-amount">{t("withdrawalAmount")}</Label>
                        <Input
                          id="withdrawal-amount"
                          type="number"
                          value={withdrawalForm.amount}
                          onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                          placeholder={t("enterAmount")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="withdrawal-phone">{t("phoneNumber")}</Label>
                        <Input
                          id="withdrawal-phone"
                          type="tel"
                          value={withdrawalForm.phone}
                          onChange={(e) => setWithdrawalForm({ ...withdrawalForm, phone: e.target.value })}
                          placeholder={t("enterPhone")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="withdrawal-operator">{t("operator")}</Label>
                        <Select
                          value={withdrawalForm.operator_code}
                          onValueChange={(value) => setWithdrawalForm({ ...withdrawalForm, operator_code: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectOperator")} />
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
                        <Label htmlFor="withdrawal-code">{t("codeOptional")}</Label>
                        <Input
                          id="withdrawal-code"
                          value={withdrawalForm.code}
                          onChange={(e) => setWithdrawalForm({ ...withdrawalForm, code: e.target.value })}
                          placeholder={t("enterCode")}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={withdrawalLoading}>
                        {withdrawalLoading ? t("submitting") : t("submitRequest")}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={rechargeDialogOpen} onOpenChange={setRechargeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("requestRecharge")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("requestRecharge")}</DialogTitle>
                      <DialogDescription>
                        {t("submitRechargeRequest")}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRechargeSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="recharge-amount">{t("rechargeAmount")}</Label>
                        <Input
                          id="recharge-amount"
                          type="number"
                          value={rechargeForm.amount}
                          onChange={(e) => setRechargeForm({ ...rechargeForm, amount: e.target.value })}
                          placeholder={t("enterAmount")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="recharge-method">{t("paymentMethod")}</Label>
                        <Select
                          value={rechargeForm.payment_method}
                          onValueChange={(value) => setRechargeForm({ ...rechargeForm, payment_method: value })}
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
                      <div>
                        <Label htmlFor="recharge-notes">{t("notes")} ({t("cancel")})</Label>
                        <Textarea
                          id="recharge-notes"
                          value={rechargeForm.notes}
                          onChange={(e) => setRechargeForm({ ...rechargeForm, notes: e.target.value })}
                          placeholder={t("additionalNotes")}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={rechargeLoading}>
                        {rechargeLoading ? t("submitting") : t("submitRequest")}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      {t("generateReport")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("generateTransactionReport")}</DialogTitle>
                      <DialogDescription>
                        {t("exportTransactionData")}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReportSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="report-from">{t("fromDate")}</Label>
                        <Input
                          id="report-from"
                          type="date"
                          value={reportForm.from}
                          onChange={(e) => setReportForm({ ...reportForm, from: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="report-to">{t("toDate")}</Label>
                        <Input
                          id="report-to"
                          type="date"
                          value={reportForm.to}
                          onChange={(e) => setReportForm({ ...reportForm, to: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="report-format">{t("format")}</Label>
                        <Select
                          value={reportForm.format}
                          onValueChange={(value) => setReportForm({ ...reportForm, format: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectFormat")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">{t("csvFormat")}</SelectItem>
                            <SelectItem value="xlsx">{t("excelFormat")}</SelectItem>
                            <SelectItem value="pdf">{t("pdfFormat")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full" disabled={reportLoading}>
                        {reportLoading ? t("generating") : t("generateReport")}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>{t("recentActivity")}</CardTitle>
                <CardDescription>
                  {t("latestBalanceTransactions")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {balanceHistory.slice(0, 5).map((item) => (
                    <div key={item.uid} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(item.type)}
                        <div>
                          <p className="text-sm font-medium">{item.type_display}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          item.type.includes("credit") || item.type.includes("payin") 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          {item.type.includes("credit") || item.type.includes("payin") ? "+" : "-"}
                          {item.formatted_amount}
                        </p>
                      </div>
                    </div>
                  ))}
                  {balanceHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("noRecentActivity")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>{t("accountConfiguration")}</span>
                </CardTitle>
                <CardDescription>
                  {t("accountSettingsAndLimits")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userConfig ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t("configStatus")}</span>
                      <Badge className={userConfig.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"}>
                        {userConfig.is_active ? t("balanceActive") : t("balanceInactive")}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t("payinFeeRate")}:</span>
                        <span className="font-medium">{userConfig.payin_fee_rate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t("payoutFeeRate")}:</span>
                        <span className="font-medium">{userConfig.payout_fee_rate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t("feeType")}:</span>
                        <span className="font-medium">{userConfig.use_fixed_fees ? t("fixed") : t("percentage")}</span>
                      </div>
                    </div>

                    {(userConfig.daily_payin_limit || userConfig.daily_payout_limit) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t("dailyLimits")}</h4>
                        {userConfig.daily_payin_limit && (
                          <div className="flex justify-between text-sm">
                            <span>Payin:</span>
                            <span className="font-medium">{userConfig.daily_payin_limit.toLocaleString()} XOF</span>
                          </div>
                        )}
                        {userConfig.daily_payout_limit && (
                          <div className="flex justify-between text-sm">
                            <span>Payout:</span>
                            <span className="font-medium">{userConfig.daily_payout_limit.toLocaleString()} XOF</span>
                          </div>
                        )}
                      </div>
                    )}

                    {(userConfig.monthly_payin_limit || userConfig.monthly_payout_limit) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t("monthlyLimits")}</h4>
                        {userConfig.monthly_payin_limit && (
                          <div className="flex justify-between text-sm">
                            <span>Payin:</span>
                            <span className="font-medium">{userConfig.monthly_payin_limit.toLocaleString()} XOF</span>
                          </div>
                        )}
                        {userConfig.monthly_payout_limit && (
                          <div className="flex justify-between text-sm">
                            <span>Payout:</span>
                            <span className="font-medium">{userConfig.monthly_payout_limit.toLocaleString()} XOF</span>
                          </div>
                        )}
                      </div>
                    )}

                    {userConfig.webhook_url && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t("webhookUrl")}</h4>
                        <p className="text-xs text-muted-foreground break-all">{userConfig.webhook_url}</p>
                      </div>
                    )}

                    {userConfig.ip_whitelist.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t("ipWhitelist")}</h4>
                        <div className="space-y-1">
                          {userConfig.ip_whitelist.map((ip, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {ip}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {t("created")}: {format(new Date(userConfig.created_at), "MMM dd, yyyy")}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">{t("loadingConfiguration")}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("balanceHistory")}</CardTitle>
              <CardDescription>
                {t("completeHistoryOfBalanceChanges")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {balanceHistory.map((item) => (
                  <div key={item.uid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(item.type)}
                      <div>
                        <p className="font-medium">{item.type_display}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        item.type.includes("credit") || item.type.includes("payin") 
                          ? "text-green-600" 
                          : "text-red-600"
                      }`}>
                        {item.type.includes("credit") || item.type.includes("payin") ? "+" : "-"}
                        {item.formatted_amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: {item.balance_after.toLocaleString()} XOF
                      </p>
                    </div>
                  </div>
                ))}
                {balanceHistory.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {t("noBalanceHistoryAvailable")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("withdrawalRequests")}</CardTitle>
              <CardDescription>
                {t("trackWithdrawalRequestsAndStatus")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.uid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Minus className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-medium">{withdrawal.reference}</p>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.phone} • {withdrawal.operator_code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(withdrawal.created_at), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        -{withdrawal.amount.toLocaleString()} XOF
                      </p>
                      <Badge className={getStatusColor(withdrawal.status)}>
                        {withdrawal.status_display}
                      </Badge>
                    </div>
                  </div>
                ))}
                {withdrawals.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {t("noWithdrawalRequestsFound")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recharges Tab */}
        <TabsContent value="recharges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("rechargeRequests")}</CardTitle>
              <CardDescription>
                {t("trackRechargeRequestsAndStatus")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recharges.map((recharge) => (
                  <div key={recharge.uid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Plus className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">{recharge.reference}</p>
                        <p className="text-sm text-muted-foreground">
                          {recharge.payment_method_display}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(recharge.created_at), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        +{recharge.amount.toLocaleString()} XOF
                      </p>
                      <Badge className={getStatusColor(recharge.status)}>
                        {recharge.status_display}
                      </Badge>
                    </div>
                  </div>
                ))}
                {recharges.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {t("noRechargeRequestsFound")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>{t("transactionReports")}</span>
              </CardTitle>
              <CardDescription>
                Generate and download transaction reports for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("quickReport")}</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate a report for the last 30 days
                    </p>
                    <Button 
                      onClick={() => {
                        const today = new Date()
                        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                        setReportForm({
                          from: thirtyDaysAgo.toISOString().split('T')[0],
                          to: today.toISOString().split('T')[0],
                          format: "csv"
                        })
                        setReportDialogOpen(true)
                      }}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t("last30Days")} (CSV)
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("customReport")}</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose your own date range and format
                    </p>
                    <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          {t("customRange")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Generate Transaction Report</DialogTitle>
                          <DialogDescription>
                            Export your transaction data for a specific date range
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleReportSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="report-from">From Date</Label>
                            <Input
                              id="report-from"
                              type="date"
                              value={reportForm.from}
                              onChange={(e) => setReportForm({ ...reportForm, from: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="report-to">To Date</Label>
                            <Input
                              id="report-to"
                              type="date"
                              value={reportForm.to}
                              onChange={(e) => setReportForm({ ...reportForm, to: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="report-format">Format</Label>
                            <Select
                              value={reportForm.format}
                              onValueChange={(value) => setReportForm({ ...reportForm, format: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="csv">CSV</SelectItem>
                                <SelectItem value="xlsx">Excel</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="submit" className="w-full" disabled={reportLoading}>
                            {reportLoading ? "Generating..." : "Generate Report"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Report Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium">CSV Format</h4>
                      <p className="text-muted-foreground">
                        Comma-separated values, compatible with Excel and Google Sheets
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Excel Format</h4>
                      <p className="text-muted-foreground">
                        Native Excel format with formatting and multiple sheets
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">PDF Format</h4>
                      <p className="text-muted-foreground">
                        Portable document format for sharing and printing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
