"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, Eye } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useLanguage } from "@/contexts/language-context"

export function TransactionsContent() {
  const { t } = useLanguage()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [statusMap, setStatusMap] = useState<{ [reference: string]: string }>({})
  const [statusLoading, setStatusLoading] = useState<{ [reference: string]: boolean }>({})
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  // Then try to fetch fresh data from API
      // const accessToken = localStorage.getItem('access')
      // if (!accessToken) {
      //   console.log('No access token available, using cached data')
      //   setIsLoading(false)
      //   return
      // }


  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${baseUrl}/api/v1/transaction`)
        if (res.ok) {
          const data = await res.json()
          setTransactions(data.results || [])
        } else {
          setTransactions([])
        }
      } catch {
        setTransactions([])
      }
      setLoading(false)
    }
    fetchTransactions()
  }, [baseUrl])

  const handleCheckStatus = async (reference: string) => {
    setStatusLoading((prev) => ({ ...prev, [reference]: true }))
    try {
      const res = await fetch(`${baseUrl}/api/v1/transaction-status?reference=${reference}`)
      if (res.ok) {
        const data = await res.json()
        setStatusMap((prev) => ({ ...prev, [reference]: data.status || JSON.stringify(data) }))
      } else {
        setStatusMap((prev) => ({ ...prev, [reference]: t("error") }))
      }
    } catch {
      setStatusMap((prev) => ({ ...prev, [reference]: t("error") }))
    }
    setStatusLoading((prev) => ({ ...prev, [reference]: false }))
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    const tableColumn = [
      t("transactionId"),
      t("date"),
      t("time"),
      t("customer"),
      t("email"),
      t("amount"),
      t("method"),
      t("status"),
      t("reference"),
    ]
    const tableRows = filteredTransactions.map((transaction) => {
      const dateObj = transaction.created_at ? new Date(transaction.created_at) : null
      return [
        transaction.id || "-",
        dateObj ? dateObj.toLocaleDateString() : "-",
        dateObj ? dateObj.toLocaleTimeString() : "-",
        transaction.customer?.username || transaction.customer?.email || "-",
        transaction.customer?.email || "-",
        transaction.amount?.toLocaleString?.() || transaction.amount || "-",
        transaction.network || transaction.type_trans || "-",
        transaction.status || "-",
        transaction.reference || "-",
      ]
    })
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 220, 220] },
      margin: { top: 20 },
    })
    doc.save("transactions.pdf")
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const customerName = transaction.customer?.username || transaction.customer?.email || ""
    const matchesSearch =
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.reference || "").toLowerCase().includes(searchTerm.toLowerCase())
    // Status and method filters can be expanded if needed
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t("completed")}</Badge>
      case "pending":
      case "pening":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t("pending")}</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t("failed")}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  const completedTransactions = filteredTransactions.filter((t) => t.status === "completed").length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("transactions")}</h1>
          <p className="text-muted-foreground">{t("manageAndTrackPayments")}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("totalTransactions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("completed")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("totalAmount")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("successRate")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTransactions.length > 0
                ? Math.round((completedTransactions / filteredTransactions.length) * 100)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("transactionHistory")}</CardTitle>
          <CardDescription>{t("viewAndFilterHistory")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatus")}</SelectItem>
                <SelectItem value="completed">{t("completed")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="failed">{t("failed")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t("method")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allMethods")}</SelectItem>
                <SelectItem value="Mobile Money">{t("mobileMoney")}</SelectItem>
                <SelectItem value="Credit Card">{t("creditCard")}</SelectItem>
                <SelectItem value="Bank Account">{t("bankAccount")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("transactionId")}</TableHead>
                  <TableHead>{t("dateAndTime")}</TableHead>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("method")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">{t("loading")}</TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">{t("noTransactionsFound")}</TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : "-"}</div>
                          <div className="text-sm text-muted-foreground">{transaction.created_at ? new Date(transaction.created_at).toLocaleTimeString() : "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.customer?.username || transaction.customer?.email || "-"}</div>
                          <div className="text-sm text-muted-foreground">{transaction.customer?.email || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.amount?.toLocaleString?.() || transaction.amount || "-"} {transaction.currency || ""}</TableCell>
                      <TableCell>{transaction.network || transaction.type_trans || "-"}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckStatus(transaction.reference)}
                          disabled={statusLoading[transaction.reference]}
                        >
                          {statusLoading[transaction.reference] ? t("checking") : t("checkStatus")}
                        </Button>
                        {statusMap[transaction.reference] && (
                          <div className="mt-2 text-xs text-blue-600">{t("status")}: {statusMap[transaction.reference]}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
