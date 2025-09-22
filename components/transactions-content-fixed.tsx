"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Search, Download, Eye, RefreshCw, Edit, Copy } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useLanguage } from "@/contexts/language-context"
import { smartFetch, getAccessToken } from "@/utils/auth"
import { toast } from "@/hooks/use-toast"

export function TransactionsContent() {
  // Transaction management component with status checking and updating
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({})
  const [checkStatusModal, setCheckStatusModal] = useState<{open: boolean, data: any}>({open: false, data: null})
  const [changeStatusModal, setChangeStatusModal] = useState<{open: boolean, transaction: any}>({open: false, transaction: null})
  const [selectedNewStatus, setSelectedNewStatus] = useState("")
  const [changeStatusLoading, setChangeStatusLoading] = useState(false)
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
    fetchTransactions()
    
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
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await smartFetch(`${baseUrl}/prod/v1/api/transaction`)
      
      if (res.ok) {
        const data = await res.json()
        // Ensure data is an array, handle different response structures
        if (Array.isArray(data)) {
          // Reset the transactions map for first page
          transactionsMapRef.current.clear()
          
          // Add each transaction to the map
          data.forEach((tx: any) => {
            const key = getTransactionKey(tx)
            transactionsMapRef.current.set(key, tx)
          })
          
          setTransactions(data)
        } else if (data && Array.isArray(data.data)) {
          // Reset the transactions map for first page
          transactionsMapRef.current.clear()
          
          // Add each transaction to the map
          data.data.forEach((tx: any) => {
            const key = getTransactionKey(tx)
            transactionsMapRef.current.set(key, tx)
          })
          
          setTransactions(data.data)
        } else if (data && Array.isArray(data.results)) {
          // Reset the transactions map for first page
          transactionsMapRef.current.clear()
          
          // Add each transaction to the map
          data.results.forEach((tx: any) => {
            const key = getTransactionKey(tx)
            transactionsMapRef.current.set(key, tx)
          })
          
          setTransactions(data.results)
        } else {
          console.log('API response structure:', data)
          setTransactions([])
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

  const handleChangeStatus = async () => {
    if (!selectedNewStatus || !changeStatusModal.transaction) return
    
    setChangeStatusLoading(true)
    try {
      const res = await smartFetch(`${baseUrl}/prod/v1/api/change-trans-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedNewStatus,
          id: changeStatusModal.transaction.id
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        // Update the transaction in the list
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === changeStatusModal.transaction.id 
              ? { ...tx, status: selectedNewStatus, ...data }
              : tx
          )
        )
        setChangeStatusModal({open: false, transaction: null})
        setSelectedNewStatus("")
        // Show success message or refresh the list
        await fetchTransactions()
      } else {
        console.error('Failed to change status:', res.status)
      }
    } catch (error) {
      console.error('Error changing status:', error)
    } finally {
      setChangeStatusLoading(false)
    }
  }

  const filteredTransactions = (Array.isArray(transactions) ? transactions : []).filter((transaction) => {
    const customerName = transaction.customer?.username || transaction.customer?.email || ""
    const matchesSearch =
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.reference || "").toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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

  const handleExportPDF = () => {
    const doc = new jsPDF()
    const tableColumn = [
      t("reference"),
      t("date"),
      t("time"),
      t("customer"),
      t("email"),
      t("amount"),
      t("method"),
      t("status"),
      // first column now is reference
    ]
    const tableRows = filteredTransactions.map((transaction) => {
      const dateObj = transaction.created_at ? new Date(transaction.created_at) : null
      return [
        transaction.reference || "-",
        dateObj ? dateObj.toLocaleDateString() : "-",
        dateObj ? dateObj.toLocaleTimeString() : "-",
        transaction.customer?.username || transaction.customer?.email || "-",
        transaction.customer?.email || "-",
        transaction.amount?.toLocaleString?.() || transaction.amount || "-",
        transaction.network || transaction.type_trans || "-",
        transaction.status || "-",
        // removed duplicate reference column
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

  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  const completedTransactions = filteredTransactions.filter((t) => t.status === "success" || t.status === "completed").length

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: t("copied") })
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

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
                <SelectItem value="success">{t("success")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="failed">{t("failed")}</SelectItem>
                <SelectItem value="expired">{t("expired")}</SelectItem>
                <SelectItem value="canceled">{t("canceled")}</SelectItem>
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
                  <TableHead>{t("reference")}</TableHead>
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
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <span className="truncate max-w-[160px]">{transaction.reference || "-"}</span>
                        {transaction.reference && (
                          <button
                            type="button"
                            onClick={() => handleCopy(transaction.reference)}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                            title={t("copy")}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChangeStatusModal({open: true, transaction: transaction})}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {t("changeStatus")}
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
                    <p className="text-sm flex items-center">
                      <span className="truncate">{checkStatusModal.data?.reference || '-'}</span>
                      {checkStatusModal.data?.reference && (
                        <button
                          type="button"
                          onClick={() => handleCopy(checkStatusModal.data.reference)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                          title={t("copy")}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                    </p>
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
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">{t("fullResponse")}</label>
                  <pre className="text-xs mt-2 overflow-auto max-h-40">
                    {JSON.stringify(checkStatusModal.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={changeStatusModal.open} onOpenChange={(open) => setChangeStatusModal({open, transaction: null})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("changeTransactionStatus")}</DialogTitle>
            <DialogDescription>{t("selectNewStatusForTransaction")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {changeStatusModal.transaction && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("reference")}</label>
                    <p className="text-sm flex items-center">
                      <span className="truncate">{changeStatusModal.transaction.reference || '-'}</span>
                      {changeStatusModal.transaction.reference && (
                        <button
                          type="button"
                          onClick={() => handleCopy(changeStatusModal.transaction.reference)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                          title={t("copy")}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("currentStatus")}</label>
                    <div className="mt-1">{getStatusBadge(changeStatusModal.transaction.status)}</div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">{t("newStatus")}</label>
                  <Select value={selectedNewStatus} onValueChange={setSelectedNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">{t("success")}</SelectItem>
                      <SelectItem value="pending">{t("pending")}</SelectItem>
                      <SelectItem value="failed">{t("failed")}</SelectItem>
                      <SelectItem value="expired">{t("expired")}</SelectItem>
                      <SelectItem value="canceled">{t("canceled")}</SelectItem>
                      <SelectItem value="refund">{t("refund")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setChangeStatusModal({open: false, transaction: null})}
                  >
                    {t("cancel")}
                  </Button>
                  <Button 
                    onClick={handleChangeStatus}
                    disabled={!selectedNewStatus || changeStatusLoading}
                  >
                    {changeStatusLoading ? t("updating") : t("updateStatus")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
