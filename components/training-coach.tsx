"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"

export default function TrainingCoach() {
  const { getAuthHeaders } = useAuth()
  const { t } = useLanguage()
  const [plans, setPlans] = useState<any[]>([])
  const [activePlan, setActivePlan] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/v1/training-plans?userId=1', {
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.success) {
        setPlans(result.plans)
        setActivePlan(result.plans.find((p: any) => p.isActive))
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPlan = async (formData: any) => {
    try {
      const response = await fetch('/api/v1/training-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ ...formData, userId: 1 })
      })
      const result = await response.json()
      if (result.success) {
        await fetchPlans()
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Failed to create plan:', error)
    }
  }

  const markWorkoutComplete = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/v1/workout-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ completed: true, completedAt: new Date() })
      })
      if (response.ok) {
        await fetchPlans()
      }
    } catch (error) {
      console.error('Failed to mark workout complete:', error)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{t('AI Training Coach')}</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('Create New Plan')}
          </button>
        </div>

        {activePlan ? (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-800">{activePlan.name}</h3>
            <p className="text-blue-600">{activePlan.description}</p>
            <div className="flex gap-4 mt-2 text-sm text-blue-700">
              <span>Goal: {activePlan.goal}</span>
              <span>Duration: {activePlan.duration} weeks</span>
              <span>Level: {activePlan.difficulty}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600">No active training plan. Create one to get started!</p>
          </div>
        )}
      </div>

      {/* This Week's Workouts */}
      {activePlan && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">{t('This Week\'s Workouts')}</h3>
          <div className="space-y-3">
            {(activePlan.workoutSessions || activePlan.workouts || [])
              .slice(0, 7) // Show first 7 workouts
              .map((session: any, index: number) => (
                <div
                  key={session.id || index}
                  className={`p-4 rounded-lg border ${
                    session.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{session.name}</h4>
                      <p className="text-sm text-gray-600">
                        Day {index + 1} • {session.duration} min • {session.calories} cal
                      </p>
                      {session.notes && (
                        <p className="text-sm text-gray-500 mt-1">{session.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {session.completed ? (
                        <span className="text-green-600 font-semibold">{t('Completed')}</span>
                      ) : (
                        <button
                          onClick={() => markWorkoutComplete(session.id || index + 1)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          {t('Mark Complete')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreateForm && (
        <CreatePlanForm
          onSubmit={createPlan}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  )
}

function CreatePlanForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    goal: 'weight_loss',
    availableTime: 3,
    fitnessLevel: 'intermediate'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Create Training Plan</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Goal</label>
            <select
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="endurance">Endurance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Workouts per week</label>
            <select
              value={formData.availableTime}
              onChange={(e) => setFormData({ ...formData, availableTime: parseInt(e.target.value) })}
              className="w-full border rounded px-3 py-2"
            >
              <option value={2}>2 times</option>
              <option value={3}>3 times</option>
              <option value={4}>4 times</option>
              <option value={5}>5 times</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fitness Level</label>
            <select
              value={formData.fitnessLevel}
              onChange={(e) => setFormData({ ...formData, fitnessLevel: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Generate Plan
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}