import { type NextRequest, NextResponse } from "next/server"
import { verifyUserPassword } from "@/lib/prisma-helpers"
import { generateToken, sanitizeInput, isValidEmail, createRateLimiter } from "@/lib/security"
import { logAuditEvent } from "@/lib/audit-log"
import { isAccountLocked, checkAndLockOnFailedLogin } from "@/lib/auth-helpers"

// Security: Rate limiter for auth endpoints (5 attempts per minute)
const authRateLimiter = createRateLimiter(5, 60 * 1000)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 })
    }

    // Security: Sanitize input
    email = sanitizeInput(email.trim().toLowerCase())
    password = password.trim() // Don't sanitize password (preserve special chars)

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Security: Check if account is locked
    const lockStatus = isAccountLocked(email)
    if (lockStatus.locked) {
      logAuditEvent('AUTH_LOGIN_FAILED', {
        userId: email,
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        details: { reason: 'Account locked', lockedUntil: lockStatus.lockedUntil },
        severity: 'WARNING',
      })

      return NextResponse.json({
        error: `Account locked: ${lockStatus.reason}. Try again after ${lockStatus.lockedUntil?.toLocaleTimeString()}`,
      }, { status: 423 }) // 423 Locked
    }

    // Security: Apply rate limiting to prevent brute force attacks
    const identifier = request.headers.get('x-forwarded-for')?.split(',')[0] || email
    if (authRateLimiter(identifier)) {
      logAuditEvent('RATE_LIMIT_EXCEEDED', {
        userId: email,
        ip: request.headers.get('x-forwarded-for') || undefined,
        details: { endpoint: 'login' },
        severity: 'WARNING',
      })

      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      )
    }

    // Authenticate user against database (Prisma + MySQL)
    const user = await verifyUserPassword(email, password)

    if (!user) {
      // Security: Log failed login attempt
      logAuditEvent('AUTH_LOGIN_FAILED', {
        userId: email,
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        severity: 'WARNING',
      })

      // Security: Check and lock account if threshold exceeded
      const lockCheck = checkAndLockOnFailedLogin(identifier)
      if (lockCheck.shouldLock) {
        return NextResponse.json({
          error: `Account locked due to ${lockCheck.attempts} failed login attempts. Please try again in 30 minutes.`,
        }, { status: 423 })
      }

      // Security: Don't reveal whether email exists (prevent user enumeration)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Security: Generate token with shorter expiration (30 min default)
    // Convert user.id to string for JWT (legacy token system expects string)
    const token = generateToken(user.id.toString(), 1800) // 30 minutes

    // Security: Log successful login
    logAuditEvent('AUTH_LOGIN', {
      userId: user.id.toString(),
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      severity: 'INFO',
    })

    // Security: Don't log sensitive info in production
    if (process.env.NODE_ENV !== 'production') {
      console.log("[API] User authenticated:", user.id)
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
      expiresIn: 1800, // 30 minutes
    })
    
    // Set userId cookie for easy access
    response.cookies.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400 // 24 hours
    })
    
    return response
  } catch (error) {
    console.error("[API] Authentication error:", error)
    logAuditEvent('AUTH_LOGIN_FAILED', {
      ip: request.headers.get('x-forwarded-for') || undefined,
      details: { error: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error' },
      severity: 'ERROR',
    })
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
