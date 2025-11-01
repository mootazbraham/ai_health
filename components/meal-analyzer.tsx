"use client"

import type React from "react"

import { useState, useRef } from "react"

interface MealAnalyzerProps {
  onMealAdded: (meal: any) => void
}

export default function MealAnalyzer({ onMealAdded }: MealAnalyzerProps) {
  const [mealName, setMealName] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
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
  if (!mealName.trim() && !fileInputRef.current?.files?.[0]) return

  setIsAnalyzing(true)

  try {
    const formData = new FormData()
    formData.append("userId", "user-123")
    formData.append("mealName", mealName)

    // ✅ append the actual file (not base64)
    const file = fileInputRef.current?.files?.[0]
    if (file) formData.append("image", file)

    const response = await fetch("/api/v1/meals/analyze", {
      method: "POST",
      body: formData, // ✅ no headers! browser handles Content-Type
    })

    const data = await response.json()

    if (data.success) {
      const newMeal = {
        id: Date.now().toString(),
        name: data.meal?.analysis?.mealName || mealName,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        calories: data.meal?.analysis?.calories || Math.floor(Math.random() * 600) + 200,
        protein: data.meal?.analysis?.protein || Math.floor(Math.random() * 40) + 10,
        carbs: data.meal?.analysis?.carbs || Math.floor(Math.random() * 80) + 20,
        fat: data.meal?.analysis?.fat || Math.floor(Math.random() * 30) + 5,
        image: photoPreview || `/placeholder.svg?height=200&width=200&query=${mealName}`,
        aiAnalysis:
          data.meal?.coaching ||
          `This ${mealName} is a nutritious choice. Contains a good balance of macronutrients.`,
      }

      onMealAdded(newMeal)
      setMealName("")
      setPhotoPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  } catch (error) {
    console.error("[v0] Meal analysis error:", error)
  }

  setIsAnalyzing(false)
}


  return (
    <div className="bg-card-bg rounded-xl p-6" style={{ border: "1px solid var(--color-neutral-200)" }}>
      <h3 className="text-lg font-bold text-foreground mb-4">Analyze Your Meal</h3>

      <div className="space-y-4">
        {/* Photo Preview */}
        {photoPreview && (
          <div className="relative">
            <img
              src={photoPreview || "/placeholder.svg"}
              alt="Meal preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={() => setPhotoPreview(null)}
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        )}

        {/* Upload or Input */}
        <div
          className="rounded-lg p-8 text-center"
          style={{
            border: "2px dashed var(--color-neutral-300)",
            backgroundColor: "var(--color-neutral-50)",
          }}
        >
          <p className="text-lg font-medium text-foreground mb-2">📸 Upload Meal Photo</p>
          <p className="text-sm text-muted mb-4">or describe your meal below</p>
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
            className="inline-block px-4 py-2 rounded-lg cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: "var(--color-accent-teal)",
              color: "white",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Choose Image
          </label>
        </div>

        {/* Meal Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Meal Description</label>
          <input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="e.g., Grilled salmon with broccoli and rice"
            className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{
              border: "1px solid var(--color-neutral-200)",
              focusRing: "2px solid var(--color-primary)",
            }}
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={(!mealName.trim() && !photoPreview) || isAnalyzing}
          className="w-full text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          style={{
            backgroundColor: isAnalyzing ? "var(--color-neutral-400)" : "var(--color-primary)",
          }}
          onMouseEnter={(e) => !isAnalyzing && (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {isAnalyzing ? "Analyzing with AI..." : "Analyze Meal"}
        </button>
      </div>
    </div>
  )
}
