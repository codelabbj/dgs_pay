"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { storeAuthData } from "@/utils/auth"

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false })
  const router = useRouter()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setApiError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/v1/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      })
      const data = await res.json()

      if (res.ok) {
        storeAuthData(data)
        router.push("/")
        return
      }

      // Compte non activé : on envoie l'utilisateur sur l'activation
      const inactive = data?.detail && typeof data.detail === "object" && data.detail.is_active === false
      if (inactive) {
        router.push(`/register?activate=1&email=${encodeURIComponent(formData.email)}`)
        return
      }
      setApiError(typeof data.detail === "string" ? data.detail : data.message || "Login failed.")
    } catch {
      setApiError("Login failed.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Décor discret */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo_light11.png" alt="DGS Pay" className="h-12 w-auto dark:hidden" />
          <img src="/logo_dark1.png" alt="DGS Pay" className="hidden h-12 w-auto dark:block" />
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("signInToAccount")}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 px-5 pb-4 pt-6 sm:px-8 sm:pt-8">
            <CardTitle className="text-center text-2xl font-bold">{t("signIn")}</CardTitle>
            <CardDescription className="text-center">{t("enterCredentials")}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-6 sm:px-8 sm:pb-8">
            {apiError && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
              >
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("emailAddress")}
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("password")}
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder={t("password")}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 pl-10 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                    {t("rememberMe")}
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  {t("forgotPassword")}
                </Link>
              </div>

              <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("signingIn")}
                  </>
                ) : (
                  <>
                    {t("signIn")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("dontHaveAccount")}{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                {t("signUp")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
