"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

interface BodyComposition {
  id: string
  weight: number
  bodyFat: number
  muscleMass: number
  visceralFat: number
  date: string
}

export default function BodyCompositionTracker() {
  const { user } = useAuth()
  const [compositions, setCompositions] = useState<BodyComposition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    muscleMass: '',
    visceralFat: ''
  })

  useEffect(() => {
    if (user?.id) {
      fetchCompositions()
    }
  }, [user?.id])

  const fetchCompositions = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/body-composition?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setCompositions(data.compositions || [])
      }
    } catch (error) {
      console.error('Failed to fetch body compositions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      const response = await fetch('/api/v1/body-composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          weight: parseFloat(formData.weight),
          bodyFat: parseFloat(formData.bodyFat),
          muscleMass: parseFloat(formData.muscleMass),
          visceralFat: parseFloat(formData.visceralFat)
        })
      })

      if (response.ok) {
        setFormData({ weight: '', bodyFat: '', muscleMass: '', visceralFat: '' })
        setShowForm(false)
        fetchCompositions()
      }
    } catch (error) {
      console.error('Failed to save body composition:', error)
    }
  }

  const latest = compositions[0]
  const previous = compositions[1]

  const getChange = (current: number, prev: number) => {
    if (!prev) return null
    const change = current - prev
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Body Composition</h2>
          <p className="text-gray-600">Track your body composition changes over time</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Entry'}
        </button>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">New Body Composition Entry</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body Fat (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.bodyFat}
                onChange={(e) => setFormData(prev => ({ ...prev, bodyFat: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Muscle Mass (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.muscleMass}
                onChange={(e) => setFormData(prev => ({ ...prev, muscleMass: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visceral Fat
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.visceralFat}
                onChange={(e) => setFormData(prev => ({ ...prev, visceralFat: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Stats */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Weight', value: latest.weight, unit: 'kg', icon: '⚖️', change: previous ? getChange(latest.weight, previous.weight) : null },
            { label: 'Body Fat', value: latest.bodyFat, unit: '%', icon: '📊', change: previous ? getChange(latest.bodyFat, previous.bodyFat) : null },
            { label: 'Muscle Mass', value: latest.muscleMass, unit: 'kg', icon: '💪', change: previous ? getChange(latest.muscleMass, previous.muscleMass) : null },
            { label: 'Visceral Fat', value: latest.visceralFat, unit: '', icon: '🎯', change: previous ? getChange(latest.visceralFat, previous.visceralFat) : null }
          ].map((metric, index) => (
            <div key={index} className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{metric.icon}</span>
                {metric.change && (
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    metric.change.direction === 'up' ? 'bg-red-100 text-red-600' :
                    metric.change.direction === 'down' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {metric.change.direction === 'up' ? '↗' : metric.change.direction === 'down' ? '↘' : '→'} 
                    {metric.change.value.toFixed(1)}{metric.unit}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{metric.label}</h3>
              <p className="text-2xl font-bold text-blue-600">
                {metric.value.toFixed(1)}{metric.unit}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-lg p-6 border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">History</h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : compositions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Weight (kg)</th>
                  <th className="text-left py-2">Body Fat (%)</th>
                  <th className="text-left py-2">Muscle Mass (kg)</th>
                  <th className="text-left py-2">Visceral Fat</th>
                </tr>
              </thead>
              <tbody>
                {compositions.map((comp) => (
                  <tr key={comp.id} className="border-b">
                    <td className="py-2">{new Date(comp.date).toLocaleDateString()}</td>
                    <td className="py-2">{comp.weight.toFixed(1)}</td>
                    <td className="py-2">{comp.bodyFat.toFixed(1)}</td>
                    <td className="py-2">{comp.muscleMass.toFixed(1)}</td>
                    <td className="py-2">{comp.visceralFat.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No body composition data yet.</p>
            <p className="text-sm mt-2">Add your first entry to start tracking!</p>
          </div>
        )}
      </div>
    </div>
  )
}