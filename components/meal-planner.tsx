"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

export default function MealPlanner() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [selectedDate])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/meal-recommendations?date=${selectedDate}`, {
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch meal recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectMeal = async (recommendationId: number) => {
    try {
      const response = await fetch('/api/v1/meal-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ recommendationId })
      })
      if (response.ok) {
        await fetchRecommendations()
      }
    } catch (error) {
      console.error('Failed to select meal:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const progressPercentage = (data.consumed.calories / data.targets.calories) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">🍽️ Daily Meal Planner</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-1"
          />
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Daily Calories</span>
            <span>{data.consumed.calories} / {data.targets.calories}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                progressPercentage > 100 ? 'bg-red-500' : progressPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Macros Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800">Protein</h3>
            <p className="text-blue-600">{Math.round(data.consumed.protein)}g / {Math.round(data.targets.protein)}g</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800">Carbs</h3>
            <p className="text-green-600">{Math.round(data.consumed.carbs)}g / {Math.round(data.targets.carbs)}g</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Fat</h3>
            <p className="text-yellow-600">{Math.round(data.consumed.fat)}g / {Math.round(data.targets.fat)}g</p>
          </div>
        </div>
      </div>

      {/* Meal Recommendations */}
      {data.remaining.calories > 100 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">🤖 AI Meal Recommendations</h3>
          <p className="text-gray-600 mb-4">
            Based on your remaining {Math.round(data.remaining.calories)} calories
          </p>
          
          {['breakfast', 'lunch', 'dinner'].map(mealType => {
            const mealRecommendations = data.recommendations.filter((r: any) => r.mealType === mealType)
            if (mealRecommendations.length === 0) return null

            return (
              <div key={mealType} className="mb-6">
                <h4 className="font-semibold text-lg mb-3 capitalize">{mealType}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mealRecommendations.map((meal: any) => (
                    <div
                      key={meal.id}
                      className={`p-4 rounded-lg border ${
                        meal.selected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <h5 className="font-semibold">{meal.name}</h5>
                      <p className="text-sm text-gray-600 mb-2">{meal.description}</p>
                      <div className="text-xs text-gray-500 mb-3">
                        <span>{meal.calories} cal • </span>
                        <span>{Math.round(meal.protein)}g protein • </span>
                        <span>{Math.round(meal.carbs)}g carbs • </span>
                        <span>{Math.round(meal.fat)}g fat</span>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Ingredients:</p>
                        <p className="text-xs text-gray-600">{meal.ingredients}</p>
                      </div>
                      {meal.selected ? (
                        <span className="text-green-600 font-semibold text-sm">✓ Selected</span>
                      ) : (
                        <button
                          onClick={() => selectMeal(meal.id)}
                          className="w-full py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Select This Meal
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {data.remaining.calories <= 100 && (
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <h3 className="text-lg font-bold text-green-600 mb-2">🎉 Daily Goal Achieved!</h3>
          <p className="text-gray-600">You've reached your calorie target for today. Great job!</p>
        </div>
      )}
    </div>
  )
}