"use client"

import { useState, useEffect } from "react"
import MealCard from "./meal-card"
import MealAnalyzer from "./meal-analyzer"
import { useAuth } from "@/hooks/use-auth"
import { useMeals } from "@/hooks/use-meals"

export default function MealTracker() {
  const { user, isAuthenticated } = useAuth()
  const { meals, totals, isLoading, error, refetch } = useMeals(user?.id)
  const [showAnalyzer, setShowAnalyzer] = useState(false)
  
  // Dynamic goals based on user or defaults
  const calorieGoal = 2000 // Can be made dynamic from user profile
  const proteinGoal = 120 // Can be made dynamic from user profile

  // Refresh meals when analyzer closes
  useEffect(() => {
    if (!showAnalyzer && isAuthenticated) {
      refetch()
    }
  }, [showAnalyzer, isAuthenticated, refetch])

  // Show loading state
  if (isLoading && meals.length === 0) {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-modern p-5 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
          <p className="text-sm font-semibold text-orange-600 uppercase mb-2 tracking-wide">Total Calories</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totals.totalCalories}</p>
          <p className="text-xs text-gray-500 font-medium">of {calorieGoal.toLocaleString()} kcal</p>
          <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totals.totalCalories / calorieGoal) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="card-modern p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <p className="text-sm font-semibold text-blue-600 uppercase mb-2 tracking-wide">Protein</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{Math.round(totals.totalProtein)}g</p>
          <p className="text-xs text-gray-500 font-medium">of {proteinGoal}g</p>
          <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totals.totalProtein / proteinGoal) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="card-modern p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <p className="text-sm font-semibold text-purple-600 uppercase mb-2 tracking-wide">Meals Logged</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{meals.length}</p>
          <p className="text-xs text-gray-500 font-medium">today</p>
        </div>

        <div className="card-modern p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
          <p className="text-sm font-semibold text-emerald-600 uppercase mb-2 tracking-wide">Remaining</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{Math.max(0, calorieGoal - totals.totalCalories)}</p>
          <p className="text-xs text-gray-500 font-medium">kcal left</p>
        </div>
      </div>

      {/* Meal Analyzer Button */}
      <button
        onClick={() => setShowAnalyzer(!showAnalyzer)}
        className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 btn-hover-lift"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-2xl">📸</span>
          {showAnalyzer ? "Close Analyzer" : "Analyze New Meal"}
        </span>
      </button>

      {/* Meal Analyzer */}
      <div className={`transition-all duration-500 ${showAnalyzer ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0 overflow-hidden"}`}>
        {showAnalyzer && (
          <div className="animate-slide-up">
            <MealAnalyzer onMealAdded={() => {
              // Refresh meals list after adding
              refetch()
              setShowAnalyzer(false)
            }} />
          </div>
        )}
      </div>

      {/* Meals List */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-2xl font-bold text-gray-900">Today's Meals</h3>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            {meals.length} {meals.length === 1 ? "meal" : "meals"}
          </span>
        </div>
        {meals.length === 0 ? (
          <div className="card-modern p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
            <p className="text-gray-500 font-medium">No meals logged yet</p>
            <p className="text-sm text-gray-400 mt-1">Start by analyzing your first meal!</p>
          </div>
        ) : (
          meals.map((meal, idx) => (
            <div key={meal.id} style={{ animationDelay: `${idx * 100}ms` }} className="animate-slide-up">
              <MealCard meal={meal} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
