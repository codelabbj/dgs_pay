"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { storeAuthData } from "@/utils/auth"
import { useTheme } from "next-themes"

export default function Login() {
  const { theme, setTheme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const router = useRouter()
  const { t } = useLanguage()

  const [apiError, setApiError] = useState("")
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setApiError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/v1/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })
      
      const data = await res.json()
      if (res.ok) {
        console.log('Login successful, storing auth data:', data)
        // Store authentication data using the utility function
        storeAuthData(data)
        
        console.log('Auth data stored, checking localStorage:', {
          access: localStorage.getItem('access'),
          refresh: localStorage.getItem('refresh'),
          exp: localStorage.getItem('exp'),
          user: localStorage.getItem('user')
        })
        
        // Add a small delay to ensure auth data is processed
        console.log('Waiting 500ms before redirect...')
        setTimeout(() => {
          console.log('Redirecting to dashboard using router...')
          router.push("/")
        }, 500)
      } else {
        const inactive = data && data.detail && typeof data.detail === "object" && data.detail.is_active === false
        if (inactive) {
          router.push(`/register?activate=1&email=${encodeURIComponent(formData.email)}`)
          setIsLoading(false)
          return
        }
        setApiError(data.detail || data.message || "Login failed.")
      }
    } catch (err) {
      setApiError("Login failed.")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-crimson-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-slate-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Language switcher */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-5">
          {/* <div className="inline-flex items-center justify-center w-25 h-25 bg-crimson-600 rounded-3xl mb-6 shadow-2xl shadow-crimson-600/25 relative"> */}
          <div className="inline-flex items-center justify-center w-25 h-25 relative">
            {/* <Crown className="w-10 h-10 text-black dark:text-white" /> */}
            <img 
                src={theme === "dark" ? "/logo_dark1.png" : "/logo_light11.png"} 
                alt="Logo" 
                className=" h-14 w-auto"
              />
          </div>
          {/* <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-3">{t("welcomeBack")}</h1> */}
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">{t("signInToAccount")}</p>
        </div>

        <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-slate-100 dark:border-neutral-800 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-8 pt-8">
            <CardTitle className="text-2xl font-bold text-center text-neutral-900 dark:text-white">
              {t("signIn")}
            </CardTitle>
            <CardDescription className="text-center text-neutral-600 dark:text-neutral-400">
              {t("enterCredentials")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {apiError && (
              <div className="mb-4 text-center text-sm text-red-600 dark:text-red-400">{apiError}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-12 h-14 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {t("password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("password")}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-12 pr-12 h-14 bg-slate-50/50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-crimson-600 focus:border-transparent text-base"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-neutral-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
                    className="data-[state=checked]:bg-crimson-600 data-[state=checked]:border-crimson-600"
                  />
                  <Label htmlFor="remember" className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t("rememberMe")}
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-crimson-600 hover:text-crimson-700 font-semibold">
                  {t("forgotPassword")}
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-crimson-600 hover:bg-crimson-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center text-black dark:text-white space-x-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t("signingIn")}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-black dark:text-white space-x-3">
                    <span>{t("signIn")}</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t("dontHaveAccount")} {" "}
                <Link href="/register" className="text-crimson-600 hover:text-crimson-700 font-semibold">
                  {t("signUp")}
                </Link>
              </p>
              
              {/* Debug button for testing */}
              {/* <button
                type="button"
                onClick={() => {
                  console.log('Manual localStorage check:', {
                    access: localStorage.getItem('access'),
                    refresh: localStorage.getItem('refresh'),
                    exp: localStorage.getItem('exp'),
                    user: localStorage.getItem('user')
                  })
                }}
                className="mt-4 text-xs text-gray-500 hover:text-gray-700"
              >
                Debug: Check localStorage
              </button> */}
              
              {/* Test authentication button */}
              {/* <button
                type="button"
                onClick={() => {
                  const accessToken = localStorage.getItem('access')
                  const refreshToken = localStorage.getItem('refresh')
                  const hasTokens = !!(accessToken && refreshToken)
                  console.log('Manual auth test:', { hasTokens, accessToken: !!accessToken, refreshToken: !!refreshToken })
                  
                  if (hasTokens) {
                    console.log('✅ Authentication check passed, should be able to access dashboard')
                  } else {
                    console.log('❌ Authentication check failed, no tokens found')
                  }
                }}
                className="mt-2 text-xs text-blue-500 hover:text-blue-700"
              >
                Test Authentication
              </button> */}
            </div>
          </CardContent>
        </Card>
        {/* Footer */}
        <div className="text-center mt-8 text-sm text-neutral-500">
          {/* <p>© 2024 pay. All rights reserved.</p> */}
        </div>
      </div>
    </div>
  )
}
