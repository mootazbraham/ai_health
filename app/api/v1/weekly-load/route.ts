import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/security'

const prisma = new PrismaClient()

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

    const userId = parseInt(payload.userId)
    
    // Calculate and store weekly loads
    await calculateWeeklyLoads(userId)
    
    // Get recent weekly loads
    const weeklyLoads = await prisma.weeklyLoad.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { weekStart: 'desc' },
      take: 12 // Last 12 weeks
    })

    // Detect load spikes and injury risk
    const analysis = analyzeLoadTrends(weeklyLoads)

    return NextResponse.json({
      success: true,
      data: {
        weeklyLoads,
        analysis
      }
    })
  } catch (error) {
    console.error('Weekly load error:', error)
    return NextResponse.json({ error: 'Failed to get weekly load' }, { status: 500 })
  }
}

async function calculateWeeklyLoads(userId: number) {
  const now = new Date()
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)

  // Get all metrics for the last 12 weeks
  const metrics = await prisma.metric.findMany({
    where: {
      userId,
      type: { in: ['distance', 'exercise_time', 'calories'] },
      recordedAt: { gte: twelveWeeksAgo }
    },
    orderBy: { recordedAt: 'asc' }
  })

  // Group by week
  const weeklyData = new Map()
  
  metrics.forEach(metric => {
    const date = new Date(metric.recordedAt)
    const weekStart = getWeekStart(date)
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, {
        weekStart,
        totalDistance: 0,
        totalTime: 0,
        totalCalories: 0,
        activities: 0
      })
    }
    
    const week = weeklyData.get(weekKey)
    
    switch (metric.type) {
      case 'distance':
        week.totalDistance += metric.value / 1000 // Convert to km
        week.activities += 1
        break
      case 'exercise_time':
        week.totalTime += metric.value
        break
      case 'calories':
        week.totalCalories += metric.value
        break
    }
  })

  // Calculate load scores and save to database
  for (const [weekKey, data] of weeklyData) {
    const loadScore = calculateLoadScore(data.totalDistance, data.totalTime, data.totalCalories)
    const avgPace = data.totalDistance > 0 && data.totalTime > 0 ? 
      (data.totalTime / 60) / data.totalDistance : null // min/km

    await prisma.weeklyLoad.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart: data.weekStart
        }
      },
      update: {
        totalDistance: data.totalDistance,
        totalTime: data.totalTime,
        totalCalories: data.totalCalories,
        avgPace,
        loadScore,
        riskLevel: 'low' // Will be updated by analysis
      },
      create: {
        userId,
        weekStart: data.weekStart,
        totalDistance: data.totalDistance,
        totalTime: data.totalTime,
        totalCalories: data.totalCalories,
        avgPace,
        loadScore,
        riskLevel: 'low'
      }
    })
  }
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

function calculateLoadScore(distance: number, time: number, calories: number): number {
  // Custom load score formula combining distance, time, and intensity
  const distanceScore = distance * 10 // 10 points per km
  const timeScore = time / 60 * 5 // 5 points per hour
  const intensityScore = calories / 100 * 2 // 2 points per 100 calories
  
  return Math.round(distanceScore + timeScore + intensityScore)
}

function analyzeLoadTrends(weeklyLoads: any[]) {
  if (weeklyLoads.length < 2) {
    return {
      trend: 'insufficient_data',
      riskLevel: 'low',
      recommendations: ['Continue tracking your activities to get personalized insights']
    }
  }

  const loads = weeklyLoads.map(w => w.loadScore).reverse() // Chronological order
  const recent4Weeks = loads.slice(-4)
  const previous4Weeks = loads.slice(-8, -4)

  // Calculate acute:chronic ratio (4-week average : 4-week average)
  const acuteLoad = recent4Weeks.reduce((sum, load) => sum + load, 0) / recent4Weeks.length
  const chronicLoad = previous4Weeks.length > 0 ? 
    previous4Weeks.reduce((sum, load) => sum + load, 0) / previous4Weeks.length : acuteLoad

  const acuteChronic = chronicLoad > 0 ? acuteLoad / chronicLoad : 1

  // Detect load spikes (>30% increase week over week)
  const weekOverWeekChanges = []
  for (let i = 1; i < loads.length; i++) {
    const change = loads[i-1] > 0 ? (loads[i] - loads[i-1]) / loads[i-1] : 0
    weekOverWeekChanges.push(change)
  }

  const hasSpike = weekOverWeekChanges.some(change => change > 0.3)
  const recentSpike = weekOverWeekChanges.slice(-2).some(change => change > 0.3)

  // Determine risk level
  let riskLevel = 'low'
  let recommendations = []

  if (acuteChronic > 1.5 || recentSpike) {
    riskLevel = 'high'
    recommendations = [
      'High injury risk detected due to rapid load increase',
      'Consider reducing training volume by 20-30% this week',
      'Focus on recovery activities like stretching and light movement',
      'Monitor for signs of fatigue or discomfort'
    ]
  } else if (acuteChronic > 1.2 || hasSpike) {
    riskLevel = 'moderate'
    recommendations = [
      'Moderate load increase detected',
      'Maintain current training level for 1-2 weeks',
      'Ensure adequate sleep and nutrition',
      'Include recovery sessions in your routine'
    ]
  } else if (acuteChronic < 0.8) {
    riskLevel = 'low'
    recommendations = [
      'Training load is well managed',
      'You can gradually increase training volume by 10-15%',
      'Good balance between training and recovery',
      'Continue current approach'
    ]
  }

  return {
    acuteChronic: Math.round(acuteChronic * 100) / 100,
    trend: acuteChronic > 1.1 ? 'increasing' : acuteChronic < 0.9 ? 'decreasing' : 'stable',
    riskLevel,
    hasSpike,
    recentSpike,
    recommendations
  }
}