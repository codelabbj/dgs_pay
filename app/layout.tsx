import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthGuard } from "@/components/auth-guard"
import { LanguageProvider } from "@/contexts/language-context"
import { UserProfileProvider } from "@/contexts/user-profile-context"
import { UserConfigProvider } from "@/contexts/user-config-context"
import { DynamicLayout } from "@/components/dynamic-layout"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  title: "DGS Pay — Espace marchand",
  description: "Tableau de bord marchand : transactions, solde, retraits et API.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <UserProfileProvider>
              <UserConfigProvider>
                <DynamicLayout>
                  <AuthGuard>{children}</AuthGuard>
                </DynamicLayout>
              </UserConfigProvider>
            </UserProfileProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
