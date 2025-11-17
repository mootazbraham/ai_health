"use client"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import UserDropdown from "./user-dropdown"

export default function Header() {
  const { isAuthenticated, logout } = useAuth()
  const { language, changeLanguage, t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/20 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <img src="/vitalis-logo.svg" alt="Vitalis" className="w-12 h-12 rounded-xl shadow-lg p-1 bg-white" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('Vitalis')}</h1>
                <p className="text-xs text-gray-500 font-medium">{t('Your Personal Health Companion')}</p>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white"
              value={language}
              onChange={(e) => changeLanguage(e.target.value as any)}
              aria-label="Language"
            >
              <option value="en">🇬🇧 EN</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="ar">🇲🇦 AR</option>
            </select>
            {isAuthenticated && <UserDropdown />}
          </div>
        </div>
      </div>
    </header>
  )
}
