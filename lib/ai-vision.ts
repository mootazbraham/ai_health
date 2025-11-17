/**
 * AI Vision API integration for meal analysis
 * Uses OpenRouter Vision API (supports multiple models)
 */

export interface MealAnalysisResult {
  items: string[]
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  classification: "Healthy" | "Moderate" | "Unhealthy"
  assessment: string
  recommendation: string
}

/**
 * Analyze meal image using AI Vision
 */
export async function analyzeMealImage(
  imageBase64: string,
  mealName?: string
): Promise<MealAnalysisResult> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured")
  }

  // Try multiple vision models in order
  const visionModels = [
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-flash-1.5:free",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "anthropic/claude-3.5-sonnet", // Requires credits but more accurate
  ]

  const systemPrompt = `You are a nutritionist AI. Analyze this meal image and provide:
1. List all food items you can identify
2. Estimate nutritional values (calories, protein, carbs, fat, fiber)
3. Classify as "Healthy", "Moderate", or "Unhealthy"
4. Provide assessment and recommendations

Return a JSON object with this structure:
{
  "items": ["food item 1", "food item 2"],
  "calories": 450,
  "protein": 35,
  "carbs": 45,
  "fat": 12,
  "fiber": 5,
  "classification": "Healthy",
  "assessment": "Brief assessment text",
  "recommendation": "Recommendation text"
}`

  const userPrompt = mealName
    ? `Analyze this meal image. The user described it as: "${mealName}". Provide detailed nutritional analysis.`
    : "Analyze this meal image and provide detailed nutritional information."

  let lastError: any = null

  for (const model of visionModels) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
          temperature: 0.3, // Lower temperature for more consistent results
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        lastError = data
        console.warn(`[AI Vision] Model ${model} failed:`, data.error?.message)
        continue
      }

      const content = data.choices?.[0]?.message?.content

      if (!content) {
        continue
      }

      // Try to parse JSON from response
      let analysis: MealAnalysisResult

      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
        const jsonText = jsonMatch ? jsonMatch[1] : content

        analysis = JSON.parse(jsonText.trim())
      } catch (parseError) {
        // If JSON parsing fails, try to extract data from text
        analysis = extractAnalysisFromText(content)
      }

      // Validate and normalize the result
      return normalizeAnalysis(analysis)

    } catch (error) {
      lastError = error
      console.warn(`[AI Vision] Model ${model} error:`, error)
      continue
    }
  }

  // If all models failed, return a fallback
  throw new Error(`AI Vision analysis failed: ${lastError?.error?.message || "Unknown error"}`)
}

/**
 * Extract analysis data from free-form text (fallback)
 */
function extractAnalysisFromText(text: string): Partial<MealAnalysisResult> {
  // Simple extraction patterns (basic fallback)
  const items: string[] = []
  const caloriesMatch = text.match(/calories?[:\s]+(\d+)/i)
  const proteinMatch = text.match(/protein[:\s]+(\d+)/i)
  const carbsMatch = text.match(/(?:carbs|carbohydrates)[:\s]+(\d+)/i)
  const fatMatch = text.match(/fat[:\s]+(\d+)/i)

  return {
    items: items.length > 0 ? items : ["Food items detected"],
    calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 400,
    protein: proteinMatch ? parseInt(proteinMatch[1]) : 20,
    carbs: carbsMatch ? parseInt(carbsMatch[1]) : 50,
    fat: fatMatch ? parseInt(fatMatch[1]) : 15,
    classification: text.toLowerCase().includes("healthy")
      ? "Healthy"
      : text.toLowerCase().includes("unhealthy")
        ? "Unhealthy"
        : "Moderate",
    assessment: text.substring(0, 200),
    recommendation: text.substring(200, 400) || "Consider adding more vegetables.",
  }
}

/**
 * Normalize and validate analysis result
 */
function normalizeAnalysis(analysis: any): MealAnalysisResult {
  return {
    items: Array.isArray(analysis.items) ? analysis.items : ["Unknown food items"],
    calories: Math.max(0, Math.min(5000, Number(analysis.calories) || 400)),
    protein: Math.max(0, Math.min(200, Number(analysis.protein) || 20)),
    carbs: Math.max(0, Math.min(500, Number(analysis.carbs) || 50)),
    fat: Math.max(0, Math.min(200, Number(analysis.fat) || 15)),
    fiber: analysis.fiber ? Math.max(0, Number(analysis.fiber)) : undefined,
    classification:
      analysis.classification === "Healthy" ||
      analysis.classification === "Moderate" ||
      analysis.classification === "Unhealthy"
        ? analysis.classification
        : "Moderate",
    assessment: String(analysis.assessment || "Meal analyzed successfully.").substring(0, 500),
    recommendation: String(analysis.recommendation || "Continue with balanced nutrition.").substring(0, 500),
  }
}


