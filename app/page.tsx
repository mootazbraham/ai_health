"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import HealthDashboard from "@/components/health-dashboard"
import MealTracker from "@/components/meal-tracker"
import AICoach from "@/components/ai-coach"
import AuthModal from "@/components/auth-modal"
import PrivacyConsent from "@/components/privacy-consent"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<"dashboard" | "meals" | "coach">("dashboard")

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" suppressHydrationWarning></div>
      </div>
    )
  }

  // Show auth modal if not authenticated
  if (!isAuthenticated) {
    return <AuthModal />
  }

  return (
    <main className="w-full min-h-screen flex flex-col min-w-0">
      <PrivacyConsent />
      <Header />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-[73px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`relative px-6 py-4 font-semibold text-sm transition-all duration-300 ${
                activeTab === "dashboard"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
              {activeTab === "dashboard" && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("meals")}
              className={`relative px-6 py-4 font-semibold text-sm transition-all duration-300 ${
                activeTab === "meals"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Meal Tracker
              {activeTab === "meals" && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("coach")}
              className={`relative px-6 py-4 font-semibold text-sm transition-all duration-300 ${
                activeTab === "coach"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              AI Coach
              {activeTab === "coach" && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-w-0">
          <div className="animate-fade-in w-full min-w-0">
            {activeTab === "dashboard" && <HealthDashboard />}
            {activeTab === "meals" && <MealTracker />}
            {activeTab === "coach" && <AICoach />}
          </div>
        </div>
      </div>
    </main>
  )
}
