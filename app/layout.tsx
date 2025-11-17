import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthGuard } from "@/components/auth-guard"
import { LanguageProvider } from "@/contexts/language-context"
import { UserProfileProvider } from "@/contexts/user-profile-context"
import { UserConfigProvider } from "@/contexts/user-config-context"
import { DynamicLayout } from "@/components/dynamic-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DGS Merchant Dashboard",
  description: "Merchant dashboard for payment management",
    // generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <LanguageProvider>
              <UserProfileProvider>
                <UserConfigProvider>
                  <DynamicLayout>
                    <AuthGuard>
                      {children}
                    </AuthGuard>
                  </DynamicLayout>
                </UserConfigProvider>
              </UserProfileProvider>
            </LanguageProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
