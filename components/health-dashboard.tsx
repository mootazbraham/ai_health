"use client"

import { useState } from "react"
import MetricCard from "./metric-card"
import WellnessChart from "./wellness-chart"

interface HealthMetrics {
  steps: number
  calories: number
  water: number
  sleep: number
  heartRate: number
  bloodPressure: string
}

export default function HealthDashboard() {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    steps: 7234,
    calories: 1850,
    water: 6,
    sleep: 7.5,
    heartRate: 72,
    bloodPressure: "120/80",
  })

  const [insights, setInsights] = useState<string[]>([
    "Great job! You're 72% towards your daily step goal.",
    "Your sleep pattern is excellent. Keep it up!",
    "Remember to drink more water. You're at 60% of daily goal.",
  ])

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-accent-light to-success-light rounded-xl p-6 border border-accent">
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back, Sarah!</h2>
        <p className="text-muted">Here's your health overview for today</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Steps" value="7,234" target="10,000" unit="steps" percentage={72} icon="👟" status="good" />
        <MetricCard label="Calories" value="1,850" target="2,200" unit="kcal" percentage={84} icon="🔥" status="good" />
        <MetricCard
          label="Water Intake"
          value="6"
          target="8"
          unit="glasses"
          percentage={75}
          icon="💧"
          status="warning"
        />
        <MetricCard label="Sleep" value="7.5" target="8" unit="hours" percentage={94} icon="😴" status="good" />
        <MetricCard
          label="Heart Rate"
          value={metrics.heartRate.toString()}
          target="60-100"
          unit="bpm"
          percentage={72}
          icon="❤️"
          status="good"
        />
        <MetricCard
          label="Blood Pressure"
          value={metrics.bloodPressure}
          target="120/80"
          unit="mmHg"
          percentage={100}
          icon="🩺"
          status="good"
        />
      </div>

      {/* Wellness Insights */}
      <div className="bg-card-bg rounded-xl border border-card-border p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Today's Insights</h3>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-muted-light rounded-lg">
              <span className="text-lg">💡</span>
              <p className="text-sm text-foreground">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wellness Trend Chart */}
      <WellnessChart />
    </div>
  )
}
