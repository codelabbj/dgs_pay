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
  Users, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  RefreshCw,
  Download,
  Upload,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { format } from "date-fns"

interface Customer {
  uid: string
  first_name: string
  last_name: string
  email: string
  phone: string
  country: string
  status: string
  created_at: string
  last_login: string | null
  total_transactions: number
  total_amount: number
  is_verified: boolean
}

export function CustomersContent() {
  const { t } = useLanguage()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("overview")
  
  // Customer form state
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerForm, setCustomerForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country: "",
    status: "active"
  })
  const [customerLoading, setCustomerLoading] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockCustomers: Customer[] = [
        {
          uid: "1",
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          phone: "+22997123456",
          country: "Benin",
          status: "active",
          created_at: "2025-01-01T00:00:00Z",
          last_login: "2025-01-15T10:30:00Z",
          total_transactions: 25,
          total_amount: 150000,
          is_verified: true
        },
        {
          uid: "2",
          first_name: "Jane",
          last_name: "Smith",
          email: "jane.smith@example.com",
          phone: "+22997123457",
          country: "Togo",
          status: "inactive",
          created_at: "2025-01-02T00:00:00Z",
          last_login: "2025-01-10T14:20:00Z",
          total_transactions: 12,
          total_amount: 75000,
          is_verified: false
        },
        {
          uid: "3",
          first_name: "Ahmed",
          last_name: "Hassan",
          email: "ahmed.hassan@example.com",
          phone: "+22997123458",
          country: "Burkina Faso",
          status: "active",
          created_at: "2025-01-03T00:00:00Z",
          last_login: "2025-01-14T09:15:00Z",
          total_transactions: 8,
          total_amount: 45000,
          is_verified: true
        }
      ]
      setCustomers(mockCustomers)
    } catch (error) {
      console.error("Failed to load customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCustomerLoading(true)
    
    try {
      // Mock API call - replace with actual implementation
      console.log("Customer form submitted:", customerForm)
      
      setCustomerDialogOpen(false)
      setCustomerForm({ first_name: "", last_name: "", email: "", phone: "", country: "", status: "active" })
      setEditingCustomer(null)
      loadCustomers()
    } catch (error) {
      console.error("Failed to save customer:", error)
    } finally {
      setCustomerLoading(false)
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setCustomerForm({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      country: customer.country,
      status: customer.status
    })
    setCustomerDialogOpen(true)
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        // Mock API call - replace with actual implementation
        console.log("Deleting customer:", customerId)
        loadCustomers()
      } catch (error) {
        console.error("Failed to delete customer:", error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t("customers")}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage your customer database and relationships
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCustomers}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Customer</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                <DialogDescription>
                  {editingCustomer ? "Update customer information" : "Add a new customer to your database"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">{t("firstName")}</Label>
                    <Input
                      id="first-name"
                      value={customerForm.first_name}
                      onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">{t("lastName")}</Label>
                    <Input
                      id="last-name"
                      value={customerForm.last_name}
                      onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">{t("emailAddress")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t("phoneNumber")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">{t("country")}</Label>
                  <Select
                    value={customerForm.country}
                    onValueChange={(value) => setCustomerForm({ ...customerForm, country: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectCountry")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="benin">{t("benin")}</SelectItem>
                      <SelectItem value="togo">{t("togo")}</SelectItem>
                      <SelectItem value="burkina-faso">{t("burkinaFaso")}</SelectItem>
                      <SelectItem value="niger">{t("niger")}</SelectItem>
                      <SelectItem value="cote-divoire">{t("coteDivoire")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={customerForm.status}
                    onValueChange={(value) => setCustomerForm({ ...customerForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={customerLoading}>
                  {customerLoading ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}
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
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              All registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Customers</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.is_verified).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Identity verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.reduce((sum, c) => sum + c.total_transactions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All customer transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            Manage and view all your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.uid} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-crimson-600 rounded-full flex items-center justify-center text-white font-medium">
                    {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{customer.email}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{customer.country}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{customer.total_transactions} transactions</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.total_amount.toLocaleString()} XOF
                    </p>
                  </div>
                  <Badge className={getStatusColor(customer.status)}>
                    {customer.status}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCustomer(customer.uid)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredCustomers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No customers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



