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
  Zap, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Send, 
  Eye, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  Link,
  QrCode,
  Share,
  History,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Globe
} from "lucide-react"
import { format } from "date-fns"

interface DirectPayment {
  uid: string
  reference: string
  amount: number
  currency: string
  payment_method: string
  status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  description: string
  created_at: string
  completed_at: string | null
  payment_url: string
  qr_code: string | null
}

interface PaymentMethod {
  id: string
  name: string
  type: string
  icon: React.ComponentType<any>
  description: string
  is_available: boolean
}

export function DirectContent() {
  const { t } = useLanguage()
  const [payments, setPayments] = useState<DirectPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("create")
  
  // Payment form state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    currency: "XOF",
    payment_method: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    description: ""
  })
  const [paymentLoading, setPaymentLoading] = useState(false)

  const paymentMethods: PaymentMethod[] = [
    {
      id: "mobile_money",
      name: "Mobile Money",
      type: "mobile",
      icon: Smartphone,
      description: "Pay with mobile money (MTN, Orange, etc.)",
      is_available: true
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      type: "bank",
      icon: Banknote,
      description: "Direct bank transfer",
      is_available: true
    },
    {
      id: "credit_card",
      name: "Credit Card",
      type: "card",
      icon: CreditCard,
      description: "Visa, Mastercard, and other cards",
      is_available: true
    }
  ]

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockPayments: DirectPayment[] = [
        {
          uid: "1",
          reference: "DIR-20250115-001",
          amount: 25000,
          currency: "XOF",
          payment_method: "mobile_money",
          status: "completed",
          customer_name: "John Doe",
          customer_email: "john.doe@example.com",
          customer_phone: "+22997123456",
          description: "Payment for services",
          created_at: "2025-01-15T10:30:00Z",
          completed_at: "2025-01-15T10:35:00Z",
          payment_url: "https://pay.example.com/dir-20250115-001",
          qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        },
        {
          uid: "2",
          reference: "DIR-20250115-002",
          amount: 50000,
          currency: "XOF",
          payment_method: "bank_transfer",
          status: "pending",
          customer_name: "Jane Smith",
          customer_email: "jane.smith@example.com",
          customer_phone: "+22997123457",
          description: "Invoice payment",
          created_at: "2025-01-15T11:00:00Z",
          completed_at: null,
          payment_url: "https://pay.example.com/dir-20250115-002",
          qr_code: null
        },
        {
          uid: "3",
          reference: "DIR-20250115-003",
          amount: 15000,
          currency: "XOF",
          payment_method: "credit_card",
          status: "failed",
          customer_name: "Ahmed Hassan",
          customer_email: "ahmed.hassan@example.com",
          customer_phone: "+22997123458",
          description: "Product purchase",
          created_at: "2025-01-15T12:00:00Z",
          completed_at: null,
          payment_url: "https://pay.example.com/dir-20250115-003",
          qr_code: null
        }
      ]
      
      setPayments(mockPayments)
    } catch (error) {
      console.error("Failed to load payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentLoading(true)
    
    try {
      // Mock API call - replace with actual implementation
      console.log("Payment form submitted:", paymentForm)
      
      setPaymentDialogOpen(false)
      setPaymentForm({ amount: "", currency: "XOF", payment_method: "", customer_name: "", customer_email: "", customer_phone: "", description: "" })
      loadPayments()
    } catch (error) {
      console.error("Failed to create payment:", error)
    } finally {
      setPaymentLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const sharePayment = (payment: DirectPayment) => {
    if (navigator.share) {
      navigator.share({
        title: `Payment Request - ${payment.reference}`,
        text: `Please complete your payment of ${payment.amount.toLocaleString()} ${payment.currency}`,
        url: payment.payment_url
      })
    } else {
      copyToClipboard(payment.payment_url)
    }
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
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t("payDirect")}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Create direct payment links and manage payment requests
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayments}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Create Payment</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Direct Payment</DialogTitle>
                <DialogDescription>
                  Generate a payment link that customers can use to pay directly
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment-amount">Amount</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment-currency">Currency</Label>
                    <Select
                      value={paymentForm.currency}
                      onValueChange={(value) => setPaymentForm({ ...paymentForm, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XOF">XOF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select
                    value={paymentForm.payment_method}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center space-x-2">
                            <method.icon className="h-4 w-4" />
                            <span>{method.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input
                    id="customer-name"
                    value={paymentForm.customer_name}
                    onChange={(e) => setPaymentForm({ ...paymentForm, customer_name: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer-email">Customer Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={paymentForm.customer_email}
                      onChange={(e) => setPaymentForm({ ...paymentForm, customer_email: e.target.value })}
                      placeholder="Enter customer email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-phone">Customer Phone</Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      value={paymentForm.customer_phone}
                      onChange={(e) => setPaymentForm({ ...paymentForm, customer_phone: e.target.value })}
                      placeholder="Enter customer phone"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="payment-description">Description</Label>
                  <Textarea
                    id="payment-description"
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                    placeholder="Enter payment description"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={paymentLoading}>
                  {paymentLoading ? "Creating..." : "Create Payment Link"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              All payment requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.filter(p => p.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.filter(p => p.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} XOF
            </div>
            <p className="text-xs text-muted-foreground">
              All payment amounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* Payment Methods Tab */}
        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-crimson-100 dark:bg-crimson-900 rounded-lg flex items-center justify-center">
                      <method.icon className="h-6 w-6 text-crimson-600 dark:text-crimson-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{method.name}</CardTitle>
                      <CardDescription>{method.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant={method.is_available ? "default" : "outline"}
                    disabled={!method.is_available}
                    onClick={() => {
                      setPaymentForm({ ...paymentForm, payment_method: method.id })
                      setPaymentDialogOpen(true)
                    }}
                  >
                    {method.is_available ? "Use This Method" : "Coming Soon"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Track all your direct payment requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.uid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-crimson-600 rounded-full flex items-center justify-center text-white font-medium">
                        {payment.customer_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{payment.reference}</p>
                        <p className="text-sm text-muted-foreground">{payment.customer_name}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{payment.customer_email}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{payment.customer_phone}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{payment.amount.toLocaleString()} {payment.currency}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(payment.status)}
                          <span>{payment.status}</span>
                        </div>
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(payment.payment_url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sharePayment(payment)}
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                        {payment.qr_code && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Open QR code in modal or new window
                              window.open(payment.qr_code, '_blank')
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No payments found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

