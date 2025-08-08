"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { useLanguage } from "@/contexts/language-context"

// Mock data with NO yellow colors
const revenueData = [
  { date: "Jan 1", amount: 12000 },
  { date: "Jan 5", amount: 15000 },
  { date: "Jan 10", amount: 18000 },
  { date: "Jan 15", amount: 22000 },
  { date: "Jan 20", amount: 19000 },
  { date: "Jan 25", amount: 25000 },
  { date: "Jan 30", amount: 28000 },
]

const paymentMethodData = [
  { name: "Mobile Money", value: 45, color: "#dc2626" },
  { name: "Credit Card", value: 35, color: "#10b981" },
  { name: "Bank Account", value: 20, color: "#8b5cf6" },
]

const peakHoursData = [
  { hour: "6AM", transactions: 12 },
  { hour: "9AM", transactions: 45 },
  { hour: "12PM", transactions: 78 },
  { hour: "3PM", transactions: 65 },
  { hour: "6PM", transactions: 89 },
  { hour: "9PM", transactions: 34 },
]

export function DashboardContent() {
  const [showBalances, setShowBalances] = useState(false)
  const { t } = useLanguage()

  const formatCurrency = (amount: number) => {
    return showBalances ? `${amount.toLocaleString()} FCFA` : "••••••"
  }

  const customerLocationData = [
    { country: t("benin"), percentage: 45 },
    { country: t("togo"), percentage: 25 },
    { country: t("burkinaFaso"), percentage: 15 },
    { country: t("niger"), percentage: 10 },
    { country: t("others"), percentage: 5 },
  ]

  const bankData = [
    { bank: "Ecobank", fees: 2500, transactions: 145 },
    { bank: "UBA", fees: 1800, transactions: 98 },
    { bank: "BOA", fees: 1200, transactions: 67 },
    { bank: "Orabank", fees: 900, transactions: 45 },
  ]

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

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-crimson-600 rounded-2xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-4">
                {t("totalRevenue")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{formatCurrency(2847650)}</div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 rounded-full">+12.5%</Badge>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t("fromLastMonth")}</span>
              </div>
            </CardContent>
          </Card>

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
              <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{formatCurrency(156780)}</div>
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
              <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{formatCurrency(89450)}</div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 rounded-full">-2.1%</Badge>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t("fromYesterday")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <Card className="col-span-1 lg:col-span-2 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-neutral-900 dark:text-white">
                    {t("paymentsReceived")}
                  </CardTitle>
                  <CardDescription className="text-neutral-600 dark:text-neutral-400 mt-1">
                    {t("paymentTrends")}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-crimson-600 rounded-full"></div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Revenue</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    formatter={(value) => [`${value} FCFA`, "Amount"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #f1f5f9",
                      borderRadius: "16px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#dc2626" strokeWidth={3} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white">{t("whenPaidMost")}</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                {t("peakTransactionHours")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #f1f5f9",
                      borderRadius: "16px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="transactions" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Locations */}
          <Card className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white">{t("whereCustomers")}</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                {t("customerDistribution")}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bank Fees */}
          <Card className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white">{t("whichBanks")}</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">{t("bankFees")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bankData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-neutral-800/50 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl shadow-sm">
                        <Building className="h-5 w-5 text-crimson-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{item.bank}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {item.transactions} {t("transactions")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-900 dark:text-white">{item.fees} FCFA</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("feesPaid")}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                      </div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {item.name === "Mobile Money" && t("mobileMoneyMethod")}
                        {item.name === "Credit Card" && t("creditCardMethod")}
                        {item.name === "Bank Account" && t("bankAccountMethod")}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}