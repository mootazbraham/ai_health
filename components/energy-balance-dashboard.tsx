"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"

export default function EnergyBalanceDashboard() {
  const { getAuthHeaders } = useAuth()
  const [period, setPeriod] = useState('week')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnergyBalance()
  }, [period])

  const fetchEnergyBalance = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/energy-balance?period=${period}`, {
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch energy balance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">⚖️ Energy Balance</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="day">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800">Calories In</h3>
            <p className="text-2xl font-bold text-green-600">{data.summary.totalCaloriesIn}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold text-red-800">Calories Out</h3>
            <p className="text-2xl font-bold text-red-600">{data.summary.totalCaloriesOut}</p>
          </div>
          <div className={`p-4 rounded-lg ${data.summary.avgDailyBalance > 0 ? 'bg-orange-50' : 'bg-blue-50'}`}>
            <h3 className={`font-semibold ${data.summary.avgDailyBalance > 0 ? 'text-orange-800' : 'text-blue-800'}`}>
              Avg Daily Balance
            </h3>
            <p className={`text-2xl font-bold ${data.summary.avgDailyBalance > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
              {data.summary.avgDailyBalance > 0 ? '+' : ''}{data.summary.avgDailyBalance}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800">Projected Change</h3>
            <p className={`text-2xl font-bold ${data.summary.projectedWeightChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {data.summary.projectedWeightChange > 0 ? '+' : ''}{data.summary.projectedWeightChange} kg
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Balance Chart */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">Daily Calorie Balance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="caloriesIn" fill="#10b981" name="Calories In" />
              <Bar dataKey="caloriesOut" fill="#ef4444" name="Calories Out" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weight Projection Chart */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">Weight Projection</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.weightProjection}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="projectedWeight" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Projected Weight (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
          {data.summary.goalWeight && (
            <p className="text-sm text-gray-600 mt-2">
              Goal: {data.summary.goalWeight} kg | Current: {data.summary.currentWeight} kg
            </p>
          )}
        </div>
      </div>
    </div>
  )
}