"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    entrepriseName: "",
    agreeToTerms: false,
  })
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState("register") // 'register' or 'otp'
  const [apiMessage, setApiMessage] = useState("")
  const [apiError, setApiError] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const toNullIfEmpty = (value: string | null | undefined) => {
    if (value == null) return null
    return value.trim() === "" ? null : value
  }

  const extractApiMessage = (data: any): string => {
    try {
      if (!data) return "An error occurred."
      if (typeof data === "string") return data
      if (typeof data.message === "string" && data.message.trim()) return data.message
      if (data.detail) {
        if (typeof data.detail === "string" && data.detail.trim()) return data.detail
        if (Array.isArray(data.detail)) {
          const msgs = data.detail
            .map((d: any) => {
              if (!d) return null
              if (typeof d === "string") return d
              if (typeof d.msg === "string") return d.msg
              if (typeof d.message === "string") return d.message
              return null
            })
            .filter(Boolean)
          if (msgs.length) return msgs.join(", ")
        }
      }
    } catch {}
    return "An error occurred."
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setApiMessage("")
    if (step === "register") {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/v1/api//register-customer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: toNullIfEmpty(formData.email),
            phone: toNullIfEmpty(formData.phone),
            first_name: toNullIfEmpty(formData.firstName),
            last_name: toNullIfEmpty(formData.lastName),
            country: toNullIfEmpty(formData.country),
            password: toNullIfEmpty(formData.password),
            confirm_password: toNullIfEmpty(formData.confirmPassword),
            entreprise_name: toNullIfEmpty(formData.entrepriseName),
          }),
        })
        const data = await res.json()
        if (res.ok) {
          setApiMessage(data.message || "")
          setApiError(false)
          setStep("otp")
        } else {
          setApiMessage(extractApiMessage(data))
          setApiError(true)
        }
      } catch (err) {
        setApiMessage("Registration failed.")
        setApiError(true)
      }
      setIsLoading(false)
    } else if (step === "otp") {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/v1/api/activate-account`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            otp,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          setApiMessage(data.message || "")
          setApiError(false)
          // Redirect to login after activation
          setTimeout(() => router.push("/login"), 2000)
        } else {
          setApiMessage(extractApiMessage(data) || "Activation failed.")
          setApiError(true)
        }
      } catch (err) {
        setApiMessage("Activation failed.")
        setApiError(true)
      }
      setIsLoading(false)
    }
  }

  const countries = [
    { value: "bj", label: t("benin") },
    { value: "tg", label: t("togo") },
    { value: "bf", label: t("burkinaFaso") },
    { value: "ne", label: t("niger") },
    { value: "ci", label: t("coteDivoire") },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      {/* Language switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-lg">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t("joinpay")}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">{t("createMerchantAccount")}</p>
        </div>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-slate-900 dark:text-white">
              {t("createAccount")}
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              {t("fillDetails")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiMessage && (
              <div
                className={`mb-4 text-center text-sm ${
                  apiError ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {apiMessage}
              </div>
            )}
            {step === "register" ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("firstName")}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("lastName")}
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="entrepriseName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("entrepriseName") || "Entreprise Name"}
                  </Label>
                  <Input
                    id="entrepriseName"
                    type="text"
                    placeholder="Mon Entreprise"
                    value={formData.entrepriseName}
                    onChange={(e) => setFormData({ ...formData, entrepriseName: e.target.value })}
                    className="h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("emailAddress")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("country")}
                    </Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                      <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={t("selectCountry")} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("phoneNumber")}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="12345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("password")}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("password")}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10 h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("confirmPassword")}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("confirmPassword")}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 pr-10 h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("agreeToTerms")} {" "}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                      {t("termsOfService")}
                    </Link> {" "}
                    {t("and")} {" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                      {t("privacyPolicy")}
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-crimson-600 hover:bg-crimson-700 text-black dark:text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl text-base"
                  disabled={isLoading || !formData.agreeToTerms}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t("creatingAccount")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>{t("createAccount")}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("enterOtp") || "Enter OTP"}
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 bg-crimson-600 hover:bg-crimson-700 text-black dark:text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl text-base"
                  disabled={isLoading || !otp}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t("verifyOtp") || "Verifying OTP..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>{t("verifyOtp") || "Verify OTP"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            )}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t("alreadyHaveAccount")} {" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  {t("signIn")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          {/* <p>© 2025 pay. All rights reserved.</p> */}
        </div>
      </div>
    </div>
  )
}
