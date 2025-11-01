"use client"

import { useState } from "react"
import MealCard from "./meal-card"
import MealAnalyzer from "./meal-analyzer"

interface Meal {
  id: string
  name: string
  time: string
  calories: number
  protein: number
  carbs: number
  fat: number
  image: string
  aiAnalysis: string
}

export default function MealTracker() {
  const [meals, setMeals] = useState<Meal[]>([
    {
      id: "1",
      name: "Grilled Chicken Salad",
      time: "12:30 PM",
      calories: 450,
      protein: 35,
      carbs: 25,
      fat: 12,
      image: "/grilled-chicken-salad.png",
      aiAnalysis: "Excellent choice! High in protein and low in calories. Great for muscle recovery.",
    },
    {
      id: "2",
      name: "Smoothie Bowl",
      time: "8:00 AM",
      calories: 320,
      protein: 12,
      carbs: 52,
      fat: 8,
      image: "/vibrant-smoothie-bowl.png",
      aiAnalysis: "Good breakfast option. Rich in antioxidants and natural sugars for energy.",
    },
  ])

  const [showAnalyzer, setShowAnalyzer] = useState(false)

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0)
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0)

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card-bg rounded-xl border border-card-border p-4 card-shadow">
          <p className="text-sm text-muted mb-1">Total Calories</p>
          <p className="text-2xl font-bold text-foreground">{totalCalories}</p>
          <p className="text-xs text-muted mt-1">of 2,200 kcal</p>
        </div>
        <div className="bg-card-bg rounded-xl border border-card-border p-4 card-shadow">
          <p className="text-sm text-muted mb-1">Protein</p>
          <p className="text-2xl font-bold text-success">{totalProtein}g</p>
          <p className="text-xs text-muted mt-1">of 150g</p>
        </div>
        <div className="bg-card-bg rounded-xl border border-card-border p-4 card-shadow">
          <p className="text-sm text-muted mb-1">Meals Logged</p>
          <p className="text-2xl font-bold text-accent">{meals.length}</p>
          <p className="text-xs text-muted mt-1">today</p>
        </div>
        <div className="bg-card-bg rounded-xl border border-card-border p-4 card-shadow">
          <p className="text-sm text-muted mb-1">Remaining</p>
          <p className="text-2xl font-bold text-warning">{2200 - totalCalories}</p>
          <p className="text-xs text-muted mt-1">kcal</p>
        </div>
      </div>

      {/* Meal Analyzer Button */}
      <button
        onClick={() => setShowAnalyzer(!showAnalyzer)}
        className="w-full bg-accent text-white py-3 rounded-xl font-medium hover:bg-primary-dark transition-all duration-200 ease-in-out"
      >
        {showAnalyzer ? "Close Analyzer" : "Analyze New Meal"}
      </button>

      {/* Meal Analyzer */}
      {showAnalyzer && <MealAnalyzer onMealAdded={(meal) => setMeals([...meals, meal])} />}

      {/* Meals List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Today's Meals</h3>
        {meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} />
        ))}
      </div>
    </div>
  )
}
