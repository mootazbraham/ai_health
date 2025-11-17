/**
 * Audit Logging System
 * Logs security events and user actions for compliance and debugging
 */

interface AuditEvent {
  type: 'AUTH_LOGIN' | 'AUTH_LOGIN_FAILED' | 'AUTH_LOGOUT' | 'AUTH_REGISTER' | 
        'DATA_ACCESS' | 'DATA_MODIFY' | 'ACCOUNT_LOCKED' | 'RATE_LIMIT_EXCEEDED' |
        'UNAUTHORIZED_ACCESS' | 'PASSWORD_CHANGE' | 'TOKEN_EXPIRED' | 'ADMIN_ACTION'
  userId?: string
  ip?: string
  userAgent?: string
  details?: Record<string, any>
  timestamp: string
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
}

// In-memory store for development (replace with database in production)
const auditLog: AuditEvent[] = []

/**
 * Log an audit event
 * Security: Filters PII, only logs necessary information
 */
export function logAuditEvent(
  type: AuditEvent['type'],
  options: {
    userId?: string
    ip?: string
    userAgent?: string
    details?: Record<string, any>
    severity?: AuditEvent['severity']
  } = {}
): void {
  // Security: Don't log PII in production (emails, full names, etc.)
  const sanitizedDetails = process.env.NODE_ENV === 'production'
    ? sanitizeDetails(options.details || {})
    : options.details

  const event: AuditEvent = {
    type,
    userId: options.userId,
    ip: options.ip,
    userAgent: options.userAgent?.substring(0, 200), // Limit length
    details: sanitizedDetails,
    timestamp: new Date().toISOString(),
    severity: options.severity || getDefaultSeverity(type),
  }

  // In production, send to logging service (CloudWatch, ELK, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to CloudWatch, ELK, or other logging service
    console.log('[AUDIT]', JSON.stringify(event))
  } else {
    auditLog.push(event)
    console.log('[AUDIT]', JSON.stringify(event, null, 2))
  }

  // Keep only last 1000 events in memory (dev only)
  if (auditLog.length > 1000) {
    auditLog.shift()
  }
}

/**
 * Sanitize details to remove PII
 */
function sanitizeDetails(details: Record<string, any>): Record<string, any> {
  const sanitized = { ...details }
  
  // Remove sensitive fields
  const sensitiveFields = ['email', 'password', 'token', 'secret', 'key', 'ssn', 'creditCard']
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}

/**
 * Get default severity for event type
 */
function getDefaultSeverity(type: AuditEvent['type']): AuditEvent['severity'] {
  const severityMap: Record<AuditEvent['type'], AuditEvent['severity']> = {
    'AUTH_LOGIN': 'INFO',
    'AUTH_LOGIN_FAILED': 'WARNING',
    'AUTH_LOGOUT': 'INFO',
    'AUTH_REGISTER': 'INFO',
    'DATA_ACCESS': 'INFO',
    'DATA_MODIFY': 'INFO',
    'ACCOUNT_LOCKED': 'ERROR',
    'RATE_LIMIT_EXCEEDED': 'WARNING',
    'UNAUTHORIZED_ACCESS': 'ERROR',
    'PASSWORD_CHANGE': 'INFO',
    'TOKEN_EXPIRED': 'INFO',
    'ADMIN_ACTION': 'WARNING',
  }

  return severityMap[type] || 'INFO'
}

/**
 * Get audit logs (for admin/debugging)
 */
export function getAuditLogs(options: {
  userId?: string
  type?: AuditEvent['type']
  limit?: number
  since?: Date
} = {}): AuditEvent[] {
  let filtered = [...auditLog]

  if (options.userId) {
    filtered = filtered.filter((e) => e.userId === options.userId)
  }

  if (options.type) {
    filtered = filtered.filter((e) => e.type === options.type)
  }

  if (options.since) {
    filtered = filtered.filter((e) => new Date(e.timestamp) >= options.since!)
  }

  // Sort by timestamp (newest first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return filtered.slice(0, options.limit || 100)
}

/**
 * Count failed login attempts for a user/IP
 */
export function countFailedLogins(
  identifier: string,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): number {
  const since = new Date(Date.now() - windowMs)
  
  return auditLog.filter(
    (e) =>
      e.type === 'AUTH_LOGIN_FAILED' &&
      (e.userId === identifier || e.ip === identifier) &&
      new Date(e.timestamp) >= since
  ).length
}




