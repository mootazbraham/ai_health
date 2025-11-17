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

    // Initialize achievements if not exists
    await initializeAchievements()

    // Check for new achievements
    await checkAchievements(userId)

    // Get user achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: parseInt(userId) },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' }
    })

    // Calculate streaks
    const streaks = await calculateStreaks(userId)

    // Get user stats
    const stats = await getUserStats(userId)

    return NextResponse.json({
      success: true,
      data: {
        achievements: userAchievements,
        streaks,
        stats,
        totalPoints: userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0)
      }
    })
  } catch (error) {
    console.error('Gamification error:', error)
    return NextResponse.json({ error: 'Failed to get gamification data' }, { status: 500 })
  }
}

async function initializeAchievements() {
  const achievements = [
    // Fitness Achievements
    { name: 'First Steps', description: 'Complete your first workout', icon: '👟', category: 'fitness', requirement: JSON.stringify({ type: 'activities', count: 1 }), points: 10 },
    { name: 'Consistent Mover', description: 'Complete 7 workouts', icon: '🏃', category: 'fitness', requirement: JSON.stringify({ type: 'activities', count: 7 }), points: 50 },
    { name: 'Distance Warrior', description: 'Run/walk 50km total', icon: '🏃‍♂️', category: 'fitness', requirement: JSON.stringify({ type: 'distance', total: 50000 }), points: 100 },
    { name: 'Endurance Beast', description: 'Complete 100km total', icon: '🦁', category: 'fitness', requirement: JSON.stringify({ type: 'distance', total: 100000 }), points: 200 },
    
    // Nutrition Achievements
    { name: 'Meal Logger', description: 'Log your first meal', icon: '🍽️', category: 'nutrition', requirement: JSON.stringify({ type: 'meals', count: 1 }), points: 10 },
    { name: 'Nutrition Tracker', description: 'Log 30 meals', icon: '📊', category: 'nutrition', requirement: JSON.stringify({ type: 'meals', count: 30 }), points: 75 },
    { name: 'Calorie Master', description: 'Hit your calorie goal 7 days', icon: '🎯', category: 'nutrition', requirement: JSON.stringify({ type: 'calorie_goals', count: 7 }), points: 100 },
    
    // Streak Achievements
    { name: 'Week Warrior', description: '7-day activity streak', icon: '🔥', category: 'streak', requirement: JSON.stringify({ type: 'activity_streak', days: 7 }), points: 50 },
    { name: 'Month Master', description: '30-day activity streak', icon: '💪', category: 'streak', requirement: JSON.stringify({ type: 'activity_streak', days: 30 }), points: 200 },
    
    // Special Achievements
    { name: 'Early Bird', description: 'Complete workout before 7 AM', icon: '🌅', category: 'special', requirement: JSON.stringify({ type: 'early_workout' }), points: 25 },
    { name: 'Night Owl', description: 'Complete workout after 9 PM', icon: '🦉', category: 'special', requirement: JSON.stringify({ type: 'late_workout' }), points: 25 },
    { name: 'Weekend Warrior', description: 'Complete workout on weekend', icon: '🏖️', category: 'special', requirement: JSON.stringify({ type: 'weekend_workout' }), points: 30 }
  ]

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement
    })
  }
}

async function checkAchievements(userId: number) {
  const achievements = await prisma.achievement.findMany()
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId: parseInt(userId) },
    select: { achievementId: true }
  })
  
  const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId))

  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) continue

    const requirement = JSON.parse(achievement.requirement)
    const isUnlocked = await checkRequirement(userId, requirement)

    if (isUnlocked) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id
        }
      })
    }
  }
}

async function checkRequirement(userId: number, requirement: any): Promise<boolean> {
  switch (requirement.type) {
    case 'activities':
      const activityCount = await prisma.metric.count({
        where: { userId, type: 'activities' }
      })
      return activityCount >= requirement.count

    case 'distance':
      const totalDistance = await prisma.metric.aggregate({
        where: { userId, type: 'distance' },
        _sum: { value: true }
      })
      return (totalDistance._sum.value || 0) >= requirement.total

    case 'meals':
      const mealCount = await prisma.meal.count({
        where: { userId: parseInt(userId) }
      })
      return mealCount >= requirement.count

    case 'calorie_goals':
      // Check days where user hit calorie goal (simplified)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { goalCalories: true }
      })
      if (!user?.goalCalories) return false

      const recentMeals = await prisma.meal.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      })

      const dailyCalories = new Map()
      recentMeals.forEach(meal => {
        const date = meal.createdAt.toISOString().split('T')[0]
        dailyCalories.set(date, (dailyCalories.get(date) || 0) + (meal.calories || 0))
      })

      const goalDays = Array.from(dailyCalories.values()).filter(
        calories => Math.abs(calories - user.goalCalories) <= 100
      ).length

      return goalDays >= requirement.count

    case 'activity_streak':
      const streak = await calculateActivityStreak(userId)
      return streak >= requirement.days

    case 'early_workout':
    case 'late_workout':
    case 'weekend_workout':
      // Simplified check - would need more detailed workout timing data
      return false

    default:
      return false
  }
}

async function calculateStreaks(userId: number) {
  const activityStreak = await calculateActivityStreak(userId)
  const mealStreak = await calculateMealStreak(userId)

  return {
    activity: activityStreak,
    meal: mealStreak
  }
}

async function calculateActivityStreak(userId: number): Promise<number> {
  const activities = await prisma.metric.findMany({
    where: { userId, type: 'activities' },
    orderBy: { recordedAt: 'desc' },
    take: 30
  })

  if (activities.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    
    const hasActivity = activities.some(activity => {
      const activityDate = new Date(activity.recordedAt)
      activityDate.setHours(0, 0, 0, 0)
      return activityDate.getTime() === checkDate.getTime()
    })

    if (hasActivity) {
      streak++
    } else if (i === 0) {
      // If no activity today, check yesterday
      continue
    } else {
      break
    }
  }

  return streak
}

async function calculateMealStreak(userId: number): Promise<number> {
  const meals = await prisma.meal.findMany({
    where: { userId: parseInt(userId) },
    orderBy: { recordedAt: 'desc' },
    take: 100
  })

  if (meals.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    
    const hasMeal = meals.some(meal => {
      const mealDate = new Date(meal.createdAt)
      mealDate.setHours(0, 0, 0, 0)
      return mealDate.getTime() === checkDate.getTime()
    })

    if (hasMeal) {
      streak++
    } else {
      break
    }
  }

  return streak
}

async function getUserStats(userId: number) {
  const [totalActivities, totalMeals, totalDistance, totalCalories] = await Promise.all([
    prisma.metric.count({ where: { userId, type: 'activities' } }),
    prisma.meal.count({ where: { userId: parseInt(userId) } }),
    prisma.metric.aggregate({
      where: { userId, type: 'distance' },
      _sum: { value: true }
    }),
    prisma.metric.aggregate({
      where: { userId, type: 'calories' },
      _sum: { value: true }
    })
  ])

  return {
    totalActivities,
    totalMeals,
    totalDistance: Math.round((totalDistance._sum.value || 0) / 1000 * 10) / 10, // km
    totalCalories: Math.round(totalCalories._sum.value || 0)
  }
}