"use client"

import { useState } from "react"
import Header from "@/components/header"
import HealthDashboard from "@/components/health-dashboard"
import MealTracker from "@/components/meal-tracker"
import AICoach from "@/components/ai-coach"
import AuthModal from "@/components/auth-modal"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(true)
  const [activeTab, setActiveTab] = useState<"dashboard" | "meals" | "coach">("dashboard")

  const handleLogin = (email: string, password: string) => {
    console.log("[v0] User logged in:", email)
    setIsAuthenticated(true)
    setShowAuthModal(false)
  }

  if (!isAuthenticated) {
    return <AuthModal onLogin={handleLogin} />
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      <Header />

      <div
        style={{
          borderBottom: "1px solid var(--card-border)",
          position: "sticky",
          top: "64px",
          backgroundColor: "var(--card-bg)",
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem" }}>
          <div style={{ display: "flex", gap: "2rem" }}>
            <button
              onClick={() => setActiveTab("dashboard")}
              style={{
                padding: "1rem 0.5rem",
                fontWeight: 500,
                fontSize: "0.875rem",
                borderBottom: activeTab === "dashboard" ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === "dashboard" ? "var(--accent)" : "var(--muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "all 200ms ease-in-out",
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("meals")}
              style={{
                padding: "1rem 0.5rem",
                fontWeight: 500,
                fontSize: "0.875rem",
                borderBottom: activeTab === "meals" ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === "meals" ? "var(--accent)" : "var(--muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "all 200ms ease-in-out",
              }}
            >
              Meal Tracker
            </button>
            <button
              onClick={() => setActiveTab("coach")}
              style={{
                padding: "1rem 0.5rem",
                fontWeight: 500,
                fontSize: "0.875rem",
                borderBottom: activeTab === "coach" ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === "coach" ? "var(--accent)" : "var(--muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "all 200ms ease-in-out",
              }}
            >
              AI Coach
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
        {activeTab === "dashboard" && <HealthDashboard />}
        {activeTab === "meals" && <MealTracker />}
        {activeTab === "coach" && <AICoach />}
      </div>
    </main>
  )
}
