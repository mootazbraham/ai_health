"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

export default function GamificationDashboard() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGamificationData()
  }, [])

  const fetchGamificationData = async () => {
    try {
      const response = await fetch('/api/v1/gamification', {
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch gamification data:', error)
    } finally {
      setLoading(false)
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fitness': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'nutrition': return 'bg-green-50 border-green-200 text-green-800'
      case 'streak': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'special': return 'bg-purple-50 border-purple-200 text-purple-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getStreakColor = (days: number) => {
    if (days >= 30) return 'text-red-600'
    if (days >= 7) return 'text-orange-600'
    if (days >= 3) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">🏆 Your Progress</h2>
            <p className="opacity-90">Level up your fitness journey!</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{data.totalPoints}</p>
            <p className="text-sm opacity-90">Total Points</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{data.stats.totalActivities}</p>
            <p className="text-sm opacity-90">Workouts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{data.stats.totalDistance}km</p>
            <p className="text-sm opacity-90">Distance</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{data.stats.totalMeals}</p>
            <p className="text-sm opacity-90">Meals Logged</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{Math.round(data.stats.totalCalories / 1000)}k</p>
            <p className="text-sm opacity-90">Calories Burned</p>
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4">🔥 Current Streaks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-orange-800">Activity Streak</h4>
                <p className="text-sm text-orange-600">Consecutive days with workouts</p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${getStreakColor(data.streaks.activity)}`}>
                  {data.streaks.activity}
                </p>
                <p className="text-sm text-orange-600">days</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-green-800">Meal Logging Streak</h4>
                <p className="text-sm text-green-600">Consecutive days logging meals</p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${getStreakColor(data.streaks.meal)}`}>
                  {data.streaks.meal}
                </p>
                <p className="text-sm text-green-600">days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4">🏅 Achievements</h3>
        
        {data.achievements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">🎯</span>
            <p>Complete your first activity to unlock achievements!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.achievements.map((userAchievement: any) => (
              <div
                key={userAchievement.id}
                className={`p-4 rounded-lg border ${getCategoryColor(userAchievement.achievement.category)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{userAchievement.achievement.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold">{userAchievement.achievement.name}</h4>
                    <p className="text-sm opacity-80 mb-2">
                      {userAchievement.achievement.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-1 bg-white/50 rounded">
                        {userAchievement.achievement.points} pts
                      </span>
                      <span className="text-xs opacity-70">
                        {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivational Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white text-center">
        <h3 className="text-xl font-bold mb-2">Keep Going! 💪</h3>
        <p className="opacity-90">
          {data.streaks.activity >= 7 
            ? "Amazing streak! You're building incredible habits!"
            : data.streaks.activity >= 3
            ? "Great momentum! Keep the streak alive!"
            : "Every journey starts with a single step. You've got this!"
          }
        </p>
        {data.achievements.length > 0 && (
          <p className="text-sm opacity-80 mt-2">
            Latest achievement: {data.achievements[0].achievement.name} 🎉
          </p>
        )}
      </div>
    </div>
  )
}