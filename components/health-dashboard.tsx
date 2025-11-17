"use client"

import { useState, useEffect } from "react"
import MetricCard from "./metric-card"
import WellnessChart from "./wellness-chart"
import StravaSync from "./strava-sync"

import StravaMap from "./strava-map"
import HealthCalculations from "./health-calculations"
import EnergyBalanceDashboard from "./energy-balance-dashboard"
import TrainingCoach from "./training-coach"
import MealPlanner from "./meal-planner"
import WeeklyLoadAnalytics from "./weekly-load-analytics"
import AIChatCoach from "./ai-chat-coach"
import GamificationDashboard from "./gamification-dashboard"
import BodyCompositionTracker from "./body-composition-tracker"
import { useAuth } from "@/hooks/use-auth"
import { useMetrics } from "@/hooks/use-metrics"
import { useLanguage } from "@/hooks/use-language"

export default function HealthDashboard() {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const { summary, metrics, isLoading, error, refetch } = useMetrics(user?.id)
  const { t } = useLanguage()
  const [activeSection, setActiveSection] = useState('overview')
  
  // Dynamic goals - same as meal tracker
  const calorieGoal = 2000
  
  // Force refresh user data on mount
  useEffect(() => {
    if (isAuthenticated) {
      refreshUser()
    }
  }, [isAuthenticated, refreshUser])

  const [insights, setInsights] = useState<string[]>([])

  // Generate insights from real metrics
  useEffect(() => {
    if (!summary) return

    const newInsights: string[] = []
    
    if (summary.steps > 0) {
      const stepsProgress = Math.min((summary.steps / 10000) * 100, 100)
      newInsights.push(`Great job! You're ${Math.round(stepsProgress)}% towards your daily step goal.`)
    }

    if (summary.sleep > 0) {
      if (summary.sleep >= 7) {
        newInsights.push("Your sleep pattern is excellent. Keep it up!")
      } else {
        newInsights.push(`You got ${summary.sleep} hours of sleep. Aim for 7-9 hours for optimal health.`)
      }
    }

    if (summary.water > 0) {
      const waterProgress = Math.min((summary.water / 8) * 100, 100)
      if (waterProgress < 75) {
        newInsights.push(`Remember to drink more water. You're at ${Math.round(waterProgress)}% of daily goal.`)
      }
    }

    // Add Strava-specific insights
    if (summary.activities && summary.activities > 0) {
      newInsights.push(`Amazing! You completed ${summary.activities} workout${summary.activities > 1 ? 's' : ''} today! 🏆`)
    }
    
    if (summary.distance && summary.distance > 0) {
      const km = (summary.distance / 1000).toFixed(1)
      newInsights.push(`You covered ${km}km today - that's like running ${Math.round(summary.distance / 400)} laps around a track! 🏃‍♂️`)
    }
    
    if (summary.exerciseTime && summary.exerciseTime > 0) {
      newInsights.push(`You spent ${summary.exerciseTime} minutes being active. Every minute counts! ⏱️`)
    }

    setInsights(newInsights.length > 0 ? newInsights : [
      "Connect Strava and start your fitness journey to see personalized insights! 🚀",
      "Sync your activities to unlock detailed performance analytics! 📈"
    ])
  }, [summary])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error state
  if (error && !isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const sections = [
    { id: 'overview', label: t('Overview'), icon: '📊' },
    { id: 'energy', label: t('Energy Balance'), icon: '⚖️' },
    { id: 'training', label: t('Training Coach'), icon: '🏋️' },
    { id: 'meals', label: t('Meal Planner'), icon: '🍽️' },
    { id: 'load', label: t('Load Analytics'), icon: '📈' },
    { id: 'chat', label: t('AI Coach'), icon: '🤖' },
    { id: 'gamification', label: t('Achievements'), icon: '🏆' },
    { id: 'body', label: t('Body Composition'), icon: '📏' }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section Navigation */}
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <div className="flex flex-wrap gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
      </div>
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <span className="text-3xl">🏃‍♂️</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{t('Hey')} {user?.name || 'Athlete'}! 💪</h1>
                <p className="text-orange-100 text-lg">{t('Ready to crush your fitness goals today?')}</p>
                <p className="text-orange-200 text-sm mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} • {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <StravaSync onSync={refetch} />
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-yellow-300/20 rounded-full blur-2xl" />
      </div>

      {/* Fitness Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        <MetricCard
          label={t('Distance')}
          value={summary.distance ? (summary.distance / 1000).toFixed(1) : "0"}
          target="5.0"
          unit="km"
          percentage={summary.distance ? Math.min(((summary.distance / 1000) / 5) * 100, 100) : 0}
          icon="🏃"
          status={summary.distance >= 5000 ? "good" : summary.distance >= 2000 ? "warning" : "critical"}
          delay={0}
        />
        <MetricCard
          label={t('Activities')}
          value={summary.activities?.toString() || "0"}
          target="1"
          unit={t('today')}
          percentage={summary.activities ? Math.min((summary.activities / 1) * 100, 100) : 0}
          icon="🏋️"
          status={summary.activities >= 1 ? "good" : "critical"}
          delay={100}
        />
        <MetricCard
          label={t('Food Calories')}
          value={summary.mealCalories?.toLocaleString() || "0"}
          target={calorieGoal.toLocaleString()}
          unit="kcal"
          percentage={summary.mealCalories ? Math.min((summary.mealCalories / calorieGoal) * 100, 100) : 0}
          icon="🍽️"
          status={summary.mealCalories >= (calorieGoal * 0.75) ? "good" : summary.mealCalories >= (calorieGoal * 0.4) ? "warning" : "critical"}
          delay={200}
        />
        <MetricCard
          label={t('Exercise Calories')}
          value={summary.calories.toLocaleString()}
          target="500"
          unit="kcal"
          percentage={Math.min((summary.calories / 500) * 100, 100)}
          icon="🔥"
          status={summary.calories >= 400 ? "good" : summary.calories >= 200 ? "warning" : "critical"}
          delay={250}
        />
        <MetricCard
          label={t('Avg Speed')}
          value={summary.avgSpeed ? summary.avgSpeed.toFixed(1) : "0"}
          target="15"
          unit="km/h"
          percentage={summary.avgSpeed ? Math.min((summary.avgSpeed / 15) * 100, 100) : 0}
          icon="⚡"
          status={summary.avgSpeed >= 12 ? "good" : summary.avgSpeed >= 8 ? "warning" : "critical"}
          delay={300}
        />
        <MetricCard
          label={t('Exercise Time')}
          value={summary.exerciseTime?.toString() || "0"}
          target="30"
          unit="min"
          percentage={summary.exerciseTime ? Math.min((summary.exerciseTime / 30) * 100, 100) : 0}
          icon="⏱️"
          status={summary.exerciseTime >= 30 ? "good" : summary.exerciseTime >= 15 ? "warning" : "critical"}
          delay={400}
        />

        <MetricCard
          label={t('Steps')}
          value={summary.steps.toLocaleString()}
          target="10,000"
          unit="steps"
          percentage={Math.min((summary.steps / 10000) * 100, 100)}
          icon="👟"
          status={summary.steps >= 8000 ? "good" : summary.steps >= 5000 ? "warning" : "critical"}
          delay={600}
        />
        <MetricCard
          label={t('Water')}
          value={summary.water.toString()}
          target="8"
          unit="glasses"
          percentage={Math.min((summary.water / 8) * 100, 100)}
          icon="💧"
          status={summary.water >= 6 ? "good" : "warning"}
          delay={700}
        />
        <MetricCard
          label={t('Sleep')}
          value={summary.sleep > 0 ? summary.sleep.toFixed(1) : "0"}
          target="8"
          unit="hours"
          percentage={Math.min((summary.sleep / 8) * 100, 100)}
          icon="😴"
          status={summary.sleep >= 7 ? "good" : summary.sleep >= 5 ? "warning" : "critical"}
          delay={800}
        />
      </div>

      {/* Health Calculations */}
      <div className="animate-slide-up">
        <HealthCalculations summary={summary} />
      </div>

      {/* Fitness Insights */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-slide-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">
            {summary.activities && summary.activities > 0 ? t('Today\'s Achievements') : t('Your Fitness Journey')}
          </h3>
        </div>
        <div className="grid gap-4">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="group flex gap-4 p-6 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">🔥</span>
              </div>
              <p className="text-gray-700 flex-1 leading-relaxed font-medium">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conditional Content Based on Active Section */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {summary.activities && summary.activities > 0 ? t('Performance Analytics') : t('Activity Trends')}
              </h3>
            </div>
            <WellnessChart 
              metrics={metrics} 
              hasStravaData={!!(summary.activities && summary.activities > 0)} 
            />
          </div>
          
          <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
            <StravaMap gpsData={summary.gpsData || []} athleteData={summary.athlete} />
          </div>
        </div>
      )}
      
      {activeSection === 'energy' && <EnergyBalanceDashboard />}
      {activeSection === 'training' && <TrainingCoach />}
      {activeSection === 'meals' && <MealPlanner />}
      {activeSection === 'load' && <WeeklyLoadAnalytics />}
      {activeSection === 'chat' && <AIChatCoach />}
      {activeSection === 'gamification' && <GamificationDashboard />}
      {activeSection === 'body' && <BodyCompositionTracker />}
    </div>
  )
}
