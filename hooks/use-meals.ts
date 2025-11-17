/**
 * Meals Hook
 * Fetches and manages meal data
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'

export interface Meal {
  id: number
  userId: number
  mealName: string | null
  imageUrl: string | null
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
  aiAnalysis: string | null
  classification: string | null
  assessment: string | null
  recommendation: string | null
  createdAt: string
}

export interface MealTotals {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export function useMeals(userId?: number) {
  const { isAuthenticated, getAuthHeaders } = useAuth()
  const [meals, setMeals] = useState<Meal[]>([])
  const [totals, setTotals] = useState<MealTotals>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch meals from API
  const fetchMeals = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setError('Authentication required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/meals?userId=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch meals')
      }

      const data = await response.json()

      if (data.success && data.meals) {
        setMeals(data.meals)

        // Calculate totals
        const totals = data.meals.reduce(
          (acc: MealTotals, meal: Meal) => ({
            totalCalories: acc.totalCalories + (meal.calories || 0),
            totalProtein: acc.totalProtein + (meal.protein || 0),
            totalCarbs: acc.totalCarbs + (meal.carbs || 0),
            totalFat: acc.totalFat + (meal.fat || 0),
          }),
          { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
        )

        setTotals(totals)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch meals'
      setError(errorMessage)
      console.error('[useMeals] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, userId, getAuthHeaders])

  // Analyze meal (upload image)
  const analyzeMeal = useCallback(
    async (file: File, mealName?: string) => {
      if (!isAuthenticated || !userId) {
        setError('Authentication required')
        return { success: false, error: 'Authentication required' }
      }

      setIsLoading(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('userId', userId.toString())
        if (mealName) formData.append('mealName', mealName)

        const response = await fetch('/api/v1/meals/analyze', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to analyze meal')
        }

        // Refresh meals after adding
        await fetchMeals()

        return { success: true, meal: data.meal }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to analyze meal'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated, userId, getAuthHeaders, fetchMeals]
  )

  // Fetch meals on mount and when userId changes
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchMeals()
    }
  }, [isAuthenticated, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    meals,
    totals,
    isLoading,
    error,
    fetchMeals,
    analyzeMeal,
    refetch: fetchMeals,
  }
}




