import { type NextRequest, NextResponse } from "next/server"
import { createUserWithPrisma, getUserByEmailPrisma } from "@/lib/prisma-helpers"
import { generateToken, isValidEmail, sanitizeInput } from "@/lib/security"
import { logAuditEvent } from "@/lib/audit-log"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { email, password, name } = body

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Security: Sanitize inputs
    email = sanitizeInput(email.trim().toLowerCase())
    name = sanitizeInput(name.trim())
    password = password.trim() // Don't sanitize password (preserve special chars)

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Security: Enforce strong password policy
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Security: Require password complexity (uppercase, lowercase, number, special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json({
        error: "Password must contain at least 8 characters including: uppercase letter, lowercase letter, number, and special character (@$!%*?&)"
      }, { status: 400 })
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Name must be between 2 and 100 characters" }, { status: 400 })
    }

    // Check if user already exists (Prisma + MySQL)
    const existingUser = await getUserByEmailPrisma(email)
    if (existingUser) {
      logAuditEvent('AUTH_REGISTER', {
        userId: email,
        ip: request.headers.get('x-forwarded-for') || undefined,
        details: { reason: 'Email already registered' },
        severity: 'WARNING',
      })

      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // Create user in database (Prisma + MySQL)
    const user = await createUserWithPrisma({ email, password, name })
    const token = generateToken(user.id.toString()) // Convert to string for JWT

    // Security: Log successful registration
    logAuditEvent('AUTH_REGISTER', {
      userId: user.id.toString(),
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      severity: 'INFO',
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log("[API] User registered:", user.id)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
      message: "Registration successful",
    })
  } catch (error) {
    console.error("[API] Registration error:", error)
    logAuditEvent('AUTH_REGISTER', {
      ip: request.headers.get('x-forwarded-for') || undefined,
      details: { error: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error' },
      severity: 'ERROR',
    })
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
