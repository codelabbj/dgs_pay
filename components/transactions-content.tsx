"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useLanguage } from "@/contexts/language-context"
import { smartFetch, getAccessToken } from "@/utils/auth"

export function TransactionsContent() {
  // Transaction management component with status checking and updating
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({})
  const [checkStatusModal, setCheckStatusModal] = useState<{open: boolean, data: any}>({open: false, data: null})
  
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [paginationInfo, setPaginationInfo] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    totalPages: 0
  })
  const { t } = useLanguage()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  // WebSocket references and state
  const webSocketRef = useRef<WebSocket | null>(null)
  const webSocketReconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transactionsMapRef = useRef(new Map())
  const wsHealth = useRef({
    lastMessageTime: 0,
    messageCount: 0
  })

  useEffect(() => {
    fetchTransactions(currentPage, searchTerm, statusFilter)
    
    // Setup WebSocket connection
    setupWebSocket()
    
    // Add health check interval for WebSocket
    const healthCheckInterval = setInterval(() => {
      const now = Date.now()
      const minutesSinceLastMessage = (now - wsHealth.current.lastMessageTime) / (1000 * 60)
      
      if (wsHealth.current.lastMessageTime > 0 && minutesSinceLastMessage > 5) {
        console.warn('No WebSocket messages received in 5 minutes, reconnecting...')
        setupWebSocket() // Force reconnection
      }
    }, 60000) // Check every minute
    
    // Cleanup function
    return () => {
      clearInterval(healthCheckInterval)
      cleanupWebSocket()
    }
  }, [currentPage, searchTerm, statusFilter, itemsPerPage, startDate, endDate])

  // Separate effect for initial load
  useEffect(() => {
    fetchTransactions(1, "", "all")
  }, [])

  const fetchTransactions = async (page: number = 1, search: string = "", status: string = "all") => {
    setLoading(true)
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: itemsPerPage.toString()
      })
      
      if (search) {
        params.append('search', search)
      }
      
      if (status !== "all") {
        params.append('status', status)
      }
      
      if (startDate) {
        params.append('start_date', startDate)
      }
      if (endDate) {
        params.append('end_date', endDate)
      }
      
      const res = await smartFetch(`${baseUrl}/prod/v1/api/transaction?${params.toString()}`)
      
      if (res.ok) {
        const data = await res.json()
        
        // Handle paginated response structure
        if (data && Array.isArray(data.results)) {
          // Reset the transactions map for new page
          if (page === 1) {
            transactionsMapRef.current.clear()
          }
          
          // Add each transaction to the map
          data.results.forEach((tx: any) => {
            const key = getTransactionKey(tx)
            transactionsMapRef.current.set(key, tx)
          })
          
          setTransactions(data.results)
          
          // Update pagination info
          setPaginationInfo({
            count: data.count || 0,
            next: data.next,
            previous: data.previous,
            totalPages: Math.ceil((data.count || 0) / itemsPerPage)
          })
        } else {
          console.log('API response structure:', data)
          setTransactions([])
          setPaginationInfo({
            count: 0,
            next: null,
            previous: null,
            totalPages: 0
          })
        }
      } else {
        setError(`Failed to fetch transactions: ${res.status}`)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  // Create a function to generate a composite key for transactions
  const getTransactionKey = (transaction: any) => {
    const id = transaction.id || transaction.reference || transaction.transaction_id
    if (!id) {
      console.error('Could not extract ID from transaction:', transaction)
      return `unknown-${Math.random().toString(36).substring(2, 11)}`
    }
    return id.toString()
  }

  // WebSocket setup and management functions
  const setupWebSocket = () => {
    const token = getAccessToken()
    if (!token) {
      console.log('No access token available for WebSocket connection')
      return
    }

    // Clean up existing connection
    cleanupWebSocket()

    try {
      // Replace with your actual WebSocket URL when API is available
      const wsUrl = `${baseUrl?.replace('http', 'ws')}/ws/transactions?token=${encodeURIComponent(token)}`
      console.log('Attempting to connect to WebSocket:', wsUrl)
      
      webSocketRef.current = new WebSocket(wsUrl)

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (webSocketRef.current?.readyState !== WebSocket.OPEN) {
          handleConnectionFailure('Connection timeout')
        }
      }, 5000)

      webSocketRef.current.onopen = () => {
        clearTimeout(connectionTimeout)
        console.log('WebSocket connected successfully')
        webSocketReconnectAttempts.current = 0
        startPingInterval()
      }

      webSocketRef.current.onclose = (event) => {
        clearTimeout(connectionTimeout)
        handleWebSocketClose(event)
      }

      webSocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        handleConnectionFailure('Connection failed')
      }

      webSocketRef.current.onmessage = handleWebSocketMessage

    } catch (error) {
      console.error('WebSocket setup failed:', error)
      handleConnectionFailure('Failed to initialize WebSocket')
    }
  }

  const cleanupWebSocket = () => {
    if (webSocketRef.current) {
      webSocketRef.current.close()
      webSocketRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
  }

  const startPingInterval = () => {
    const pingInterval = setInterval(() => {
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        try {
          webSocketRef.current.send(JSON.stringify({ type: 'ping' }))
        } catch (error) {
          console.error('Failed to send ping:', error)
          cleanupWebSocket()
          setupWebSocket()
        }
      } else {
        clearInterval(pingInterval)
      }
    }, 30000)

    // Store the interval ID for cleanup
    if (webSocketRef.current) {
      (webSocketRef.current as any).pingInterval = pingInterval
    }
  }

  const handleConnectionFailure = (message: string) => {
    console.error(message)
    
    // Implement exponential backoff
    const backoffDelay = Math.min(1000 * Math.pow(2, webSocketReconnectAttempts.current), 30000)
    webSocketReconnectAttempts.current++

    reconnectTimeoutRef.current = setTimeout(() => {
      setupWebSocket()
    }, backoffDelay)
  }

  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)
      wsHealth.current = {
        lastMessageTime: Date.now(),
        messageCount: wsHealth.current.messageCount + 1
      }

      console.log('WebSocket message received:', data)

      switch (data.type) {
        case 'transaction_update':
          handleTransactionUpdate(data.transaction)
          break
        case 'new_transaction':
          handleNewTransaction(data.transaction)
          break
        case 'pong':
          console.log('Received pong from server')
          break
        case 'error':
          console.error('Server error:', data.message)
          break
        default:
          if (data.transaction) {
            const existingTransaction = transactionsMapRef.current.has(getTransactionKey(data.transaction))
            if (existingTransaction) {
              handleTransactionUpdate(data.transaction)
            } else {
              handleNewTransaction(data.transaction)
            }
          }
      }

    } catch (error) {
      console.error('Error processing WebSocket message:', error)
    }
  }

  const handleWebSocketClose = (event: CloseEvent) => {
    cleanupWebSocket()
    
    const reason = getCloseReason(event.code)
    console.log(`WebSocket closed: ${reason}`)

    if (event.code !== 1000) {
      handleConnectionFailure(reason)
    }
  }

  const getCloseReason = (code: number): string => {
    const closeReasons: Record<number, string> = {
      1000: 'Normal closure',
      1001: 'Going away',
      1002: 'Protocol error',
      1003: 'Unsupported data',
      1005: 'No status received',
      1006: 'Abnormal closure',
      1007: 'Invalid frame payload data',
      1008: 'Policy violation',
      1009: 'Message too big',
      1010: 'Mandatory extension',
      1011: 'Internal server error',
      1012: 'Service restart',
      1013: 'Try again later',
      1014: 'Bad gateway',
      1015: 'TLS handshake'
    }

    return closeReasons[code] || `Unknown reason (${code})`
  }

  // Handle new transaction from WebSocket
  const handleNewTransaction = (transaction: any) => {
    const key = getTransactionKey(transaction)
    
    // Check if we already have this transaction
    if (!transactionsMapRef.current.has(key)) {
      // Add to our map
      transactionsMapRef.current.set(key, transaction)
      
      // Add to state (at the beginning)
      setTransactions(prev => [transaction, ...prev])
      console.log('New transaction added via WebSocket:', transaction)
    }
  }
  
  // Handle transaction updates from WebSocket
  const handleTransactionUpdate = (updatedTransaction: any) => {
    const key = getTransactionKey(updatedTransaction)
    
    console.log('Received update for transaction:', key, updatedTransaction)
    
    // Update the transaction in our state
    setTransactions(prev => 
      prev.map(item => {
        if (getTransactionKey(item) === key) {
          // Update the transaction with new data
          return { ...item, ...updatedTransaction }
        }
        return item
      })
    )
    
    // Update the transaction in our map
    if (transactionsMapRef.current.has(key)) {
      const existingItem = transactionsMapRef.current.get(key)
      if (existingItem) {
        const updatedItem = { ...existingItem, ...updatedTransaction }
        transactionsMapRef.current.set(key, updatedItem)
      }
    }
    
    console.log('Transaction updated via WebSocket:', updatedTransaction)
  }

  const handleCheckStatus = async (reference: string) => {
    setStatusLoading((prev) => ({ ...prev, [reference]: true }))
    try {
      const res = await smartFetch(`${baseUrl}/prod/v1/api/transaction-status?reference=${reference}`)
      
      if (res.ok) {
        const data = await res.json()
        setStatusMap((prev) => ({ ...prev, [reference]: data.status || 'Unknown' }))
        // Show the full response in modal
        setCheckStatusModal({open: true, data: data})
      } else {
        setStatusMap((prev) => ({ ...prev, [reference]: 'Error checking status' }))
        setCheckStatusModal({open: true, data: {error: `Failed to check status: ${res.status}`}})
      }
    } catch (error) {
      console.error('Error checking status:', error)
      setStatusMap((prev) => ({ ...prev, [reference]: 'Failed to check status' }))
      setCheckStatusModal({open: true, data: {error: 'Failed to check status'}})
    } finally {
      setStatusLoading((prev) => ({ ...prev, [reference]: false }))
    }
  }


  // Server-side pagination calculations
  const totalItems = paginationInfo.count
  const totalPages = paginationInfo.totalPages
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, methodFilter, startDate, endDate])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== "" || statusFilter !== "all" || startDate || endDate) {
        fetchTransactions(1, searchTerm, statusFilter)
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, startDate, endDate])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t("success")}</Badge>
      case "pending":
      case "pening":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t("pending")}</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t("failed")}</Badge>
      case "expired":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{t("expired")}</Badge>
      case "canceled":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{t("canceled")}</Badge>
      case "refund":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t("refund")}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleExportPDF = async () => {
    try {
      // Build query parameters for export (get all data, not paginated)
      const params = new URLSearchParams({
        page: "1",
        page_size: "1000" // Large number to get all data
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      if (statusFilter !== "all") {
        params.append('status', statusFilter)
      }
      
      if (startDate) {
        params.append('start_date', startDate)
      }
      if (endDate) {
        params.append('end_date', endDate)
      }
      
      const res = await smartFetch(`${baseUrl}/prod/v1/api/transaction?${params.toString()}`)
      
      if (res.ok) {
        const data = await res.json()
        
        // Create PDF using the API response data
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
        
        const tableRows = data.results.map((transaction: any) => {
          const dateObj = transaction.created_at ? new Date(transaction.created_at) : null
          return [
            transaction.id || "-",
            dateObj ? dateObj.toLocaleDateString() : "-",
            dateObj ? dateObj.toLocaleTimeString() : "-",
            transaction.beneficiary?.name || transaction.customer?.username || transaction.customer?.email || "-",
            transaction.beneficiary?.email || transaction.customer?.email || "-",
            transaction.amount?.toLocaleString?.() || transaction.amount || "-",
            (transaction.network && transaction.type_trans
              ? `${transaction.network} (${transaction.type_trans})`
              : (transaction.network || transaction.type_trans || "-")),
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
      } else {
        console.error('Failed to export transactions:', res.status)
        // Fallback to current page data if API fails
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
        const tableRows = transactions.map((transaction) => {
          const dateObj = transaction.created_at ? new Date(transaction.created_at) : null
          return [
            transaction.id || "-",
            dateObj ? dateObj.toLocaleDateString() : "-",
            dateObj ? dateObj.toLocaleTimeString() : "-",
            transaction.beneficiary?.name || transaction.customer?.username || transaction.customer?.email || "-",
            transaction.beneficiary?.email || transaction.customer?.email || "-",
            transaction.amount?.toLocaleString?.() || transaction.amount || "-",
            (transaction.network && transaction.type_trans
              ? `${transaction.network} (${transaction.type_trans})`
              : (transaction.network || transaction.type_trans || "-")),
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
    } catch (error) {
      console.error('Error exporting transactions:', error)
      // Fallback to current page data if API fails
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
      const tableRows = transactions.map((transaction) => {
        const dateObj = transaction.created_at ? new Date(transaction.created_at) : null
        return [
          transaction.id || "-",
          dateObj ? dateObj.toLocaleDateString() : "-",
          dateObj ? dateObj.toLocaleTimeString() : "-",
          transaction.beneficiary?.name || transaction.customer?.username || transaction.customer?.email || "-",
          transaction.beneficiary?.email || transaction.customer?.email || "-",
          transaction.amount?.toLocaleString?.() || transaction.amount || "-",
          (transaction.network && transaction.type_trans
            ? `${transaction.network} (${transaction.type_trans})`
            : (transaction.network || transaction.type_trans || "-")),
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
  }

  const totalAmount = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0)
  const completedTransactions = transactions.filter((t) => t.status === "success" || t.status === "completed").length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("transactions")}</h1>
          <p className="text-muted-foreground">{t("manageAndTrackPayments")}</p>
        </div>
        <div className="flex space-x-2">
          {/* WebSocket Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <div className={`w-2 h-2 rounded-full ${
              webSocketRef.current?.readyState === WebSocket.OPEN 
                ? 'bg-green-500' 
                : webSocketRef.current?.readyState === WebSocket.CONNECTING 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {webSocketRef.current?.readyState === WebSocket.OPEN 
                ? 'Live' 
                : webSocketRef.current?.readyState === WebSocket.CONNECTING 
                ? 'Connecting' 
                : 'Offline'
              }
            </span>
          </div>
          
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
            <div className="text-2xl font-bold">{totalItems}</div>
            {totalPages > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("completed")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTransactions}</div>
            {totalPages > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing {transactions.filter(t => t.status === "success" || t.status === "completed").length} on this page
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("totalAmount")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()} FCFA</div>
            {totalPages > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Page amount: {transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0).toLocaleString()} FCFA
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("successRate")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.length > 0
                ? Math.round((completedTransactions / transactions.length) * 100)
                : 0}
              %
            </div>
            {totalPages > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Page success rate: {transactions.length > 0
                  ? Math.round((transactions.filter(t => t.status === "success" || t.status === "completed").length / transactions.length) * 100)
                  : 0}%
              </p>
            )}
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
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full md:w-40"
                placeholder="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full md:w-40"
                placeholder="End date"
                min={startDate || undefined}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatus")}</SelectItem>
                <SelectItem value="success">{t("success")}</SelectItem>
                <SelectItem value="pening">{t("pending")}</SelectItem>
                <SelectItem value="failed">{t("failed")}</SelectItem>
                <SelectItem value="expired">{t("expired")}</SelectItem>
                {/* <SelectItem value="canceled">{t("canceled")}</SelectItem> */}
                <SelectItem value="refund">{t("refund")}</SelectItem>
              </SelectContent>
            </Select>
            {/* <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t("method")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allMethods")}</SelectItem>
                <SelectItem value="Mobile Money">{t("mobileMoney")}</SelectItem>
                <SelectItem value="Credit Card">{t("creditCard")}</SelectItem>
                <SelectItem value="Bank Account">{t("bankAccount")}</SelectItem>
              </SelectContent>
            </Select> */}
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
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">{t("noTransactionsFound")}</TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
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
                      <TableCell>{transaction.network && transaction.type_trans ? `${transaction.network} (${transaction.type_trans})` : (transaction.network || transaction.type_trans || "-")}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckStatus(transaction.reference)}
                            disabled={statusLoading[transaction.reference]}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {statusLoading[transaction.reference] ? t("checking") : t("checkStatus")}
                          </Button>
                          {statusMap[transaction.reference] && (
                            <div className="mt-2 text-xs text-blue-600">{t("status")}: {statusMap[transaction.reference]}</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Items per page selector */}
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">Rows per page:</p>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Page navigation */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || !paginationInfo.previous}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1 || !paginationInfo.previous}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages || !paginationInfo.next}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || !paginationInfo.next}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check Status Modal */}
      <Dialog open={checkStatusModal.open} onOpenChange={(open) => setCheckStatusModal({open, data: null})}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("transactionStatus")}</DialogTitle>
            <DialogDescription>{t("transactionStatusDetails")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {checkStatusModal.data?.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{checkStatusModal.data.error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("reference")}</label>
                    <p className="text-sm">{checkStatusModal.data?.reference || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("status")}</label>
                    <p className="text-sm">{checkStatusModal.data?.status || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("amount")}</label>
                    <p className="text-sm">{checkStatusModal.data?.amount || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("phone")}</label>
                    <p className="text-sm">{checkStatusModal.data?.phone || '-'}</p>
                  </div>
                </div>
                {/* <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">{t("fullResponse")}</label>
                  <pre className="text-xs mt-2 overflow-auto max-h-40">
                    {JSON.stringify(checkStatusModal.data, null, 2)}
                  </pre>
                </div> */}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
