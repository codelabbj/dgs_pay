"use client"

import { useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"

interface DynamicLayoutProps {
  children: React.ReactNode
}

export function DynamicLayout({ children }: DynamicLayoutProps) {
  const { language } = useLanguage()

  useEffect(() => {
    // Set the HTML lang attribute based on the selected language
    document.documentElement.lang = language
  }, [language])

  return <>{children}</>
}
