"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

export default function WeeklyLoadAnalytics() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeeklyLoad()
  }, [])

  const fetchWeeklyLoad = async () => {
    try {
      const response = await fetch('/api/v1/weekly-load', {
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch weekly load:', error)
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

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return '⚠️'
      case 'moderate': return '⚡'
      default: return '✅'
    }
  }

  // Prepare chart data
  const chartData = data.weeklyLoads.reverse().map((week: any) => ({
    week: new Date(week.weekStart).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    loadScore: week.loadScore,
    distance: Math.round(week.totalDistance * 10) / 10,
    time: Math.round(week.totalTime / 60 * 10) / 10 // hours
  }))

  return (
    <div className="space-y-6">
      {/* Risk Alert */}
      <div className={`rounded-xl p-6 border ${getRiskColor(data.analysis.riskLevel)}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{getRiskIcon(data.analysis.riskLevel)}</span>
          <div>
            <h2 className="text-xl font-bold">Training Load Analysis</h2>
            <p className="text-sm opacity-80">
              Risk Level: <span className="font-semibold capitalize">{data.analysis.riskLevel}</span>
              {data.analysis.acuteChronic && (
                <span> • Acute:Chronic Ratio: {data.analysis.acuteChronic}</span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {data.analysis.recommendations.map((rec: string, index: number) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-sm mt-0.5">•</span>
              <p className="text-sm">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Load Trend Chart */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4">📈 Weekly Training Load</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="loadScore" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Load Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distance & Time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">🏃 Weekly Distance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="distance" fill="#10b981" name="Distance (km)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">⏱️ Weekly Training Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="time" fill="#f59e0b" name="Time (hours)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Summary Table */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4">📊 Recent Weeks Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Week</th>
                <th className="text-right py-2">Distance (km)</th>
                <th className="text-right py-2">Time (h)</th>
                <th className="text-right py-2">Avg Pace</th>
                <th className="text-right py-2">Load Score</th>
              </tr>
            </thead>
            <tbody>
              {data.weeklyLoads.slice(0, 8).map((week: any) => (
                <tr key={week.id} className="border-b">
                  <td className="py-2">
                    {new Date(week.weekStart).toLocaleDateString('en', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="text-right py-2">{Math.round(week.totalDistance * 10) / 10}</td>
                  <td className="text-right py-2">{Math.round(week.totalTime / 60 * 10) / 10}</td>
                  <td className="text-right py-2">
                    {week.avgPace ? `${Math.round(week.avgPace * 10) / 10} min/km` : '-'}
                  </td>
                  <td className="text-right py-2 font-semibold">{week.loadScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}