import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    const metricType = request.nextUrl.searchParams.get("type")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Simulated database query
    const metrics = [
      {
        id: "1",
        userId,
        type: "steps",
        value: 7234,
        unit: "steps",
        timestamp: new Date().toISOString(),
      },
      {
        id: "2",
        userId,
        type: "calories",
        value: 1850,
        unit: "kcal",
        timestamp: new Date().toISOString(),
      },
      {
        id: "3",
        userId,
        type: "sleep",
        value: 7.5,
        unit: "hours",
        timestamp: new Date().toISOString(),
      },
    ]

    const filtered = metricType ? metrics.filter((m) => m.type === metricType) : metrics

    return NextResponse.json({
      success: true,
      metrics: filtered,
    })
  } catch (error) {
    console.error("[v0] Metrics retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve metrics" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, value, unit } = body

    if (!userId || !type || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate metric type
    const validTypes = ["steps", "calories", "sleep", "heart_rate", "water", "exercise"]
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid metric type" }, { status: 400 })
    }

    // Store metric (simulated)
    const metric = {
      id: Date.now().toString(),
      userId,
      type,
      value,
      unit,
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Metric stored:", metric)

    return NextResponse.json({
      success: true,
      metric,
    })
  } catch (error) {
    console.error("[v0] Metric storage error:", error)
    return NextResponse.json({ error: "Failed to store metric" }, { status: 500 })
  }
}
