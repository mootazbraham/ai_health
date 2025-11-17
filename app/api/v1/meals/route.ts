/**
 * GET /api/v1/meals - Fetch user's meals
 */

import { type NextRequest, NextResponse } from "next/server"
import { getMealsByUserPrisma } from "@/lib/prisma-helpers"
import { verifyToken } from "@/lib/security"
import { logAuditEvent } from "@/lib/audit-log"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Security: Try authentication, fallback to userId for development
    let tokenUserId = parseInt(userId, 10)
    
    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        tokenUserId = parseInt(decoded.userId, 10)
        // Verify resource ownership if authenticated
        if (tokenUserId !== parseInt(userId, 10)) {
          logAuditEvent('UNAUTHORIZED_ACCESS', {
            userId: decoded.userId,
            ip: request.headers.get('x-forwarded-for') || undefined,
            details: { endpoint: 'GET /meals', attemptedUserId: userId },
            severity: 'ERROR',
          })
          return NextResponse.json({ error: "Unauthorized: You can only access your own meals" }, { status: 403 })
        }
      }
    }

    // Security: Log data access
    logAuditEvent('DATA_ACCESS', {
      userId: tokenUserId.toString(),
      ip: request.headers.get('x-forwarded-for') || undefined,
      details: { resource: 'meals' },
      severity: 'INFO',
    })

    // Get meals from database (Prisma + MySQL)
    const meals = await getMealsByUserPrisma(tokenUserId, 100)

    return NextResponse.json({
      success: true,
      meals: meals.map((meal) => ({
        id: meal.id,
        userId: meal.userId,
        mealName: meal.mealName,
        imageUrl: meal.imageUrl,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: meal.fiber,
        aiAnalysis: meal.aiAnalysis,
        classification: meal.classification,
        assessment: meal.assessment,
        recommendation: meal.recommendation,
        createdAt: meal.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[API] Meals retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve meals" }, { status: 500 })
  }
}




