/**
 * Security Module Tests
 * Tests for encryption, hashing, JWT, and validation functions
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  sanitizeInput,
  isValidEmail,
} from '@/lib/security'

// Mock environment variables
const originalEnv = process.env

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long'
  process.env.JWT_SECRET = 'test-jwt-secret-key-32-characters-long'
})

describe('Password Hashing', () => {
  it('should hash password and verify correctly', () => {
    const password = 'TestPassword123!'
    const hash = hashPassword(password)
    
    expect(hash).toContain(':')
    expect(hash.split(':').length).toBeGreaterThanOrEqual(2)
    
    const isValid = verifyPassword(password, hash)
    expect(isValid).toBe(true)
  })

  it('should reject incorrect password', () => {
    const password = 'TestPassword123!'
    const hash = hashPassword(password)
    
    const isValid = verifyPassword('WrongPassword123!', hash)
    expect(isValid).toBe(false)
  })

  it('should support backwards compatibility with old hash format', () => {
    // Old format: salt:hash (no iterations)
    const oldHash = 'salt123:hash456'
    // This should not throw and should default to 1000 iterations
    expect(() => verifyPassword('test', oldHash)).not.toThrow()
  })
})

describe('JWT Tokens', () => {
  it('should generate and verify token', () => {
    const userId = 'user-123'
    const token = generateToken(userId)
    
    expect(token).toBeDefined()
    expect(token.split('.').length).toBe(3) // header.payload.signature
    
    const decoded = verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded?.userId).toBe(userId)
  })

  it('should reject invalid token', () => {
    const invalidToken = 'invalid.token.here'
    const decoded = verifyToken(invalidToken)
    expect(decoded).toBeNull()
  })

  it('should reject expired token', () => {
    const userId = 'user-123'
    // Generate token with 1 second expiration
    const token = generateToken(userId, 1)
    
    // Wait for expiration
    return new Promise((resolve) => {
      setTimeout(() => {
        const decoded = verifyToken(token)
        expect(decoded).toBeNull()
        resolve(undefined)
      }, 2000)
    })
  })
})

describe('Input Sanitization', () => {
  it('should sanitize XSS attempts', () => {
    const malicious = '<script>alert("xss")</script>'
    const sanitized = sanitizeInput(malicious)
    
    expect(sanitized).not.toContain('<script>')
    expect(sanitized).toContain('&lt;script&gt;')
  })

  it('should sanitize SQL injection attempts', () => {
    const malicious = "'; DROP TABLE users; --"
    const sanitized = sanitizeInput(malicious)
    
    expect(sanitized).not.toContain("'")
  })
})

describe('Email Validation', () => {
  it('should validate correct email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('test.user@example.co.uk')).toBe(true)
  })

  it('should reject invalid email formats', () => {
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
  })
})




