/**
 * Centralized error handling
 */

import { NextResponse } from "next/server"
import { logger } from "./logger"

export interface AppError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export class ValidationError extends Error implements AppError {
  statusCode = 400
  code = "VALIDATION_ERROR"

  constructor(message: string, public details?: any) {
    super(message)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401
  code = "AUTHENTICATION_ERROR"

  constructor(message: string = "Unauthorized") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404
  code = "NOT_FOUND"

  constructor(message: string = "Resource not found") {
    super(message)
    this.name = "NotFoundError"
  }
}

export class RateLimitError extends Error implements AppError {
  statusCode = 429
  code = "RATE_LIMIT_EXCEEDED"

  constructor(message: string = "Too many requests") {
    super(message)
    this.name = "RateLimitError"
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown, context?: { userId?: string; endpoint?: string }) {
  if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof NotFoundError || error instanceof RateLimitError) {
    logger.warn(error.message, { code: error.code, details: error.details }, context)
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    logger.error("Unhandled error", error, context)
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }

  logger.error("Unknown error", error, context)
  return NextResponse.json(
    {
      error: "Internal server error",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  )
}

/**
 * Async error handler wrapper
 */
export function asyncHandler(
  handler: (request: Request) => Promise<NextResponse>,
  context?: { endpoint?: string }
) {
  return async (request: Request) => {
    try {
      return await handler(request)
    } catch (error) {
      return handleApiError(error, context)
    }
  }
}

/**
 * Validate and sanitize input
 */
export function validateInput<T>(input: any, schema: {
  [K in keyof T]?: {
    required?: boolean
    type?: string
    min?: number
    max?: number
    pattern?: RegExp
  }
}): { valid: boolean; data?: T; errors?: string[] } {
  const errors: string[] = []
  const data: any = {}

  for (const [key, rules] of Object.entries(schema)) {
    const value = input[key]

    if (rules?.required && (value === undefined || value === null || value === "")) {
      errors.push(`${key} is required`)
      continue
    }

    if (value !== undefined && value !== null) {
      if (rules?.type && typeof value !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`)
        continue
      }

      if (typeof value === "number") {
        if (rules?.min !== undefined && value < rules.min) {
          errors.push(`${key} must be at least ${rules.min}`)
        }
        if (rules?.max !== undefined && value > rules.max) {
          errors.push(`${key} must be at most ${rules.max}`)
        }
      }

      if (typeof value === "string" && rules?.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} format is invalid`)
        continue
      }

      data[key] = value
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, data: data as T }
}


