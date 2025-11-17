import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week' // day, week, month
    const userId = parseInt(payload.userId)

    let startDate = new Date()
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30)
    }

    // Get meals (calories in)
    const meals = await prisma.meal.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        calories: true,
        createdAt: true
      }
    })

    // Get exercise metrics (calories out)
    const exercises = await prisma.metric.findMany({
      where: {
        userId,
        type: 'calories',
        recordedAt: { gte: startDate }
      },
      select: {
        value: true,
        recordedAt: true
      }
    })

    // Calculate daily totals
    const dailyData = new Map()
    
    // Process meals
    meals.forEach(meal => {
      const date = meal.createdAt.toISOString().split('T')[0]
      if (!dailyData.has(date)) {
        dailyData.set(date, { date, caloriesIn: 0, caloriesOut: 0, balance: 0 })
      }
      dailyData.get(date).caloriesIn += meal.calories || 0
    })

    // Process exercises
    exercises.forEach(exercise => {
      const date = exercise.recordedAt.toISOString().split('T')[0]
      if (!dailyData.has(date)) {
        dailyData.set(date, { date, caloriesIn: 0, caloriesOut: 0, balance: 0 })
      }
      dailyData.get(date).caloriesOut += exercise.value
    })

    // Calculate balance and weight projection
    const data = Array.from(dailyData.values()).map(day => ({
      ...day,
      balance: day.caloriesIn - day.caloriesOut
    }))

    // Get user's current weight for projection
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { weightKg: true, goalWeight: true }
    })

    // Calculate weight projection (3500 calories = 1 lb = 0.45 kg)
    let projectedWeight = user?.weightKg || 70
    const weightProjection = data.map(day => {
      const weightChange = (day.balance / 3500) * 0.45 // kg
      projectedWeight += weightChange
      return {
        date: day.date,
        projectedWeight: Math.round(projectedWeight * 10) / 10
      }
    })

    const summary = {
      totalCaloriesIn: data.reduce((sum, day) => sum + day.caloriesIn, 0),
      totalCaloriesOut: data.reduce((sum, day) => sum + day.caloriesOut, 0),
      avgDailyBalance: data.length > 0 ? Math.round(data.reduce((sum, day) => sum + day.balance, 0) / data.length) : 0,
      currentWeight: user?.weightKg,
      goalWeight: user?.goalWeight,
      projectedWeightChange: weightProjection.length > 0 ? 
        Math.round((weightProjection[weightProjection.length - 1].projectedWeight - (user?.weightKg || 70)) * 10) / 10 : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        dailyData: data,
        weightProjection,
        summary
      }
    })
  } catch (error) {
    console.error('Energy balance error:', error)
    return NextResponse.json({ error: 'Failed to get energy balance' }, { status: 500 })
  }
}