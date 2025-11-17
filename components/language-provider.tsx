"use client"

import { useEffect } from 'react'
import { useLanguage } from '@/hooks/use-language'
import { autoTranslateDOM } from '@/lib/global-translate'

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage()
  
  useEffect(() => {
    // Apply translation whenever language changes
    const timer = setTimeout(() => {
      autoTranslateDOM(language)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [language])
  
  // Also apply on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      autoTranslateDOM(language)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  return <>{children}</>
}