/**
 * Authentication API Tests
 * Integration tests for login and registration endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { POST as loginPOST } from '@/app/api/v1/auth/login/route'
import { POST as registerPOST } from '@/app/api/v1/auth/register/route'
import { NextRequest } from 'next/server'

// Mock environment
beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long'
  process.env.JWT_SECRET = 'test-jwt-secret-key-32-characters-long'
  process.env.NODE_ENV = 'test'
})

describe('Registration API', () => {
  it('should register new user successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await registerPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.email).toBe('test@example.com')
    expect(data.token).toBeDefined()
  })

  it('should reject weak password', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test2@example.com',
        password: 'weak',
        name: 'Test User',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await registerPOST(request)
    expect(response.status).toBe(400)
  })

  it('should reject invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'TestPassword123!',
        name: 'Test User',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await registerPOST(request)
    expect(response.status).toBe(400)
  })
})

describe('Login API', () => {
  it('should login with correct credentials', async () => {
    // First register
    const registerReq = new NextRequest('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'login-test@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    await registerPOST(registerReq)

    // Then login
    const loginReq = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'login-test@example.com',
        password: 'TestPassword123!',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await loginPOST(loginReq)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.token).toBeDefined()
  })

  it('should reject incorrect credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await loginPOST(request)
    expect(response.status).toBe(401)
  })
})




