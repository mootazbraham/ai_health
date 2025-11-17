import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sanitizeInput } from "@/lib/security"
import { logAuditEvent } from "@/lib/audit-log"
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { message, conversationId } = body

      if (!message) {
        return NextResponse.json({ error: "Missing message" }, { status: 400 })
      }

      // Security: Sanitize user message to prevent XSS
      message = sanitizeInput(String(message).trim())
      
      // Security: Validate message length
      if (message.length > 2000) {
        return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 })
      }

      // Get userId from cookies (fallback to request body for testing)
      const { getUserIdFromCookies } = await import('@/lib/cookie-auth')
      const cookieUserId = getUserIdFromCookies(request)
      const userId = cookieUserId || body.userId || 2
      console.log('[DEBUG] Using userId from cookies/request:', userId, 'cookieUserId:', cookieUserId)

      // Create or get conversation
      let conversation
      if (conversationId) {
        conversation = await prisma.conversation.findFirst({
          where: { id: conversationId, userId }
        })
        if (!conversation) {
          return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }
      } else {
        // Create new conversation
        conversation = await prisma.conversation.create({
          data: {
            userId,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
          }
        })
      }

      // Get comprehensive user data
      const [userData, mealsData, metricsData] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            email: true,
            age: true,
            heightCm: true,
            weightKg: true,
            gender: true,
            createdAt: true
          }
        }),
        prisma.meal.findMany({
          where: { userId: parseInt(userId) },
          orderBy: { recordedAt: 'desc' },
          take: 10,
          select: {
            mealName: true,
            calories: true,
            protein: true,
            carbs: true,
            fat: true,
            createdAt: true
          }
        }),
        prisma.metric.findMany({
          where: { userId: parseInt(userId) },
          orderBy: { recordedAt: 'desc' },
          take: 20,
          select: {
            type: true,
            value: true,
            unit: true,
            recordedAt: true
          }
        })
      ])

      // Build comprehensive user context
      const userContext = {
        name: userData?.name || 'User',
        profile: {
          age: userData?.age,
          height: userData?.heightCm ? `${userData.heightCm}cm` : null,
          weight: userData?.weightKg ? `${userData.weightKg}kg` : null,
          gender: userData?.gender,
          memberSince: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : null
        },
        recentMeals: mealsData?.map(meal => ({
          name: meal.mealName,
          calories: meal.calories,
          protein: meal.protein,
          date: new Date(meal.createdAt).toLocaleDateString()
        })) || [],
        healthMetrics: metricsData?.reduce((acc: any, metric) => {
          acc[metric.type] = { value: metric.value, unit: metric.unit, date: new Date(metric.recordedAt).toLocaleDateString() }
          return acc
        }, {}) || {}
      }

      // Build personalized system prompt
      const systemPrompt = `You are ${userData?.name || 'User'}'s personal AI fitness coach and nutritionist.

User Profile:
- Name: ${userData?.name || 'User'}
- Age: ${userData?.age || 'Not specified'}
- Height: ${userData?.heightCm ? userData.heightCm + 'cm' : 'Not specified'}
- Weight: ${userData?.weightKg ? userData.weightKg + 'kg' : 'Not specified'}
- Gender: ${userData?.gender || 'Not specified'}
- Member since: ${userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Recently'}

Recent Health Data:
${Object.entries(userContext.healthMetrics).map(([type, data]: [string, any]) => 
  `- ${type}: ${data.value} ${data.unit} (${data.date})`
).join('\n')}

Recent Meals:
${userContext.recentMeals.slice(0, 5).map((meal: any) => 
  `- ${meal.name}: ${meal.calories || 'Unknown'} calories (${meal.date})`
).join('\n')}

Instructions:
- Always address the user by their name (${userData?.name || 'User'})
- Reference their specific health data and progress
- Provide personalized advice based on their metrics and goals
- Be encouraging and supportive about their fitness journey
- Keep responses conversational but informative
- Remember previous conversations and build on them`

      // Call OpenRouter API for coaching response
      // Try models in order of preference (fallback if privacy settings block one)
      const models = [
        "deepseek/deepseek-chat-v3.1:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "google/gemini-flash-1.5:free",
        "anthropic/claude-3-haiku", // Requires credits but works with privacy settings
      ]

      let lastError: any = null
      let data: any = null
      let response: Response | null = null

      // Try each model until one works
      for (const model of models) {
        try {
          response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", // Optional for analytics
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message },
              ],
              max_tokens: 200,
              temperature: 0.7,
            }),
          })

          data = await response.json()

          if (response.ok && data.choices?.[0]?.message?.content) {
            // Success! Use this model
            break
          }

          // Check if it's a privacy/data policy error
          if (data.error?.code === 404 && data.error?.message?.includes("data policy")) {
            lastError = data
            console.warn(`[OpenRouter] Model ${model} blocked by privacy settings, trying next...`)
            continue // Try next model
          }

          // Other error - log and try next
          lastError = data
          console.warn(`[OpenRouter] Model ${model} failed:`, data.error?.message)
          continue
        } catch (err) {
          lastError = err
          continue
        }
      }

      // ✅ Handle failed API responses gracefully
      if (!response || !response.ok || !data?.choices?.[0]?.message?.content) {
        console.error("OpenRouter API error (all models failed):", lastError)
        
        // Provide helpful error message
        const errorMessage = lastError?.error?.message || "Failed to connect to AI service"
        const isPrivacyError = errorMessage.includes("data policy") || errorMessage.includes("privacy")
        
        return NextResponse.json(
          {
            error: isPrivacyError
              ? "OpenRouter privacy settings need configuration. Please visit https://openrouter.ai/settings/privacy and enable free models."
              : "AI service temporarily unavailable. Please try again.",
            details: isPrivacyError ? {
              message: "Configure your OpenRouter privacy settings to allow free models.",
              url: "https://openrouter.ai/settings/privacy",
              code: lastError?.error?.code,
            } : lastError,
          },
          { status: 500 }
        )
      }

      const coachResponse = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."

      return NextResponse.json({
        success: true,
        conversation: {
          coachMessage: coachResponse
        },
        conversationId: conversation?.id
      })
    } catch (error) {
      console.error("[v0] Coach message error:", error)
      return NextResponse.json(
        { error: "Failed to generate coach message", details: error },
        { status: 500 }
      )
    }
  }
