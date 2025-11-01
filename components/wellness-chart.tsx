"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { day: "Mon", steps: 8234, calories: 2100, sleep: 7.2 },
  { day: "Tue", steps: 6234, calories: 1950, sleep: 6.8 },
  { day: "Wed", steps: 9234, calories: 2200, sleep: 7.5 },
  { day: "Thu", steps: 7234, calories: 1850, sleep: 7.8 },
  { day: "Fri", steps: 10234, calories: 2300, sleep: 8.0 },
  { day: "Sat", steps: 5234, calories: 1700, sleep: 8.2 },
  { day: "Sun", steps: 7234, calories: 1850, sleep: 7.5 },
]

export default function WellnessChart() {
  return (
    <div className="bg-card-bg rounded-xl border border-card-border p-6">
      <h3 className="text-lg font-bold text-foreground mb-6">Weekly Wellness Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" />
          <XAxis dataKey="day" stroke="var(--color-neutral-600)" />
          <YAxis stroke="var(--color-neutral-600)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "0.5rem",
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="steps" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="calories" stroke="var(--color-warning)" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="sleep" stroke="var(--color-success)" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
