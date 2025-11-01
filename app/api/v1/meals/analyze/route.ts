import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File
    const userId = formData.get("userId") as string

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing image or userId" }, { status: 400 })
    }

    // simulate basic nutrition classification
    const random = Math.random()
    const classification =
      random > 0.66 ? "Healthy" : random > 0.33 ? "Moderate" : "Unhealthy"

    const exampleAnalyses = {
      Healthy: {
        assessment: "Balanced meal rich in nutrients and fiber.",
        recommendation: "Keep adding colorful vegetables and lean proteins.",
      },
      Moderate: {
        assessment: "Acceptable balance but contains some processed items.",
        recommendation: "Try reducing refined carbs and sugary sauces.",
      },
      Unhealthy: {
        assessment:
          "High in fat, sodium, and processed ingredients. Low in fiber and vitamins.",
        recommendation:
          "Replace fried foods with grilled options and add fresh vegetables.",
      },
    }

    const analysis = {
      items: ["Detected food items from image"],
      calories: Math.floor(Math.random() * 700) + 400,
      protein: Math.floor(Math.random() * 40) + 10,
      carbs: Math.floor(Math.random() * 80) + 20,
      fat: Math.floor(Math.random() * 40) + 10,
      classification,
      assessment: exampleAnalyses[classification].assessment,
      recommendation: exampleAnalyses[classification].recommendation,
    }

    const mealRecord = {
      id: Date.now().toString(),
      userId,
      analysis,
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Simulated meal analyzed:", mealRecord)

    return NextResponse.json({
      success: true,
      meal: mealRecord,
    })
  } catch (error) {
    console.error("[v0] Meal analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze meal" }, { status: 500 })
  }
}
