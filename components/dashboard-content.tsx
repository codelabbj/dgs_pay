"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { smartFetch } from "@/utils/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import {
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  MapPin,
  CreditCard,
  Smartphone,
  Building,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts"

export function DashboardContent() {
  // Temporarily disable useAuth to test
  // const { isLoading, requireAuth, checkAuth } = useAuth()
  const [showBalances, setShowBalances] = useState(false)
  const { t } = useLanguage()

  // Temporarily disable authentication re-check
  // useEffect(() => {
  //   checkAuth()
  // }, [checkAuth])

  // Temporarily bypass authentication requirement
  // if (!requireAuth()) {
  //   return null
  // }

  // Temporarily disable loading check
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-slate-50/30 dark:bg-neutral-950 flex items-center justify-center">
  //       <div className="flex items-center space-x-2">
  //         <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
  //         <span className="text-lg font-medium text-blue-600">Loading dashboard...</span>
  //       </div>
  //     </div>
  //   )
  // }

  // State for API data
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  useEffect(() => {
    // Add a delay to ensure authentication is fully established
    const timer = setTimeout(() => {
      console.log('Dashboard content: Starting to fetch stats after delay')
      fetchStats()
    }, 1000) // Wait 1 second for auth to be fully established
    
    return () => clearTimeout(timer)
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await smartFetch(`${baseUrl}/prod/v1/api/statistic`)
      
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else {
        setError(`Failed to fetch stats: ${res.status}`)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return showBalances ? "0 FCFA" : "••••••"
    return showBalances ? `${amount.toLocaleString()} FCFA` : "••••••"
  }

  // Use API data for customer locations if available, otherwise show empty state
  const customerLocationData = stats?.country_payment
    ? Object.entries(stats.country_payment).map(([country, percentage]) => ({
        country: t(country as any) || country, // Fallback to original country name if translation not found
        percentage,
      }))
    : []

  // Use API data for payment methods if available, otherwise show empty state
  const paymentMethodData = stats?.payment_methode
    ? Object.entries(stats.payment_methode).map(([method, data]: [string, any]) => ({
        name: method,
        value: data.percentage || 0,
        color: method === "Mobile Money" ? "#dc2626" : method === "Credit Card" ? "#10b981" : "#8b5cf6",
      }))
    : []

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="space-y-8 p-6 pb-20">
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-600 dark:text-neutral-400">Loading dashboard data...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-8 p-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md z-10 py-4 -mx-6 px-6 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">{t("dashboard")}</h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg">{t("welcomeBack2")}</p>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="rounded-2xl border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800 bg-transparent"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showBalances ? t("hideBalances") : t("showBalances")}
          </Button>
        </div>

        {/* Debug Section */}
        {/* <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info</h3>
          <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            <div>Access Token: {localStorage.getItem('access') ? '✅ Present' : '❌ Missing'}</div>
            <div>Refresh Token: {localStorage.getItem('refresh') ? '✅ Present' : '❌ Missing'}</div>
            <div>Expiration: {localStorage.getItem('exp') || '❌ Missing'}</div>
            <div>User Data: {localStorage.getItem('user') ? '✅ Present' : '❌ Missing'}</div>
            <button
              onClick={() => {
                console.log('Dashboard localStorage check:', {
                  access: localStorage.getItem('access'),
                  refresh: localStorage.getItem('refresh'),
                  exp: localStorage.getItem('exp'),
                  user: localStorage.getItem('user')
                })
              }}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Log to Console
            </button>
            <button
              onClick={() => {
                const accessToken = localStorage.getItem('access')
                const refreshToken = localStorage.getItem('refresh')
                const hasTokens = !!(accessToken && refreshToken)
                console.log('Manual auth check from dashboard:', { hasTokens, accessToken: !!accessToken, refreshToken: !!refreshToken })
                
                if (hasTokens) {
                  console.log('✅ Dashboard auth check passed')
                } else {
                  console.log('❌ Dashboard auth check failed')
                }
              }}
              className="text-green-600 hover:text-green-800 underline ml-2"
            >
              Check Auth
            </button>
          </div>
        </div> */}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-4">
                {t("operationBalance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                {formatCurrency(stats?.all_operation_amount)}
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 rounded-full">+8.2%</Badge>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t("fromLastWeek")}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-600 rounded-2xl shadow-lg">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <ArrowDownRight className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
              </div>
              <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-4">
                {t("availableBalance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                {formatCurrency(stats?.availavailable_fund)}
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 rounded-full">-2.1%</Badge>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t("fromYesterday")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Locations */}
          <Card className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white">{t("whereCustomers")}</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                {t("customerDistribution")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customerLocationData.length > 0 ? (
                <div className="space-y-6">
                  {customerLocationData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-50 dark:bg-neutral-800 rounded-xl">
                          <MapPin className="h-4 w-4 text-crimson-600" />
                        </div>
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.country}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-slate-100 dark:bg-neutral-800 rounded-full h-2">
                          <div
                            className="bg-crimson-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 w-8">
                          {typeof item.percentage === "number" ? item.percentage : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  {t("noDataAvailable")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white">{t("mostUsedPayment")}</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                {t("paymentMethodDistribution")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethodData.length > 0 ? (
                <>
                  <div className="flex items-center justify-center mb-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `${value}%`}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #f1f5f9",
                            borderRadius: "16px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {paymentMethodData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-neutral-800/50 rounded-2xl"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl shadow-sm">
                            {item.name === "Mobile Money" && <Smartphone className="h-4 w-4 text-crimson-600" />}
                            {item.name === "Credit Card" && <CreditCard className="h-4 w-4 text-crimson-600" />}
                            {item.name === "Bank Account" && <Building className="h-4 w-4 text-crimson-600" />}
                            {!["Mobile Money", "Credit Card", "Bank Account"].includes(item.name) && <CreditCard className="h-4 w-4 text-crimson-600" />}
                          </div>
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {item.name === "Mobile Money" && t("mobileMoneyMethod")}
                            {item.name === "Credit Card" && t("creditCardMethod")}
                            {item.name === "Bank Account" && t("bankAccountMethod")}
                            {!["Mobile Money", "Credit Card", "Bank Account"].includes(item.name) && item.name}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-crimson-100 text-crimson-800 hover:bg-crimson-100 rounded-full font-bold"
                        >
                          {item.value}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  {t("noDataAvailable")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}