"use client"

import { useState, useEffect } from "react"

interface ConsentPreferences {
  dataCollection: boolean
  aiAnalysis: boolean
  healthTracking: boolean
  analytics: boolean
}

export default function PrivacyConsent() {
  const [showModal, setShowModal] = useState(false)
  const [consent, setConsent] = useState<ConsentPreferences>({
    dataCollection: false,
    aiAnalysis: false,
    healthTracking: false,
    analytics: false,
  })

  useEffect(() => {
    const savedConsent = localStorage.getItem("privacy-consent")
    if (!savedConsent) {
      setShowModal(true)
    } else {
      setConsent(JSON.parse(savedConsent))
    }
  }, [])

  const handleConsent = (accepted: boolean) => {
    const consentData: ConsentPreferences = accepted
      ? {
          dataCollection: true,
          aiAnalysis: true,
          healthTracking: true,
          analytics: true,
        }
      : {
          dataCollection: false,
          aiAnalysis: false,
          healthTracking: false,
          analytics: false,
        }

    setConsent(consentData)
    localStorage.setItem("privacy-consent", JSON.stringify(consentData))
    localStorage.setItem("consent-timestamp", new Date().toISOString())
    setShowModal(false)
  }

  const updatePreference = (key: keyof ConsentPreferences, value: boolean) => {
    const updated = { ...consent, [key]: value }
    setConsent(updated)
    localStorage.setItem("privacy-consent", JSON.stringify(updated))
  }

  if (!showModal) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="glass rounded-3xl p-8 max-w-2xl w-full animate-scale-in shadow-2xl border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Privacy & Data Consent</h2>
        </div>

        <p className="text-gray-600 mb-8 leading-relaxed">
          We respect your privacy. Please review and consent to how we collect and use your data to provide
          personalized health insights.
        </p>

        <div className="space-y-4 mb-8">
          <label className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border-2 border-transparent hover:border-blue-200">
            <input
              type="checkbox"
              checked={consent.dataCollection}
              onChange={(e) => updatePreference("dataCollection", e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <strong className="text-gray-900 block mb-1">Data Collection</strong>
              <p className="text-sm text-gray-600">Allow us to collect and store your health data (meals, metrics, etc.)</p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border-2 border-transparent hover:border-purple-200">
            <input
              type="checkbox"
              checked={consent.aiAnalysis}
              onChange={(e) => updatePreference("aiAnalysis", e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex-1">
              <strong className="text-gray-900 block mb-1">AI Analysis</strong>
              <p className="text-sm text-gray-600">Allow AI to analyze your meal images and provide health recommendations</p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border-2 border-transparent hover:border-green-200">
            <input
              type="checkbox"
              checked={consent.healthTracking}
              onChange={(e) => updatePreference("healthTracking", e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1">
              <strong className="text-gray-900 block mb-1">Health Tracking</strong>
              <p className="text-sm text-gray-600">Allow tracking of your health metrics (steps, sleep, calories, etc.)</p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border-2 border-transparent hover:border-orange-200">
            <input
              type="checkbox"
              checked={consent.analytics}
              onChange={(e) => updatePreference("analytics", e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <div className="flex-1">
              <strong className="text-gray-900 block mb-1">Analytics</strong>
              <p className="text-sm text-gray-600">Allow anonymous usage analytics to improve the app</p>
            </div>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handleConsent(true)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 btn-hover-lift"
          >
            Accept All
          </button>
          <button
            onClick={() => handleConsent(false)}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all duration-200"
          >
            Customize
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6 text-center">
          You can change these preferences anytime in Settings. Read our{" "}
          <a href="/privacy" className="text-blue-600 font-semibold hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
