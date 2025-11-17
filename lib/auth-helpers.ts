/**
 * Authentication Helpers
 * Account lockout, failed login tracking, and ownership verification
 */

import { logAuditEvent, countFailedLogins } from './audit-log'
import { getUserById } from './db-helpers'

// Track locked accounts (in production, use Redis or database)
const lockedAccounts = new Map<string, { lockedUntil: number; reason: string }>()

/**
 * Check if account is locked
 */
export function isAccountLocked(userIdOrEmail: string): { locked: boolean; reason?: string; lockedUntil?: Date } {
  const lockInfo = lockedAccounts.get(userIdOrEmail)
  
  if (!lockInfo) {
    return { locked: false }
  }

  // Check if lock has expired
  if (Date.now() >= lockInfo.lockedUntil) {
    lockedAccounts.delete(userIdOrEmail)
    return { locked: false }
  }

  return {
    locked: true,
    reason: lockInfo.reason,
    lockedUntil: new Date(lockInfo.lockedUntil),
  }
}

/**
 * Lock account after multiple failed login attempts
 */
export function lockAccount(
  identifier: string,
  reason: string = 'Multiple failed login attempts',
  durationMs: number = 30 * 60 * 1000 // 30 minutes
): void {
  lockedAccounts.set(identifier, {
    lockedUntil: Date.now() + durationMs,
    reason,
  })

  logAuditEvent('ACCOUNT_LOCKED', {
    userId: identifier.includes('@') ? undefined : identifier,
    details: { reason, durationMinutes: durationMs / 60000 },
    severity: 'ERROR',
  })
}

/**
 * Unlock account manually (for admin use)
 */
export function unlockAccount(identifier: string): void {
  lockedAccounts.delete(identifier)
}

/**
 * Check failed login attempts and lock if threshold exceeded
 * Security: Locks after 5 failed attempts in 15 minutes
 */
export function checkAndLockOnFailedLogin(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { shouldLock: boolean; attempts: number } {
  const attempts = countFailedLogins(identifier, windowMs)

  if (attempts >= maxAttempts) {
    lockAccount(identifier, `Exceeded ${maxAttempts} failed login attempts in ${windowMs / 60000} minutes`)
    return { shouldLock: true, attempts }
  }

  return { shouldLock: false, attempts }
}

/**
 * Verify resource ownership
 * Security: Ensures users can only access their own resources
 */
export function verifyResourceOwnership(
  userId: string,
  resourceUserId: string | null | undefined,
  resourceName: string = 'resource'
): { authorized: boolean; error?: string } {
  if (!resourceUserId) {
    return {
      authorized: false,
      error: `${resourceName} not found`,
    }
  }

  if (resourceUserId !== userId) {
    logAuditEvent('UNAUTHORIZED_ACCESS', {
      userId,
      details: {
        attemptedAccess: resourceUserId,
        resource: resourceName,
      },
      severity: 'ERROR',
    })

    return {
      authorized: false,
      error: 'Unauthorized: You can only access your own resources',
    }
  }

  return { authorized: true }
}

/**
 * Get user ID from request (authenticated or from token)
 */
export function getUserIdFromRequest(
  request: { headers: { get: (name: string) => string | null } },
  fallbackUserId?: string
): { userId: string | null; authenticated: boolean } {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: fallbackUserId || null, authenticated: false }
  }

  // Token verification should be done before calling this
  // This just extracts the userId if available
  return { userId: fallbackUserId || null, authenticated: !!authHeader }
}

/**
 * Require authentication middleware helper
 */
export function requireAuth(
  userId: string | null | undefined,
  requestUserId?: string
): { authorized: boolean; error?: string } {
  if (!userId && !requestUserId) {
    return {
      authorized: false,
      error: 'Authentication required',
    }
  }

  // If both provided, verify ownership
  if (userId && requestUserId && userId !== requestUserId) {
    return {
      authorized: false,
      error: 'Unauthorized: You can only access your own resources',
    }
  }

  return { authorized: true }
}




