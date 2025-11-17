import { type NextRequest, NextResponse } from "next/server"
import { getMetricsByUserPrisma, getMetricsByTypePrisma, createMetricPrisma } from "@/lib/prisma-helpers"
import { verifyToken } from "@/lib/security"
import { verifyResourceOwnership } from "@/lib/auth-helpers"
import { logAuditEvent } from "@/lib/audit-log"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    const metricType = request.nextUrl.searchParams.get("type")
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
            details: { endpoint: 'GET /health/metrics', attemptedUserId: userId },
            severity: 'ERROR',
          })
          return NextResponse.json({ error: "Unauthorized: You can only access your own metrics" }, { status: 403 })
        }
      }
    }

    // Security: Log data access
    logAuditEvent('DATA_ACCESS', {
      userId: tokenUserId.toString(),
      ip: request.headers.get('x-forwarded-for') || undefined,
      details: { resource: 'health_metrics', type: metricType || 'all' },
      severity: 'INFO',
    })

    // Get metrics from database (Prisma + MySQL)
    const metrics = metricType
      ? await getMetricsByTypePrisma(tokenUserId, metricType, 100)
      : await getMetricsByUserPrisma(tokenUserId, 100)

    return NextResponse.json({
      success: true,
      metrics: metrics.map((m) => ({
        id: m.id,
        userId: m.userId,
        type: m.type,
        value: m.value,
        unit: m.unit,
        createdAt: m.createdAt.toISOString(),
        recordedAt: m.recordedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[API] Metrics retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve metrics" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { userId, type, value, unit } = body
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!userId || !type || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Security: Require authentication
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      logAuditEvent('UNAUTHORIZED_ACCESS', {
        ip: request.headers.get('x-forwarded-for') || undefined,
        details: { endpoint: 'POST /health/metrics', reason: 'Invalid token' },
        severity: 'WARNING',
      })
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Security: Verify resource ownership (user can only create metrics for themselves)
    const tokenUserId = parseInt(decoded.userId, 10)
    const requestUserId = parseInt(userId, 10)
    
    if (tokenUserId !== requestUserId) {
      logAuditEvent('UNAUTHORIZED_ACCESS', {
        userId: decoded.userId,
        ip: request.headers.get('x-forwarded-for') || undefined,
        details: { endpoint: 'POST /health/metrics', attemptedUserId: userId },
        severity: 'ERROR',
      })
      return NextResponse.json({ error: "Unauthorized: You can only create metrics for yourself" }, { status: 403 })
    }

    // Security: Sanitize input
    type = String(type).trim().toLowerCase()
    unit = unit ? String(unit).trim() : 'unknown'

    // Validate metric type
    const validTypes = ["steps", "calories", "sleep", "heart_rate", "water", "exercise", "blood_pressure"]
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid metric type" }, { status: 400 })
    }

    // Validate value
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      return NextResponse.json({ error: "Invalid metric value" }, { status: 400 })
    }

    // Store metric in database (Prisma + MySQL)
    const metric = await createMetricPrisma({
      userId: tokenUserId,
      type,
      value,
      unit: unit || "unknown",
    })

    // Security: Log data modification
    logAuditEvent('DATA_MODIFY', {
      userId: decoded.userId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      details: { resource: 'health_metrics', action: 'create', metricType: type },
      severity: 'INFO',
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log("[API] Metric stored:", metric.id)
    }

    return NextResponse.json({
      success: true,
      metric: {
        id: metric.id,
        userId: metric.userId,
        type: metric.type,
        value: metric.value,
        unit: metric.unit,
        createdAt: metric.createdAt.toISOString(),
        recordedAt: metric.recordedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("[API] Metric storage error:", error)
    return NextResponse.json({ error: "Failed to store metric" }, { status: 500 })
  }
}
