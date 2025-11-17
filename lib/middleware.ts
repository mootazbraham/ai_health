/**
 * API Middleware utilities
 * JWT authentication, rate limiting, input validation
 */

import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "./security"
import { createRateLimiter } from "./security"

// Rate limiters for different endpoints
const authRateLimiter = createRateLimiter(5, 60 * 1000) // 5 requests per minute
const apiRateLimiter = createRateLimiter(100, 60 * 60 * 1000) // 100 requests per hour
const aiRateLimiter = createRateLimiter(20, 60 * 60 * 1000) // 20 requests per hour

/**
 * Authenticate request using JWT token
 */
export function authenticateRequest(request: NextRequest): { userId: string } | null {
  const authHeader = request.headers.get("authorization")
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.replace("Bearer ", "")
  const decoded = verifyToken(token)

  if (!decoded || !decoded.userId) {
    return null
  }

  return { userId: decoded.userId }
}

/**
 * Create authenticated route handler wrapper
 */
export function withAuth(
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = authenticateRequest(request)
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return handler(request, auth.userId)
  }
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: ReturnType<typeof createRateLimiter>,
  identifierKey: string = "ip"
) {
  return async (request: NextRequest) => {
    // Get identifier (IP address or user ID)
    let identifier = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || "unknown"
    
    if (identifierKey === "user") {
      const auth = authenticateRequest(request)
      identifier = auth?.userId || identifier
    }

    if (limiter(identifier)) {
      const response = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
      return addSecurityHeaders(addCorsHeaders(response))
    }

    return handler(request)
  }
}

/**
 * Sanitize input helper (re-export from security for convenience)
 */
export { sanitizeInput } from "./security"

/**
 * CORS headers middleware
 * Security: Strict CORS policy in production
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || (process.env.NODE_ENV === 'production' ? undefined : '*')
  
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin)
  }
  
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set("Access-Control-Max-Age", "86400")

  return response
}

/**
 * Add security headers (CSP, HSTS, etc.)
 * Security: Production-grade security headers
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://openrouter.ai https://*.amazonaws.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")
  
  response.headers.set("Content-Security-Policy", csp)
  
  // HTTP Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }
  
  // X-Frame-Options
  response.headers.set("X-Frame-Options", "DENY")
  
  // X-Content-Type-Options
  response.headers.set("X-Content-Type-Options", "nosniff")
  
  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  
  // Permissions Policy (formerly Feature Policy)
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
  
  return response
}

/**
 * Enforce HTTPS in production
 */
export function enforceHttps(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto') || request.url.split('://')[0]
    if (protocol !== 'https') {
      const url = new URL(request.url)
      url.protocol = 'https'
      return NextResponse.redirect(url.toString(), 301)
    }
  }
  return null
}

/**
 * Handle OPTIONS requests for CORS
 */
export function handleOptions(): NextResponse {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}

/**
 * Validate request body schema
 */
export function validateRequest<T>(
  body: any,
  schema: {
    required?: string[]
    types?: Record<string, string>
    minLength?: Record<string, number>
    maxLength?: Record<string, number>
  }
): { valid: boolean; error?: string; data?: T } {
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return { valid: false, error: `Missing required field: ${field}` }
      }
    }
  }

  // Check types
  if (schema.types) {
    for (const [field, type] of Object.entries(schema.types)) {
      if (body[field] !== undefined && typeof body[field] !== type) {
        return { valid: false, error: `Invalid type for ${field}: expected ${type}` }
      }
    }
  }

  // Check lengths
  if (schema.minLength) {
    for (const [field, min] of Object.entries(schema.minLength)) {
      if (body[field] && String(body[field]).length < min) {
        return { valid: false, error: `${field} must be at least ${min} characters` }
      }
    }
  }

  if (schema.maxLength) {
    for (const [field, max] of Object.entries(schema.maxLength)) {
      if (body[field] && String(body[field]).length > max) {
        return { valid: false, error: `${field} must be at most ${max} characters` }
      }
    }
  }

  return { valid: true, data: body as T }
}

/**
 * Error handler wrapper
 * Security: Apply security headers to all responses
 */
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Enforce HTTPS in production
      const httpsRedirect = enforceHttps(request)
      if (httpsRedirect) return httpsRedirect
      
      const response = await handler(request)
      const withCors = addCorsHeaders(response)
      const withSecurity = addSecurityHeaders(withCors)
      return withSecurity
    } catch (error) {
      console.error("[Middleware] Error:", error)
      
      const errorResponse = NextResponse.json(
        {
          error: "Internal server error",
          message: process.env.NODE_ENV === 'production' 
            ? "An error occurred" 
            : (error instanceof Error ? error.message : "Unknown error"),
        },
        { status: 500 }
      )
      return addSecurityHeaders(addCorsHeaders(errorResponse))
    }
  }
}

