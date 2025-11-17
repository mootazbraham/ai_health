"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

export default function ManualDataEntry({ onSync }: { onSync?: () => void }) {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState({
    steps: '',
    heartRate: '',
    calories: '',
    sleep: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/v1/health/metrics', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: [
            { type: 'steps', value: parseInt(data.steps) || 0, unit: 'steps' },
            { type: 'heart_rate', value: parseInt(data.heartRate) || 0, unit: 'bpm' },
            { type: 'calories', value: parseInt(data.calories) || 0, unit: 'kcal' },
            { type: 'sleep', value: parseFloat(data.sleep) || 0, unit: 'hours' }
          ]
        })
      })
      
      if (response.ok) {
        setData({ steps: '', heartRate: '', calories: '', sleep: '' })
        onSync?.()
      }
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">📱 Add Today's Data</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Steps"
            type="number"
            value={data.steps}
            onChange={(e) => setData({...data, steps: e.target.value})}
          />
          <Input
            placeholder="Heart Rate (bpm)"
            type="number"
            value={data.heartRate}
            onChange={(e) => setData({...data, heartRate: e.target.value})}
          />
          <Input
            placeholder="Calories"
            type="number"
            value={data.calories}
            onChange={(e) => setData({...data, calories: e.target.value})}
          />
          <Input
            placeholder="Sleep (hours)"
            type="number"
            step="0.1"
            value={data.sleep}
            onChange={(e) => setData({...data, sleep: e.target.value})}
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Adding...' : 'Add Data'}
        </Button>
      </form>
    </Card>
  )
}