"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"

interface MealAnalyzerProps {
  onMealAdded: () => void
}

export default function MealAnalyzer({ onMealAdded }: MealAnalyzerProps) {
  const { user, getAuthHeaders, isAuthenticated } = useAuth()
  const [mealName, setMealName] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!mealName.trim() && !fileInputRef.current?.files?.[0]) {
      setError("Please provide a meal description or photo")
      return
    }

    if (!isAuthenticated || !user) {
      setError("Please log in to analyze meals")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("mealName", mealName)

      const file = fileInputRef.current?.files?.[0]
      if (file) formData.append("image", file)

      const response = await fetch("/api/v1/meals/analyze", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze meal")
      }

      if (data.success) {
        // Success - callback will refresh the meals list
        onMealAdded()
        setMealName("")
        setPhotoPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze meal"
      setError(errorMessage)
      console.error("[MealAnalyzer] Error:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="card-modern p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <span className="text-white text-lg">📸</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Analyze Your Meal</h3>
      </div>

      <div className="space-y-5">
        {/* Photo Preview */}
        {photoPreview && (
          <div className="relative rounded-2xl overflow-hidden shadow-lg animate-scale-in">
            <img
              src={photoPreview}
              alt="Meal preview"
              className="w-full h-64 object-cover"
            />
            <button
              onClick={() => setPhotoPreview(null)}
              className="absolute top-3 right-3 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all shadow-lg transform hover:scale-105"
            >
              Remove
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`relative rounded-2xl p-12 text-center border-2 border-dashed transition-all duration-300 ${
            photoPreview
              ? "bg-gray-50 border-gray-300"
              : "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-purple-100"
          }`}
        >
          {!photoPreview ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-3xl">📷</span>
              </div>
              <p className="text-lg font-bold text-gray-700 mb-2">Upload Meal Photo</p>
              <p className="text-sm text-gray-500 mb-6">or describe your meal below</p>
            </>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoCapture}
            className="hidden"
            id="meal-upload"
          />
          <label
            htmlFor="meal-upload"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 btn-hover-lift"
          >
            {photoPreview ? "Change Image" : "Choose Image"}
          </label>
        </div>

        {/* Meal Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Meal Description <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="e.g., Grilled salmon with broccoli and rice"
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={(!mealName.trim() && !photoPreview) || isAnalyzing || !isAuthenticated}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 ${
            isAnalyzing || !isAuthenticated
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] btn-hover-lift"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing with AI...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">✨</span>
              Analyze Meal
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
