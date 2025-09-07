"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, Sparkles, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"email" | "otp" | "reset">("email")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const { t } = useLanguage()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`${baseUrl}/v1/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStep("otp")
        setSuccess(t("otpSent"))
      } else {
        const data = await res.json()
        setError(data.details || data.message || t("failedToSendOtp"))
      }
    } catch (err) {
      setError(t("failedToSendOtp"))
    }
    setIsLoading(false)
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`${baseUrl}/v1/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSuccess(t("otpResent"))
      } else {
        const data = await res.json()
        setError(data.details || data.message || t("failedToResendOtp"))
      }
    } catch (err) {
      setError(t("failedToResendOtp"))
    }
    setIsLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!otp) {
      setError(t("pleaseEnterOtp"))
      return
    }
    setStep("reset")
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    if (!newPassword || !confirmPassword) {
      setError(t("pleaseFillAllPassword"))
      setIsLoading(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch"))
      setIsLoading(false)
      return
    }
    try {
      const res = await fetch(`${baseUrl}/v1/api/resetpassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          new_password: newPassword,
          confirm_new_password: confirmPassword,
        }),
      })
      if (res.ok) {
        setSuccess(t("resetPasswordSuccess"))
        setTimeout(() => router.push("/login"), 2000)
      } else {
        const data = await res.json()
        setError(data.details || data.message || t("failedToResetPassword"))
      }
    } catch (err) {
      setError(t("failedToResetPassword"))
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Language switcher (optional, if needed) */}
      {/* <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div> */}

      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-crimson-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div> */}
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {t("resetPasswordTitle")}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            {step === "email"
              ? t("enterEmailToReset")
              : step === "otp"
              ? t("enterOtp")
              : t("setNewPassword")}
          </p>
        </div>

        <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-neutral-900 dark:text-white">
              {step === "email"
                ? t("forgotPasswordTitle")
                : step === "otp"
                ? t("verifyOtp")
                : t("setNewPassword")}
            </CardTitle>
            <CardDescription className="text-center text-neutral-600 dark:text-neutral-400">
              {step === "email"
                ? t("enterEmailToReset")
                : step === "otp"
                ? t("checkEmailForOtp")
                : t("enterNewPassword") + " / " + t("confirmNewPassword")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 text-center text-sm text-red-600 dark:text-red-400">{error}</div>}
            {success && <div className="mb-4 text-center text-sm text-green-600 dark:text-green-400">{success}</div>}
            {step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {t("emailAddress")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent text-base"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 bg-crimson-600 hover:bg-crimson-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t("sending")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-black dark:text-white space-x-3">
                      <Send className="w-5 h-5" />
                      <span>{t("sendOtp")}</span>
                    </div>
                  )}
                </Button>
              </form>
            )}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    OTP Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="otp"
                      type="text"
                      placeholder={t("enterOtp")}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="h-14 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent text-base pl-4"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 bg-crimson-600 hover:bg-crimson-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t("verifying")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-black dark:text-white space-x-3">
                      <span>{t("verifyOtp")}</span>
                    </div>
                  )}
                </Button>
                <div className="text-center">
                  <Button type="button" variant="link" className="text-crimson-600 hover:text-crimson-700" onClick={handleResendOtp} disabled={isLoading}>
                    {t("resendOtp")}
                  </Button>
                </div>
              </form>
            )}
            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {t("enterNewPassword")}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder={t("enterNewPassword")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-14 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent text-base pl-4"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {t("confirmNewPassword")}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t("confirmNewPassword")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent text-base pl-4"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 bg-crimson-600 hover:bg-crimson-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t("resetting")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-black dark:text-white space-x-3">
                      <span>{t("resetPasswordTitle")}</span>
                    </div>
                  )}
                </Button>
              </form>
            )}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 text-sm text-crimson-600 hover:text-crimson-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("backToSignIn")}</span>
              </Link>
            </div>
          </CardContent>
        </Card>
        <div className="text-center mt-8 text-sm text-neutral-500">
          {/* <p>© 2024 pay. All rights reserved.</p> */}
        </div>
      </div>
    </div>
  )
}
