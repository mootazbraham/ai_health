import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Simulated user lookup and password verification
    const userId = crypto.randomUUID()
    const token = crypto.randomBytes(32).toString("hex")

    // In production, verify password hash against database
    const user = {
      id: userId,
      email,
      name: email.split("@")[0],
    }

    console.log("[v0] User authenticated:", user.id)

    return NextResponse.json({
      success: true,
      user,
      token,
      expiresIn: 86400, // 24 hours
    })
  } catch (error) {
    console.error("[v0] Authentication error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
