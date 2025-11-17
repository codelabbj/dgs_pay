"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy, RotateCcw, DollarSign, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useLanguage } from "@/contexts/language-context"
import { smartFetch, getAccessToken } from "@/utils/auth"
import { toast } from "@/hooks/use-toast"

// Types for the new API
interface Transaction {
  uid: string
  reference: string
  type_trans: "payin" | "payout"
  type_trans_display: string
  amount: number
  formatted_amount: string
  phone: string
  status: "processing" | "completed" | "failed"
  status_display: string
  operator_name: string
  description: string
  client_reference: string
  commission_amount: number
  customer_balance_after: number | null
  error_message: string
  created_at: string
  completed_at: string | null
  external_id?: string
  redirection_url?: string
  is_finalized: boolean
  can_be_refunded: boolean
  refund_requested: boolean
  refund_requested_at: string | null
}

interface TransactionListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Transaction[]
}

interface PayinPayload {
  operator_code: string
  amount: number
  phone: string
  description: string
  success_url: string
  cancel_url: string
  client_reference: string
  currency: string
  beneficiary: {
    name: string
    account_number: string
    email: string
  }
}

interface PayoutPayload {
  operator_code: string
  amount: number
  phone: string
  beneficiary_first_name: string
  beneficiary_last_name: string
  description: string
  client_reference: string
  currency: string
  beneficiary: {
    name: string
    account_number: string
    email: string
  }
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

interface SyncResponse {
  message: string
  reference: string
  old_status: string
  new_status: string
  wave_status: string | null
  payment_status: string
}

export function TransactionsContent() {
  // Transaction management component with new API integration
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({})
  const [checkStatusModal, setCheckStatusModal] = useState<{open: boolean, data: Transaction | null}>({open: false, data: null})
  const [syncLoading, setSyncLoading] = useState<Record<string, boolean>>({})
  const [refundLoading, setRefundLoading] = useState<Record<string, boolean>>({})
  const [operators, setOperators] = useState<Operator[]>([])
  const [payinError, setPayinError] = useState<string | null>(null)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  
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

  // Static operator options
  const OPERATOR_OPTIONS = [
    { value: "wave-ci", label: "Wave CI" },
    { value: "mtn-ci", label: "MTN CI" },
    { value: "orange-ci", label: "Orange CI" }
  ]

  // Modal states for creating transactions
  const [payinModal, setPayinModal] = useState(false)
  const [payoutModal, setPayoutModal] = useState(false)
  const [payinForm, setPayinForm] = useState({
    operator_code: "",
    amount: "",
    phone: "",
    description: "",
    success_url: "https://codelab.bj",
    cancel_url: "https://djofo.codelab.bj",
    client_reference: "",
    currency: "XOF",
    beneficiary_name: "",
    beneficiary_account_number: "",
    beneficiary_email: ""
  })
  const [payoutForm, setPayoutForm] = useState({
    operator_code: "",
    amount: "",
    phone: "",
    beneficiary_first_name: "",
    beneficiary_last_name: "",
    description: "",
    client_reference: "",
    currency: "XOF",
    beneficiary_name: "",
    beneficiary_account_number: "",
    beneficiary_email: ""
  })

  // COMMENTED OUT: Old WebSocket implementation
  // const webSocketRef = useRef<WebSocket | null>(null)
  // const webSocketReconnectAttempts = useRef(0)
  // const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // const transactionsMapRef = useRef(new Map())
  // const wsHealth = useRef({
  //   lastMessageTime: 0,
  //   messageCount: 0
  // })

  useEffect(() => {
    fetchTransactions(currentPage, searchTerm, statusFilter, typeFilter)
  }, [currentPage, searchTerm, statusFilter, typeFilter, itemsPerPage, startDate, endDate])

  // Separate effect for initial load
  useEffect(() => {
    fetchTransactions(1, "", "all", "all")
    fetchOperators()
  }, [])

  const fetchOperators = async () => {
    try {
      const res = await smartFetch(`${baseUrl}/api/v2/operators/`)
      if (res.ok) {
        const data: Operator[] = await res.json()
        setOperators(data)
      }
    } catch (error) {
      console.error('Error fetching operators:', error)
    }
  }

  // COMMENTED OUT: Old WebSocket setup
  // useEffect(() => {
  //   fetchTransactions(currentPage, searchTerm, statusFilter)
  //   
  //   // Setup WebSocket connection
  //   setupWebSocket()
  //   
  //   // Add health check interval for WebSocket
  //   const healthCheckInterval = setInterval(() => {
  //     const now = Date.now()
  //     const minutesSinceLastMessage = (now - wsHealth.current.lastMessageTime) / (1000 * 60)
  //     
  //     if (wsHealth.current.lastMessageTime > 0 && minutesSinceLastMessage > 5) {
  //       console.warn('No WebSocket messages received in 5 minutes, reconnecting...')
  //       setupWebSocket() // Force reconnection
  //     }
  //   }, 60000) // Check every minute
  //   
  //   // Cleanup function
  //   return () => {
  //     clearInterval(healthCheckInterval)
  //     cleanupWebSocket()
  //   }
  // }, [currentPage, searchTerm, statusFilter, itemsPerPage, startDate, endDate])

  // Separate effect for initial load
  // useEffect(() => {
  //   fetchTransactions(1, "", "all")
  // }, [])

  // New API implementation for fetching transactions
  const fetchTransactions = async (page: number = 1, search: string = "", status: string = "all", type: string = "all") => {
    setLoading(true)
    try {
      // Build query parameters for new API
      const params = new URLSearchParams({
        page: page.toString()
      })
      
      if (status !== "all") {
        params.append('status', status)
      }
      
      if (type !== "all") {
        params.append('type', type)
      }
      
      const res = await smartFetch(`${baseUrl}/api/v2/transactions/?${params.toString()}`)
      
      if (res.ok) {
        const data: TransactionListResponse = await res.json()
        
        setTransactions(data.results)
        
        // Update pagination info
        setPaginationInfo({
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
          totalPages: Math.ceil((data.count || 0) / itemsPerPage)
        })
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

  // COMMENTED OUT: Old fetchTransactions implementation
  // const fetchTransactions = async (page: number = 1, search: string = "", status: string = "all") => {
  //   setLoading(true)
  //   try {
  //     // Build query parameters
  //     const params = new URLSearchParams({
  //       page: page.toString(),
  //       page_size: itemsPerPage.toString()
  //     })
  //     
  //     if (search) {
  //       params.append('search', search)
  //     }
  //     
  //     if (status !== "all") {
  //       params.append('status', status)
  //     }
  //     
  //     if (startDate) {
  //       params.append('start_date', startDate)
  //     }
  //     if (endDate) {
  //       params.append('end_date', endDate)
  //     }
  //     
  //     const res = await smartFetch(`${baseUrl}/prod/v1/api/transaction?${params.toString()}`)
  //     
  //     if (res.ok) {
  //       const data = await res.json()
  //       
  //       // Handle paginated response structure
  //       if (data && Array.isArray(data.results)) {
  //         // Reset the transactions map for new page
  //         if (page === 1) {
  //           transactionsMapRef.current.clear()
  //         }
  //         
  //         // Add each transaction to the map
  //         data.results.forEach((tx: any) => {
  //           const key = getTransactionKey(tx)
  //           transactionsMapRef.current.set(key, tx)
  //         })
  //         
  //         setTransactions(data.results)
  //         
  //         // Update pagination info
  //         setPaginationInfo({
  //           count: data.count || 0,
  //           next: data.next,
  //           previous: data.previous,
  //           totalPages: Math.ceil((data.count || 0) / itemsPerPage)
  //         })
  //       } else {
  //         console.log('API response structure:', data)
  //         setTransactions([])
  //         setPaginationInfo({
  //           count: 0,
  //           next: null,
  //           previous: null,
  //           totalPages: 0
  //         })
  //       }
  //     } else {
  //       setError(`Failed to fetch transactions: ${res.status}`)
  //     }
  //   } catch (error) {
  //     console.error('Error fetching transactions:', error)
  //     setError('Failed to fetch transactions')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // New API functions
  const syncTransaction = async (transactionUid: string) => {
    setSyncLoading(prev => ({ ...prev, [transactionUid]: true }))
    try {
      const res = await smartFetch(`${baseUrl}/api/v2/transactions/${transactionUid}/sync/`, {
        method: 'POST'
      })
      
      if (res.ok) {
        const data: SyncResponse = await res.json()
        toast({
          title: t("success"),
          description: data.message
        })
        // Refresh transactions to get updated status
        fetchTransactions(currentPage, searchTerm, statusFilter, typeFilter)
      } else {
        toast({
          title: t("error"),
          description: `Failed to sync transaction: ${res.status}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error syncing transaction:', error)
      toast({
        title: t("error"),
        description: "Failed to sync transaction",
        variant: "destructive"
      })
    } finally {
      setSyncLoading(prev => ({ ...prev, [transactionUid]: false }))
    }
  }

  const getTransactionDetails = async (reference: string) => {
    setStatusLoading(prev => ({ ...prev, [reference]: true }))
    try {
      const res = await smartFetch(`${baseUrl}/api/v2/transactions/${reference}/`)
      
      if (res.ok) {
        const data: Transaction = await res.json()
        setCheckStatusModal({ open: true, data })
      } else {
        toast({
          title: t("error"),
          description: `Failed to get transaction details: ${res.status}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error getting transaction details:', error)
      toast({
        title: t("error"),
        description: "Failed to get transaction details",
        variant: "destructive"
      })
    } finally {
      setStatusLoading(prev => ({ ...prev, [reference]: false }))
    }
  }

  const requestRefund = async (reference: string) => {
    setRefundLoading(prev => ({ ...prev, [reference]: true }))
    try {
      const res = await smartFetch(`${baseUrl}/api/v2/transactions/${reference}/request-refund/`, {
        method: 'POST'
      })
      
      if (res.ok) {
        toast({
          title: t("success"),
          description: "Refund requested successfully"
        })
        // Refresh transactions
        fetchTransactions(currentPage, searchTerm, statusFilter, typeFilter)
      } else {
        toast({
          title: t("error"),
          description: `Failed to request refund: ${res.status}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error requesting refund:', error)
      toast({
        title: t("error"),
        description: "Failed to request refund",
        variant: "destructive"
      })
    } finally {
      setRefundLoading(prev => ({ ...prev, [reference]: false }))
    }
  }

  const createPayin = async () => {
    setPayinError(null)
    try {
      const payload: PayinPayload = {
        operator_code: payinForm.operator_code,
        amount: parseInt(payinForm.amount),
        phone: payinForm.phone,
        description: payinForm.description,
        success_url: payinForm.success_url,
        cancel_url: payinForm.cancel_url,
        client_reference: payinForm.client_reference,
        currency: payinForm.currency,
        beneficiary: {
          name: payinForm.beneficiary_name,
          account_number: payinForm.beneficiary_account_number,
          email: payinForm.beneficiary_email
        }
      }

      const res = await smartFetch(`${baseUrl}/api/v2/payin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        const data: Transaction = await res.json()
        toast({
          title: t("success"),
          description: "Payin created successfully"
        })
        setPayinModal(false)
        setPayinError(null)
        setPayinForm({
          operator_code: "",
          amount: "",
          phone: "",
          description: "",
          success_url: "https://codelab.bj",
          cancel_url: "https://djofo.codelab.bj",
          client_reference: "",
          currency: "XOF",
          beneficiary_name: "",
          beneficiary_account_number: "",
          beneficiary_email: ""
        })
        // Refresh transactions
        fetchTransactions(currentPage, searchTerm, statusFilter, typeFilter)
      } else {
        try {
          const errorData = await res.json()
          let errorMessage = 'Failed to create payin'
          
          // Handle different error response formats
          if (typeof errorData === 'object' && errorData !== null) {
            // Handle field-specific errors like {"operator_code":["Vous n'êtes pas autorisé à utiliser cet opérateur"]}
            const fieldErrors = Object.entries(errorData).map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`
              }
              return `${field}: ${errors}`
            }).join('\n')
            errorMessage = fieldErrors || errorData.detail || errorData.message || errorMessage
          } else if (typeof errorData === 'string') {
            errorMessage = errorData
          }
          
          setPayinError(errorMessage)
        toast({
          title: t("error"),
            description: errorMessage,
            variant: "destructive"
          })
        } catch (parseError) {
          const errorMsg = `Failed to create payin: ${res.status} ${res.statusText}`
          setPayinError(errorMsg)
          toast({
            title: t("error"),
            description: errorMsg,
          variant: "destructive"
        })
        }
      }
    } catch (error) {
      console.error('Error creating payin:', error)
      const errorMsg = "Failed to create payin"
      setPayinError(errorMsg)
      toast({
        title: t("error"),
        description: errorMsg,
        variant: "destructive"
      })
    }
  }

  const createPayout = async () => {
    setPayoutError(null)
    try {
      const payload: PayoutPayload = {
        operator_code: payoutForm.operator_code,
        amount: parseInt(payoutForm.amount),
        phone: payoutForm.phone,
        beneficiary_first_name: payoutForm.beneficiary_first_name,
        beneficiary_last_name: payoutForm.beneficiary_last_name,
        description: payoutForm.description,
        client_reference: payoutForm.client_reference,
        currency: payoutForm.currency,
        beneficiary: {
          name: payoutForm.beneficiary_name,
          account_number: payoutForm.beneficiary_account_number,
          email: payoutForm.beneficiary_email
        }
      }

      const res = await smartFetch(`${baseUrl}/api/v2/payout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        const data: Transaction = await res.json()
        toast({
          title: t("success"),
          description: "Payout created successfully"
        })
        setPayoutModal(false)
        setPayoutError(null)
        setPayoutForm({
          operator_code: "",
          amount: "",
          phone: "",
          beneficiary_first_name: "",
          beneficiary_last_name: "",
          description: "",
          client_reference: "",
          currency: "XOF",
          beneficiary_name: "",
          beneficiary_account_number: "",
          beneficiary_email: ""
        })
        // Refresh transactions
        fetchTransactions(currentPage, searchTerm, statusFilter, typeFilter)
      } else {
        try {
          const errorData = await res.json()
          let errorMessage = 'Failed to create payout'
          
          // Handle different error response formats
          if (typeof errorData === 'object' && errorData !== null) {
            // Handle field-specific errors
            const fieldErrors = Object.entries(errorData).map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`
              }
              return `${field}: ${errors}`
            }).join('\n')
            errorMessage = fieldErrors || errorData.detail || errorData.message || errorMessage
          } else if (typeof errorData === 'string') {
            errorMessage = errorData
          }
          
          setPayoutError(errorMessage)
        toast({
          title: t("error"),
            description: errorMessage,
            variant: "destructive"
          })
        } catch (parseError) {
          const errorMsg = `Failed to create payout: ${res.status} ${res.statusText}`
          setPayoutError(errorMsg)
          toast({
            title: t("error"),
            description: errorMsg,
          variant: "destructive"
        })
        }
      }
    } catch (error) {
      console.error('Error creating payout:', error)
      const errorMsg = "Failed to create payout"
      setPayoutError(errorMsg)
      toast({
        title: t("error"),
        description: errorMsg,
        variant: "destructive"
      })
    }
  }

  // COMMENTED OUT: Old transaction key function
  // const getTransactionKey = (transaction: any) => {
  //   const id = transaction.id || transaction.reference || transaction.transaction_id
  //   if (!id) {
  //     console.error('Could not extract ID from transaction:', transaction)
  //     return `unknown-${Math.random().toString(36).substring(2, 11)}`
  //   }
  //   return id.toString()
  // }

  // COMMENTED OUT: Old WebSocket implementation
  // const setupWebSocket = () => {
  //   const token = getAccessToken()
  //   if (!token) {
  //     console.log('No access token available for WebSocket connection')
  //     return
  //   }

  //   // Clean up existing connection
  //   cleanupWebSocket()

  //   try {
  //     // Replace with your actual WebSocket URL when API is available
  //     const wsUrl = `${baseUrl?.replace('http', 'ws')}/ws/transactions?token=${encodeURIComponent(token)}`
  //     console.log('Attempting to connect to WebSocket:', wsUrl)
  //     
  //     webSocketRef.current = new WebSocket(wsUrl)

  //     // Set connection timeout
  //     const connectionTimeout = setTimeout(() => {
  //       if (webSocketRef.current?.readyState !== WebSocket.OPEN) {
  //         handleConnectionFailure('Connection timeout')
  //       }
  //     }, 5000)

  //     webSocketRef.current.onopen = () => {
  //       clearTimeout(connectionTimeout)
  //       console.log('WebSocket connected successfully')
  //       webSocketReconnectAttempts.current = 0
  //       startPingInterval()
  //     }

  //     webSocketRef.current.onclose = (event) => {
  //       clearTimeout(connectionTimeout)
  //       handleWebSocketClose(event)
  //     }

  //     webSocketRef.current.onerror = (error) => {
  //       console.error('WebSocket error:', error)
  //       handleConnectionFailure('Connection failed')
  //     }

  //     webSocketRef.current.onmessage = handleWebSocketMessage

  //   } catch (error) {
  //     console.error('WebSocket setup failed:', error)
  //     handleConnectionFailure('Failed to initialize WebSocket')
  //   }
  // }

  // const cleanupWebSocket = () => {
  //   if (webSocketRef.current) {
  //     webSocketRef.current.close()
  //     webSocketRef.current = null
  //   }
  //   if (reconnectTimeoutRef.current) {
  //     clearTimeout(reconnectTimeoutRef.current)
  //   }
  // }

  // const startPingInterval = () => {
  //   const pingInterval = setInterval(() => {
  //     if (webSocketRef.current?.readyState === WebSocket.OPEN) {
  //       try {
  //         webSocketRef.current.send(JSON.stringify({ type: 'ping' }))
  //       } catch (error) {
  //         console.error('Failed to send ping:', error)
  //         cleanupWebSocket()
  //         setupWebSocket()
  //       }
  //     } else {
  //       clearInterval(pingInterval)
  //     }
  //   }, 30000)

  //   // Store the interval ID for cleanup
  //   if (webSocketRef.current) {
  //     (webSocketRef.current as any).pingInterval = pingInterval
  //   }
  // }

  // const handleConnectionFailure = (message: string) => {
  //   console.error(message)
  //   
  //   // Implement exponential backoff
  //   const backoffDelay = Math.min(1000 * Math.pow(2, webSocketReconnectAttempts.current), 30000)
  //   webSocketReconnectAttempts.current++

  //   reconnectTimeoutRef.current = setTimeout(() => {
  //     setupWebSocket()
  //   }, backoffDelay)
  // }

  // const handleWebSocketMessage = (event: MessageEvent) => {
  //   try {
  //     const data = JSON.parse(event.data)
  //     wsHealth.current = {
  //       lastMessageTime: Date.now(),
  //       messageCount: wsHealth.current.messageCount + 1
  //     }

  //     console.log('WebSocket message received:', data)

  //     switch (data.type) {
  //       case 'transaction_update':
  //         handleTransactionUpdate(data.transaction)
  //         break
  //       case 'new_transaction':
  //         handleNewTransaction(data.transaction)
  //         break
  //       case 'pong':
  //         console.log('Received pong from server')
  //         break
  //       case 'error':
  //         console.error('Server error:', data.message)
  //         break
  //       default:
  //         if (data.transaction) {
  //           const existingTransaction = transactionsMapRef.current.has(getTransactionKey(data.transaction))
  //           if (existingTransaction) {
  //             handleTransactionUpdate(data.transaction)
  //           } else {
  //             handleNewTransaction(data.transaction)
  //           }
  //         }
  //     }

  //   } catch (error) {
  //     console.error('Error processing WebSocket message:', error)
  //   }
  // }

  // const handleWebSocketClose = (event: CloseEvent) => {
  //   cleanupWebSocket()
  //   
  //   const reason = getCloseReason(event.code)
  //   console.log(`WebSocket closed: ${reason}`)

  //   if (event.code !== 1000) {
  //     handleConnectionFailure(reason)
  //   }
  // }

  // const getCloseReason = (code: number): string => {
  //   const closeReasons: Record<number, string> = {
  //     1000: 'Normal closure',
  //     1001: 'Going away',
  //     1002: 'Protocol error',
  //     1003: 'Unsupported data',
  //     1005: 'No status received',
  //     1006: 'Abnormal closure',
  //     1007: 'Invalid frame payload data',
  //     1008: 'Policy violation',
  //     1009: 'Message too big',
  //     1010: 'Mandatory extension',
  //     1011: 'Internal server error',
  //     1012: 'Service restart',
  //     1013: 'Try again later',
  //     1014: 'Bad gateway',
  //     1015: 'TLS handshake'
  //   }

  //   return closeReasons[code] || `Unknown reason (${code})`
  // }

  // // Handle new transaction from WebSocket
  // const handleNewTransaction = (transaction: any) => {
  //   const key = getTransactionKey(transaction)
  //   
  //   // Check if we already have this transaction
  //   if (!transactionsMapRef.current.has(key)) {
  //     // Add to our map
  //     transactionsMapRef.current.set(key, transaction)
  //     
  //     // Add to state (at the beginning)
  //     setTransactions(prev => [transaction, ...prev])
  //     console.log('New transaction added via WebSocket:', transaction)
  //   }
  // }
  
  // // Handle transaction updates from WebSocket
  // const handleTransactionUpdate = (updatedTransaction: any) => {
  //   const key = getTransactionKey(updatedTransaction)
  //   
  //   console.log('Received update for transaction:', key, updatedTransaction)
  //   
  //   // Update the transaction in our state
  //   setTransactions(prev => 
  //     prev.map(item => {
  //       if (getTransactionKey(item) === key) {
  //         // Update the transaction with new data
  //         return { ...item, ...updatedTransaction }
  //       }
  //       return item
  //     })
  //   )
  //   
  //   // Update the transaction in our map
  //   if (transactionsMapRef.current.has(key)) {
  //     const existingItem = transactionsMapRef.current.get(key)
  //     if (existingItem) {
  //       const updatedItem = { ...existingItem, ...updatedTransaction }
  //       transactionsMapRef.current.set(key, updatedItem)
  //     }
  //   }
  //   
  //   console.log('Transaction updated via WebSocket:', updatedTransaction)
  // }

  // COMMENTED OUT: Old status check implementation
  // const handleCheckStatus = async (reference: string) => {
  //   setStatusLoading((prev) => ({ ...prev, [reference]: true }))
  //   try {
  //     const res = await smartFetch(`${baseUrl}/prod/v1/api/transaction-status?reference=${reference}`)
  //     
  //     if (res.ok) {
  //       const data = await res.json()
  //       setStatusMap((prev) => ({ ...prev, [reference]: data.status || 'Unknown' }))
  //       // Show the full response in modal
  //       setCheckStatusModal({open: true, data: data})
  //     } else {
  //       setStatusMap((prev) => ({ ...prev, [reference]: 'Error checking status' }))
  //       setCheckStatusModal({open: true, data: {error: `Failed to check status: ${res.status}`}})
  //     }
  //   } catch (error) {
  //     console.error('Error checking status:', error)
  //     setStatusMap((prev) => ({ ...prev, [reference]: 'Failed to check status' }))
  //     setCheckStatusModal({open: true, data: {error: 'Failed to check status'}})
  //   } finally {
  //     setStatusLoading((prev) => ({ ...prev, [reference]: false }))
  //   }
  // }


  // Server-side pagination calculations
  const totalItems = paginationInfo.count
  const totalPages = paginationInfo.totalPages
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter, startDate, endDate])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== "" || statusFilter !== "all" || typeFilter !== "all" || startDate || endDate) {
        fetchTransactions(1, searchTerm, statusFilter, typeFilter)
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, typeFilter, startDate, endDate])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t("completed")}</Badge>
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t("processing")}</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t("failed")}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payin":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "payout":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const handleExportPDF = async () => {
    try {
      // Build query parameters for export using new API
      const params = new URLSearchParams({
        page: "1"
      })
      
      if (statusFilter !== "all") {
        params.append('status', statusFilter)
      }
      
      if (typeFilter !== "all") {
        params.append('type', typeFilter)
      }
      
      const res = await smartFetch(`${baseUrl}/api/v2/transactions/?${params.toString()}`)
      
      if (res.ok) {
        const data: TransactionListResponse = await res.json()
        
        // Create PDF using the API response data
        const doc = new jsPDF()
        const tableColumn = [
          t("reference"),
          t("date"),
          t("time"),
          "Type",
          t("phone"),
          t("amount"),
          "Operator",
          t("status"),
          t("description")
        ]
        
        const tableRows = data.results.map((transaction: Transaction) => {
          const dateObj = transaction.created_at ? new Date(transaction.created_at) : null
          return [
            transaction.reference || "-",
            dateObj ? dateObj.toLocaleDateString() : "-",
            dateObj ? dateObj.toLocaleTimeString() : "-",
            transaction.type_trans_display || "-",
            transaction.phone || "-",
            transaction.formatted_amount || "-",
            transaction.operator_name || "-",
            transaction.status_display || "-",
            transaction.description || "-"
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
          t("reference"),
          t("date"),
          t("time"),
          "Type",
          t("phone"),
          t("amount"),
          "Operator",
          t("status"),
          t("description")
        ]
        const tableRows = transactions.map((transaction) => {
          const dateObj = transaction.created_at ? new Date(transaction.created_at) : null
          return [
            transaction.reference || "-",
            dateObj ? dateObj.toLocaleDateString() : "-",
            dateObj ? dateObj.toLocaleTimeString() : "-",
            transaction.type_trans_display || "-",
            transaction.phone || "-",
            transaction.formatted_amount || "-",
            transaction.operator_name || "-",
            transaction.status_display || "-",
            transaction.description || "-"
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
        t("reference"),
        t("date"),
        t("time"),
        "Type",
        t("phone"),
        t("amount"),
        t("operator"),
        t("status"),
        t("description")
      ]
      const tableRows = transactions.map((transaction) => {
        const dateObj = transaction.created_at ? new Date(transaction.created_at) : null
        return [
          transaction.reference || "-",
          dateObj ? dateObj.toLocaleDateString() : "-",
          dateObj ? dateObj.toLocaleTimeString() : "-",
          transaction.type_trans_display || "-",
          transaction.phone || "-",
          transaction.formatted_amount || "-",
          transaction.operator_name || "-",
          transaction.status_display || "-",
          transaction.description || "-"
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
  const completedTransactions = transactions.filter((t) => t.status === "completed").length

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
          <Button variant="outline" onClick={() => setPayinModal(true)}>
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            {t("createPayin")}
          </Button>
          <Button variant="outline" onClick={() => setPayoutModal(true)}>
            <ArrowUpRight className="h-4 w-4 mr-2" />
            {t("createPayout")}
          </Button>
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
                Showing {transactions.filter(t => t.status === "completed").length} on this page
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
                  ? Math.round((transactions.filter(t => t.status === "completed").length / transactions.length) * 100)
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
                <SelectItem value="completed">{t("completed")}</SelectItem>
                <SelectItem value="processing">{t("processing")}</SelectItem>
                <SelectItem value="failed">{t("failed")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t("type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTypes")}</SelectItem>
                <SelectItem value="payin">{t("payin")}</SelectItem>
                <SelectItem value="payout">{t("payout")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reference")}</TableHead>
                  <TableHead>{t("dateAndTime")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("phone")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("operator")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">{t("loading")}</TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">{t("noTransactionsFound")}</TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.uid}>
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
                        <div className="flex items-center">
                          {getTypeIcon(transaction.type_trans)}
                          <span className="ml-2">{transaction.type_trans_display}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{transaction.phone || "-"}</div>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.formatted_amount || "-"}</TableCell>
                      <TableCell>{transaction.operator_name || "-"}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => getTransactionDetails(transaction.reference)}
                            disabled={statusLoading[transaction.reference]}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {statusLoading[transaction.reference] ? t("checking") : "Details"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncTransaction(transaction.uid)}
                            disabled={syncLoading[transaction.uid]}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            {syncLoading[transaction.uid] ? "Syncing..." : "Sync"}
                          </Button>
                          {transaction.can_be_refunded && !transaction.refund_requested && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => requestRefund(transaction.reference)}
                              disabled={refundLoading[transaction.reference]}
                            >
                              {refundLoading[transaction.reference] ? "Requesting..." : "Refund"}
                            </Button>
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

      {/* Transaction Details Modal */}
      <Dialog open={checkStatusModal.open} onOpenChange={(open) => setCheckStatusModal({open, data: null})}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("transactionDetails")}</DialogTitle>
            <DialogDescription>{t("viewDetailedInformation")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {checkStatusModal.data ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("reference")}</label>
                    <p className="text-sm flex items-center">
                      <span className="truncate">{checkStatusModal.data?.reference || '-'}</span>
                      {checkStatusModal.data?.reference && (
                        <button
                          type="button"
                          onClick={() => handleCopy(checkStatusModal.data?.reference || '')}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                          title={t("copy")}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">UID</label>
                    <p className="text-sm">{checkStatusModal.data?.uid || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("status")}</label>
                    <p className="text-sm">{checkStatusModal.data?.status_display || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="text-sm">{checkStatusModal.data?.type_trans_display || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("amount")}</label>
                    <p className="text-sm">{checkStatusModal.data?.formatted_amount || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("phone")}</label>
                    <p className="text-sm">{checkStatusModal.data?.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Operator</label>
                    <p className="text-sm">{checkStatusModal.data?.operator_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Commission</label>
                    <p className="text-sm">{checkStatusModal.data?.commission_amount || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm">{checkStatusModal.data?.description || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Client Reference</label>
                    <p className="text-sm">{checkStatusModal.data?.client_reference || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-sm">{checkStatusModal.data?.created_at ? new Date(checkStatusModal.data.created_at).toLocaleString() : '-'}</p>
                  </div>
                  {checkStatusModal.data?.completed_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Completed At</label>
                      <p className="text-sm">{new Date(checkStatusModal.data.completed_at).toLocaleString()}</p>
                    </div>
                  )}
                  {checkStatusModal.data?.error_message && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Error Message</label>
                      <p className="text-sm text-red-600">{checkStatusModal.data.error_message}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">No transaction data available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payin Creation Modal */}
      <Dialog open={payinModal} onOpenChange={(open) => {
        setPayinModal(open)
        if (!open) {
          setPayinError(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("createPayin")}</DialogTitle>
            <DialogDescription>{t("createNewPayinTransaction")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {payinError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-2 text-red-600 dark:text-red-400">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("errorTitle")}</p>
                    <div className="text-xs mt-2 whitespace-pre-wrap break-words bg-red-100 dark:bg-red-900/30 p-2 rounded border">
                      {payinError}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t("operator")}</label>
                <Select
                  value={payinForm.operator_code}
                  onValueChange={(value) => setPayinForm(prev => ({ ...prev, operator_code: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectOperator")} />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.length > 0 ? (
                      operators.map((operator) => (
                        <SelectItem key={operator.uid} value={operator.operator_code}>
                          {operator.operator_name}
                        </SelectItem>
                      ))
                    ) : (
                      OPERATOR_OPTIONS.map((operator) => (
                        <SelectItem key={operator.value} value={operator.value}>
                          {operator.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t("amount")}</label>
                <Input
                  type="number"
                  value={payinForm.amount}
                  onChange={(e) => setPayinForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder={t("enterAmount")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("phone")}</label>
                <Input
                  value={payinForm.phone}
                  onChange={(e) => setPayinForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t("enterPhoneNumber")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("description")}</label>
                <Input
                  value={payinForm.description}
                  onChange={(e) => setPayinForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t("enterDescription")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("clientReference")}</label>
                <Input
                  value={payinForm.client_reference}
                  onChange={(e) => setPayinForm(prev => ({ ...prev, client_reference: e.target.value }))}
                  placeholder={t("enterClientReference")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("beneficiaryName")}</label>
                <Input
                  value={payinForm.beneficiary_name}
                  onChange={(e) => setPayinForm(prev => ({ ...prev, beneficiary_name: e.target.value }))}
                  placeholder={t("enterBeneficiaryName")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("beneficiaryAccountNumber")}</label>
                <Input
                  value={payinForm.beneficiary_account_number}
                  onChange={(e) => setPayinForm(prev => ({ ...prev, beneficiary_account_number: e.target.value }))}
                  placeholder={t("enterAccountNumber")}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">{t("beneficiaryEmail")}</label>
                <Input
                  type="email"
                  value={payinForm.beneficiary_email}
                  onChange={(e) => setPayinForm(prev => ({ ...prev, beneficiary_email: e.target.value }))}
                  placeholder={t("enterEmailAddress")}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setPayinModal(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={createPayin}>
                {t("createPayin")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payout Creation Modal */}
      <Dialog open={payoutModal} onOpenChange={(open) => {
        setPayoutModal(open)
        if (!open) {
          setPayoutError(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("createPayout")}</DialogTitle>
            <DialogDescription>{t("createNewPayoutTransaction")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {payoutError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-2 text-red-600 dark:text-red-400">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("errorTitle")}</p>
                    <div className="text-xs mt-2 whitespace-pre-wrap break-words bg-red-100 dark:bg-red-900/30 p-2 rounded border">
                      {payoutError}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t("operator")}</label>
                <Select
                  value={payoutForm.operator_code}
                  onValueChange={(value) => setPayoutForm(prev => ({ ...prev, operator_code: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectOperator")} />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.length > 0 ? (
                      operators.map((operator) => (
                        <SelectItem key={operator.uid} value={operator.operator_code}>
                          {operator.operator_name}
                        </SelectItem>
                      ))
                    ) : (
                      OPERATOR_OPTIONS.map((operator) => (
                        <SelectItem key={operator.value} value={operator.value}>
                          {operator.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t("amount")}</label>
                <Input
                  type="number"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder={t("enterAmount")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("phone")}</label>
                <Input
                  value={payoutForm.phone}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t("enterPhoneNumber")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("beneficiaryFirstName")}</label>
                <Input
                  value={payoutForm.beneficiary_first_name}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, beneficiary_first_name: e.target.value }))}
                  placeholder={t("enterFirstName")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("beneficiaryLastName")}</label>
                <Input
                  value={payoutForm.beneficiary_last_name}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, beneficiary_last_name: e.target.value }))}
                  placeholder={t("enterLastName")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("description")}</label>
                <Input
                  value={payoutForm.description}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t("enterDescription")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("clientReference")}</label>
                <Input
                  value={payoutForm.client_reference}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, client_reference: e.target.value }))}
                  placeholder={t("enterClientReference")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("beneficiaryName")}</label>
                <Input
                  value={payoutForm.beneficiary_name}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, beneficiary_name: e.target.value }))}
                  placeholder={t("enterBeneficiaryName")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("beneficiaryAccountNumber")}</label>
                <Input
                  value={payoutForm.beneficiary_account_number}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, beneficiary_account_number: e.target.value }))}
                  placeholder={t("enterAccountNumber")}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">{t("beneficiaryEmail")}</label>
                <Input
                  type="email"
                  value={payoutForm.beneficiary_email}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, beneficiary_email: e.target.value }))}
                  placeholder={t("enterEmailAddress")}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setPayoutModal(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={createPayout}>
                {t("createPayout")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
