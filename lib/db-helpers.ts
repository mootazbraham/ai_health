import { dbQueries } from "./db"
import crypto from "crypto"
import { hashPassword, verifyPassword } from "./security"

// User helpers
export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface CreateUserInput {
  email: string
  password: string
  name: string
}

export function createUser(input: CreateUserInput): User {
  const id = crypto.randomUUID()
  const passwordHash = hashPassword(input.password)

  dbQueries.createUser.run(id, input.email, passwordHash, input.name)

  return {
    id,
    email: input.email,
    name: input.name,
    created_at: new Date().toISOString(),
  }
}

export function getUserByEmail(email: string) {
  return dbQueries.getUserByEmail.get(email) as
    | { id: string; email: string; password_hash: string; name: string; created_at: string }
    | undefined
}

export function getUserById(id: string): User | null {
  const user = dbQueries.getUserById.get(id) as User | undefined
  return user || null
}

export function authenticateUser(email: string, password: string): User | null {
  const user = getUserByEmail(email)
  if (!user) return null

  if (verifyPassword(password, user.password_hash)) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
    }
  }

  return null
}

// Health metrics helpers
export interface HealthMetric {
  id: string
  user_id: string
  type: string
  value: number
  unit: string
  recorded_at: string
  created_at: string
}

export interface CreateMetricInput {
  userId: string
  type: string
  value: number
  unit: string
  recordedAt?: string
}

export function createMetric(input: CreateMetricInput): HealthMetric {
  const id = crypto.randomUUID()
  const recordedAt = input.recordedAt || new Date().toISOString()

  dbQueries.insertMetric.run(id, input.userId, input.type, input.value, input.unit, recordedAt)

  return {
    id,
    user_id: input.userId,
    type: input.type,
    value: input.value,
    unit: input.unit,
    recorded_at: recordedAt,
    created_at: new Date().toISOString(),
  }
}

export function getMetricsByUser(userId: string, limit: number = 100): HealthMetric[] {
  return (dbQueries.getMetricsByUser.all(userId, limit) as HealthMetric[]) || []
}

export function getMetricsByType(userId: string, type: string, limit: number = 100): HealthMetric[] {
  return (dbQueries.getMetricsByUserAndType.all(userId, type, limit) as HealthMetric[]) || []
}

// Meal helpers
export interface Meal {
  id: string
  user_id: string
  meal_name: string | null
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
  image_url: string | null
  image_path: string | null
  ai_analysis: string | null
  classification: string | null
  assessment: string | null
  recommendation: string | null
  logged_at: string
  created_at: string
}

export interface CreateMealInput {
  userId: string
  mealName?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  imageUrl?: string
  imagePath?: string
  aiAnalysis?: string
  classification?: string
  assessment?: string
  recommendation?: string
}

export function createMeal(input: CreateMealInput): Meal {
  const id = crypto.randomUUID()

  // Verify user exists, if not create demo user
  const user = getUserById(input.userId)
  if (!user) {
    console.warn(`[DB] User ${input.userId} not found for meal creation, creating demo user`)
    const demoUser = getOrCreateDemoUser()
    input.userId = demoUser.id
  }

  dbQueries.insertMeal.run(
    id,
    input.userId,
    input.mealName || null,
    input.calories || null,
    input.protein || null,
    input.carbs || null,
    input.fat || null,
    input.fiber || null,
    input.imageUrl || null,
    input.imagePath || null,
    input.aiAnalysis || null,
    input.classification || null,
    input.assessment || null,
    input.recommendation || null
  )

  return {
    id,
    user_id: input.userId,
    meal_name: input.mealName || null,
    calories: input.calories || null,
    protein: input.protein || null,
    carbs: input.carbs || null,
    fat: input.fat || null,
    fiber: input.fiber || null,
    image_url: input.imageUrl || null,
    image_path: input.imagePath || null,
    ai_analysis: input.aiAnalysis || null,
    classification: input.classification || null,
    assessment: input.assessment || null,
    recommendation: input.recommendation || null,
    logged_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
}

export function getMealsByUser(userId: string, limit: number = 50): Meal[] {
  return (dbQueries.getMealsByUser.all(userId, limit) as Meal[]) || []
}

export function getMealById(mealId: string, userId: string): Meal | null {
  const meal = dbQueries.getMealById.get(mealId, userId) as Meal | undefined
  return meal || null
}

// Coaching history helpers
export interface CoachingSession {
  id: string
  user_id: string
  user_message: string
  coach_response: string
  user_health_data: string | null
  created_at: string
}

export interface CreateCoachingSessionInput {
  userId: string
  userMessage: string
  coachResponse: string
  userHealthData?: any
}

/**
 * Get or create a demo user for development/testing
 * Security: Only allowed in non-production environments
 */
export function getOrCreateDemoUser(): User {
  // Security: Never create demo users in production
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      "[SECURITY] Demo user creation is not allowed in production. " +
      "All requests must be authenticated with valid user credentials."
    )
  }

  // Try to get existing demo user
  const demoUser = getUserByEmail("demo@vitalis.app")
  
  if (demoUser) {
    return {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      created_at: demoUser.created_at,
    }
  }

  // Create demo user if it doesn't exist (dev/test only)
  // Security: Use environment variable for demo password or generate random
  const demoPassword = process.env.DEMO_USER_PASSWORD || crypto.randomBytes(16).toString('hex')
  
  return createUser({
    email: "demo@vitalis.app",
    password: demoPassword,
    name: "Demo User",
  })
}

export function createCoachingSession(input: CreateCoachingSessionInput): CoachingSession {
  const id = crypto.randomUUID()

  // Verify user exists, if not create demo user
  const user = getUserById(input.userId)
  if (!user) {
    console.warn(`[DB] User ${input.userId} not found, creating demo user`)
    const demoUser = getOrCreateDemoUser()
    input.userId = demoUser.id
  }

  dbQueries.insertCoachingSession.run(
    id,
    input.userId,
    input.userMessage,
    input.coachResponse,
    input.userHealthData ? JSON.stringify(input.userHealthData) : null
  )

  return {
    id,
    user_id: input.userId,
    user_message: input.userMessage,
    coach_response: input.coachResponse,
    user_health_data: input.userHealthData ? JSON.stringify(input.userHealthData) : null,
    created_at: new Date().toISOString(),
  }
}

export function getCoachingHistory(userId: string, limit: number = 50): CoachingSession[] {
  return (dbQueries.getCoachingHistory.all(userId, limit) as CoachingSession[]) || []
}

