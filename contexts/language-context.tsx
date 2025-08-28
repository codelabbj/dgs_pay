"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { translations, type Language, type TranslationKey } from "@/lib/translations"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr") // Changed default to French

  useEffect(() => {
    // Check for saved language preference first
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "fr")) {
      setLanguage(savedLanguage)
    } else {
      // If no saved preference, try to detect browser language
      const browserLang = navigator.language.toLowerCase()
      const isFrenchSpeaking = browserLang.startsWith('fr') || 
                              browserLang.startsWith('ca') || // Canadian French
                              browserLang.startsWith('be') || // Belgian French
                              browserLang.startsWith('ch') || // Swiss French
                              browserLang.startsWith('lu') || // Luxembourg French
                              browserLang.startsWith('mc')    // Monaco French
      
      if (isFrenchSpeaking) {
        setLanguage("fr")
        localStorage.setItem("language", "fr")
      }
      // For all other languages, French remains the default
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.fr[key] || key // Changed fallback to French
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
