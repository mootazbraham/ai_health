/**
 * Prisma Database Helpers
 * User, meal, and metric operations using Prisma
 */

import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// User helpers
export async function createUserWithPrisma(data: {
  email: string
  password: string
  name: string
}) {
  // Hash password using bcrypt
  const passwordHash = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      password: passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })

  return user
}

export async function getUserByEmailPrisma(email: string) {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      createdAt: true,
    },
  })
}

export async function getUserByIdPrisma(userId: number) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })
}

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<{ id: number; email: string; name: string | null } | null> {
  const user = await getUserByEmailPrisma(email)

  if (!user || !user.password) {
    return null
  }

  // Verify password using bcrypt
  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  }
}

// Metrics helpers
export async function createMetricPrisma(data: {
  userId: number
  type: string
  value: number
  unit: string
}) {
  return await prisma.metric.create({
    data: {
      userId: data.userId,
      type: data.type.toLowerCase().trim(),
      value: data.value,
      unit: data.unit.trim(),
      recordedAt: new Date(),
    },
  })
}

export async function getMetricsByUserPrisma(userId: number, limit: number = 100) {
  return await prisma.metric.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: limit,
  })
}

export async function getMetricsByTypePrisma(
  userId: number,
  type: string,
  limit: number = 100
) {
  return await prisma.metric.findMany({
    where: {
      userId,
      type: type.toLowerCase().trim(),
    },
    orderBy: { recordedAt: 'desc' },
    take: limit,
  })
}

// Meal helpers
export async function createMealPrisma(data: {
  userId: number
  mealName?: string
  imageUrl?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  aiAnalysis?: string
  classification?: string
  assessment?: string
  recommendation?: string
}) {
  return await prisma.meal.create({
    data: {
      userId: data.userId,
      mealName: data.mealName || null,
      imageUrl: data.imageUrl || null,
      calories: data.calories || null,
      protein: data.protein || null,
      carbs: data.carbs || null,
      fat: data.fat || null,
      fiber: data.fiber || null,
      aiAnalysis: data.aiAnalysis || null,
      classification: data.classification || null,
      assessment: data.assessment || null,
      recommendation: data.recommendation || null,
    },
  })
}

export async function getMealsByUserPrisma(userId: number, limit: number = 100) {
  return await prisma.meal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getMealByIdPrisma(mealId: number, userId: number) {
  return await prisma.meal.findFirst({
    where: {
      id: mealId,
      userId,
    },
  })
}

// Conversation helpers
export async function createConversationPrisma(userId: number, title: string = "New chat") {
  return prisma.conversation.create({ data: { userId, title } })
}

export async function listConversationsPrisma(userId: number) {
  return prisma.conversation.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } })
}

export async function renameConversationPrisma(userId: number, conversationId: number, title: string) {
  return prisma.conversation.update({ where: { id: conversationId }, data: { title } })
}

export async function deleteConversationPrisma(userId: number, conversationId: number) {
  return prisma.conversation.delete({ where: { id: conversationId } })
}

export async function listMessagesPrisma(userId: number, conversationId: number, limit: number = 100) {
  return prisma.message.findMany({
    where: { conversationId, userId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })
}

export async function createMessagePrisma(params: { userId: number; conversationId: number; role: 'user' | 'coach'; content: string }) {
  const message = await prisma.message.create({
    data: {
      userId: params.userId,
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
    },
  })
  await prisma.conversation.update({ where: { id: params.conversationId }, data: { updatedAt: new Date() } })
  return message
}

