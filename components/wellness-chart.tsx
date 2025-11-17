"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { HealthMetric } from "@/hooks/use-metrics"

interface WellnessChartProps {
  metrics: HealthMetric[]
  hasStravaData: boolean
}

export default function WellnessChart({ metrics, hasStravaData }: WellnessChartProps) {
  // Generate chart data from real metrics
  const generateChartData = () => {
    if (!metrics.length) {
      return [
        { day: "Today", distance: 0, activities: 0, calories: 0 },
      ]
    }
    
    // Group metrics by day and type
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        day: `${date.toLocaleDateString('en', { weekday: 'short' })} ${date.getDate()}`,
        date: date.toDateString(),
        distance: 0,
        activities: 0,
        calories: 0,
        steps: 0
      }
    })
    
    // Fill with real data
    metrics.forEach(metric => {
      const metricDate = new Date(metric.recordedAt).toDateString()
      const dayData = last7Days.find(d => d.date === metricDate)
      if (dayData) {
        switch (metric.type) {
          case 'distance':
            dayData.distance = Math.round(metric.value / 1000) // Convert to km
            break
          case 'activities':
            dayData.activities = metric.value
            break
          case 'calories':
            dayData.calories = metric.value
            break
          case 'steps':
            dayData.steps = metric.value
            break
        }
      }
    })
    
    return last7Days
  }
  
  const data = generateChartData()
  return (
    <div className="card-modern p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <span className="text-white text-lg">📊</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          {hasStravaData ? 'Your Activity Performance' : 'Weekly Wellness Trend'}
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="day"
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: "#6b7280" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "2px solid #e5e7eb",
              borderRadius: "0.75rem",
              padding: "12px",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            }}
            labelStyle={{ color: "#374151", fontWeight: "bold" }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="line"
          />
          {hasStravaData ? (
            <>
              <Line
                type="monotone"
                dataKey="distance"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 5 }}
                activeDot={{ r: 7 }}
                name="Distance (km)"
              />
              <Line
                type="monotone"
                dataKey="activities"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: "#f59e0b", r: 5 }}
                activeDot={{ r: 7 }}
                name="Activities"
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: "#ef4444", r: 5 }}
                activeDot={{ r: 7 }}
                name="Calories Burned"
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="steps"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 5 }}
                activeDot={{ r: 7 }}
                name="Steps"
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: "#f59e0b", r: 5 }}
                activeDot={{ r: 7 }}
                name="Calories"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
