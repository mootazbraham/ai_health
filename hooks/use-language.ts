import { useState, useEffect } from 'react'
import { translations, Language, TranslationKey } from '@/lib/translations-full'
import { autoTranslateDOM } from '@/lib/global-translate'

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved && translations[saved]) {
      setLanguage(saved)
      // Apply translation on page load
      setTimeout(() => {
        autoTranslateDOM(saved)
      }, 500)
    }
  }, [])

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
    
    // Apply global translation immediately
    setTimeout(() => {
      autoTranslateDOM(lang)
    }, 100)
    
    // Auto-refresh when switching languages for proper layout
    setTimeout(() => {
      window.location.reload()
    }, 200)
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key
  }

  return { language, changeLanguage, t }
}