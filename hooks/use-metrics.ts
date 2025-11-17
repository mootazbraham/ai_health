/**
 * Health Metrics Hook
 * Fetches and manages health metrics data
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'

export interface HealthMetric {
  id: number
  type: string
  value: number
  unit: string
  createdAt: string
  recordedAt: string
}

export interface MetricsSummary {
  steps: number
  calories: number
  water: number
  sleep: number
  heartRate: number
  bloodPressure: string
  activities?: number
  distance?: number
  exerciseTime?: number
  avgSpeed?: number
  mealCalories?: number
  gpsData?: Array<{
    id: number
    name: string
    startLat?: number
    startLng?: number
    endLat?: number
    endLng?: number
    city?: string
    country?: string
  }>
  athlete?: {
    city?: string
    state?: string
    country?: string
    profile?: string
  }
}

export function useMetrics(userId?: number) {
  const { isAuthenticated, getAuthHeaders } = useAuth()
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [summary, setSummary] = useState<MetricsSummary>({
    steps: 0,
    calories: 0,
    water: 0,
    sleep: 0,
    heartRate: 0,
    bloodPressure: '--/--',
    activities: 0,
    distance: 0,
    exerciseTime: 0,
    avgSpeed: 0,
    mealCalories: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch metrics from API
  const fetchMetrics = useCallback(
    async (metricType?: string) => {
      if (!isAuthenticated || !userId) {
        setSummary({
          steps: 0,
          calories: 0,
          water: 0,
          sleep: 0,
          heartRate: 0,
          bloodPressure: '--/--',
        })
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ userId: userId.toString() })
        if (metricType) params.append('type', metricType)

        const [metricsResponse, mealsResponse] = await Promise.all([
          fetch(`/api/v1/health/metrics?${params}`, {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
          }),
          fetch(`/api/v1/meals?userId=${userId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
          })
        ])

        const response = metricsResponse

        if (!response.ok) {
          if (response.status === 401) {
            setError('Authentication expired')
            return
          }
          throw new Error(`Failed to fetch metrics: ${response.status}`)
        }

        const [data, mealsData] = await Promise.all([
          response.json(),
          mealsResponse.ok ? mealsResponse.json() : { success: false, meals: [] }
        ])

        if (data.success && data.metrics) {
          setMetrics(data.metrics)

          // Calculate summary from latest metrics of each type
          const summary: MetricsSummary = {
            steps: 0,
            calories: 0,
            water: 0,
            sleep: 0,
            heartRate: 0,
            bloodPressure: '--/--',
          }

          // Filter metrics by today for daily dashboard
          const today = new Date().toISOString().split('T')[0]
          const todayMetrics = data.metrics.filter((metric: HealthMetric) => {
            const metricDate = new Date(metric.recordedAt).toISOString().split('T')[0]
            return metricDate === today
          })
          
          // Get latest metric of each type for today
          const typeMap = new Map<string, HealthMetric>()
          todayMetrics.forEach((metric: HealthMetric) => {
            const existing = typeMap.get(metric.type)
            if (!existing || new Date(metric.recordedAt) > new Date(existing.recordedAt)) {
              typeMap.set(metric.type, metric)
            }
          })

          // Populate summary
          typeMap.forEach((metric) => {
            switch (metric.type) {
              case 'steps':
                summary.steps = metric.value
                break
              case 'calories':
                // Sum all exercise calories for today
                const allCalories = todayMetrics.filter((m: HealthMetric) => m.type === 'calories')
                summary.calories = allCalories.reduce((sum: number, m: HealthMetric) => sum + m.value, 0)
                break
              case 'water':
                summary.water = metric.value
                break
              case 'sleep':
                summary.sleep = metric.value
                break
              case 'heart_rate':
                summary.heartRate = metric.value
                break
              case 'blood_pressure':
                summary.bloodPressure = metric.value.toString()
                break
              case 'activities':
                // Sum all activities for today
                const allActivities = todayMetrics.filter((m: HealthMetric) => m.type === 'activities')
                summary.activities = allActivities.reduce((sum: number, m: HealthMetric) => sum + m.value, 0)
                break
              case 'distance':
                summary.distance = metric.value
                break
              case 'exercise_time':
                // Sum all exercise time for today
                const allExerciseTime = todayMetrics.filter((m: HealthMetric) => m.type === 'exercise_time')
                summary.exerciseTime = allExerciseTime.reduce((sum: number, m: HealthMetric) => sum + m.value, 0)
                break
              case 'meal_calories':
                summary.mealCalories = (summary.mealCalories || 0) + metric.value
                break
              case 'avg_speed':
                summary.avgSpeed = metric.value
                break
              case 'gps_data':
                try {
                  summary.gpsData = JSON.parse(metric.unit)
                  console.log('GPS data loaded:', summary.gpsData)
                } catch (e) {
                  console.error('Failed to parse GPS data:', e)
                  summary.gpsData = []
                }
                break
            }
          })

          // Add meal calories if available
          if (mealsData.success && mealsData.meals) {
            const totalMealCalories = mealsData.meals.reduce((total: number, meal: any) => {
              return total + (meal.calories || 0)
            }, 0)
            summary.mealCalories = totalMealCalories
          }

          setSummary(summary)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics'
        setError(errorMessage)
        console.error('[useMetrics] Error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated, userId, getAuthHeaders]
  )

  // Add new metric
  const addMetric = useCallback(
    async (type: string, value: number, unit: string = 'unknown') => {
      if (!isAuthenticated || !userId) {
        setError('Authentication required')
        return { success: false, error: 'Authentication required' }
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/v1/health/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            userId,
            type,
            value,
            unit,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to add metric')
        }

        // Refresh metrics after adding
        await fetchMetrics()

        return { success: true, data }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add metric'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated, userId, getAuthHeaders, fetchMetrics]
  )

  // Fetch metrics on mount and when userId changes
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchMetrics()
    } else {
      // Reset state when not authenticated
      setMetrics([])
      setSummary({
        steps: 0,
        calories: 0,
        water: 0,
        sleep: 0,
        heartRate: 0,
        bloodPressure: '--/--',
      })
    }
  }, [isAuthenticated, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    metrics,
    summary,
    isLoading,
    error,
    fetchMetrics,
    addMetric,
    refetch: () => fetchMetrics(),
  }
}




