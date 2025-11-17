import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { message, conversationId } = await request.json()
    const userId = parseInt(payload.userId)

    // Get user context for AI
    const context = await getUserContext(userId)
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message, context)

    // Save conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      })
    } else {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        }
      })
    }

    // Save messages
    if (conversation) {
      await prisma.message.createMany({
        data: [
          {
            conversationId: conversation.id,
            userId,
            role: 'user',
            content: message
          },
          {
            conversationId: conversation.id,
            userId,
            role: 'coach',
            content: aiResponse
          }
        ]
      })
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      conversationId: conversation?.id
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}

async function getUserContext(userId: number) {
  const [user, recentMeals, recentMetrics, activePlan, weeklyLoad] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        age: true,
        weightKg: true,
        heightCm: true,
        gender: true,
        goalWeight: true,
        goalCalories: true
      }
    }),
    prisma.meal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        mealName: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        createdAt: true
      }
    }),
    prisma.metric.findMany({
      where: {
        userId,
        recordedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { recordedAt: 'desc' },
      take: 20
    }),
    prisma.trainingPlan.findFirst({
      where: { userId, isActive: true },
      include: {
        workoutSessions: {
          where: {
            scheduledDate: { gte: new Date() }
          },
          take: 5
        }
      }
    }),
    prisma.weeklyLoad.findFirst({
      where: { userId },
      orderBy: { weekStart: 'desc' }
    })
  ])

  return {
    user,
    recentMeals,
    recentMetrics,
    activePlan,
    weeklyLoad
  }
}

async function generateAIResponse(message: string, context: any): Promise<string> {
  const { user, recentMeals, recentMetrics, activePlan, weeklyLoad } = context

  // Calculate current stats
  const todayCalories = recentMeals
    .filter((meal: any) => new Date(meal.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0)

  const weeklyDistance = recentMetrics
    .filter((m: any) => m.type === 'distance')
    .reduce((sum: number, m: any) => sum + m.value, 0) / 1000 // km

  const weeklyActivities = recentMetrics.filter((m: any) => m.type === 'activities').length

  // Create context prompt
  const contextPrompt = `
You are an AI fitness and nutrition coach. Here's the user's current status:

USER PROFILE:
- Name: ${user?.name || 'User'}
- Age: ${user?.age || 'Unknown'}
- Weight: ${user?.weightKg || 'Unknown'} kg
- Goal Weight: ${user?.goalWeight || 'Not set'} kg
- Daily Calorie Goal: ${user?.goalCalories || 'Not set'}

TODAY'S NUTRITION:
- Calories consumed: ${todayCalories}
- Recent meals: ${recentMeals.map((m: any) => m.mealName).join(', ') || 'None logged'}

RECENT ACTIVITY:
- This week's distance: ${Math.round(weeklyDistance * 10) / 10} km
- Activities this week: ${weeklyActivities}
- Training load risk: ${weeklyLoad?.riskLevel || 'Unknown'}

TRAINING PLAN:
${activePlan ? `
- Active plan: ${activePlan.name} (${activePlan.goal})
- Upcoming workouts: ${activePlan.workoutSessions.map((w: any) => w.name).join(', ')}
` : '- No active training plan'}

USER QUESTION: "${message}"

Provide a helpful, personalized response as a knowledgeable fitness coach. Be encouraging, specific, and reference their actual data when relevant. Keep responses concise but informative.
`

  // Simple AI response generation (replace with actual AI service)
  return generateCoachResponse(message.toLowerCase(), context, contextPrompt)
}

function generateCoachResponse(message: string, context: any, contextPrompt: string): string {
  const { user, recentMeals, recentMetrics, activePlan, weeklyLoad } = context

  // Pattern matching for common questions
  if (message.includes('eat') || message.includes('food') || message.includes('meal')) {
    const todayCalories = recentMeals
      .filter((meal: any) => new Date(meal.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0)

    const remaining = (user?.goalCalories || 2000) - todayCalories

    if (remaining > 500) {
      return `Based on your ${todayCalories} calories consumed today, you have about ${remaining} calories remaining. I'd recommend a balanced meal with lean protein, complex carbs, and healthy fats. Consider grilled chicken with quinoa and vegetables, or a salmon salad with avocado.`
    } else if (remaining > 0) {
      return `You've consumed ${todayCalories} calories today and have ${remaining} calories left. A light snack like Greek yogurt with berries or a small handful of nuts would be perfect to reach your daily goal.`
    } else {
      return `You've reached your daily calorie goal of ${user?.goalCalories || 2000} calories! If you're still hungry, opt for low-calorie, nutrient-dense foods like vegetables or a small portion of fruit.`
    }
  }

  if (message.includes('workout') || message.includes('exercise') || message.includes('train')) {
    if (activePlan) {
      const nextWorkout = activePlan.workoutSessions[0]
      if (nextWorkout) {
        return `Your next scheduled workout is "${nextWorkout.name}" - a ${nextWorkout.duration} minute ${nextWorkout.type} session. ${weeklyLoad?.riskLevel === 'high' ? 'However, your training load is currently high, so consider reducing intensity by 20% to prevent injury.' : 'You\'re on track with your training plan!'}`
      }
    }
    
    const weeklyActivities = recentMetrics.filter((m: any) => m.type === 'activities').length
    if (weeklyActivities < 3) {
      return `You've completed ${weeklyActivities} activities this week. I recommend adding 2-3 more sessions focusing on ${user?.goalWeight && user.goalWeight < (user?.weightKg || 70) ? 'cardio for weight loss' : 'strength training for muscle building'}. Start with 30-minute sessions at moderate intensity.`
    } else {
      return `Great job on staying active with ${weeklyActivities} activities this week! Keep up the consistency. Make sure to include rest days for recovery.`
    }
  }

  if (message.includes('weight') || message.includes('lose') || message.includes('gain')) {
    const currentWeight = user?.weightKg
    const goalWeight = user?.goalWeight
    
    if (currentWeight && goalWeight) {
      const difference = currentWeight - goalWeight
      const weeklyDeficit = difference > 0 ? 3500 : -3500 // calories per kg
      
      return `To ${difference > 0 ? 'lose' : 'gain'} ${Math.abs(difference).toFixed(1)} kg and reach your goal of ${goalWeight} kg, aim for a ${difference > 0 ? 'deficit' : 'surplus'} of about ${Math.abs(weeklyDeficit / 7)} calories per day. This means ${difference > 0 ? 'eating less or exercising more' : 'eating more nutrient-dense foods'}. A safe rate is 0.5-1 kg per week.`
    }
    
    return `Weight management is about creating the right calorie balance. For weight loss, aim for a 500-750 calorie daily deficit through diet and exercise. For weight gain, focus on a 300-500 calorie surplus with strength training.`
  }

  if (message.includes('pace') || message.includes('slow') || message.includes('fast')) {
    const recentDistance = recentMetrics.filter((m: any) => m.type === 'distance').slice(0, 3)
    const recentTime = recentMetrics.filter((m: any) => m.type === 'exercise_time').slice(0, 3)
    
    if (recentDistance.length > 0 && recentTime.length > 0) {
      return `Your recent pace variations could be due to several factors: training load (currently ${weeklyLoad?.riskLevel || 'unknown'}), nutrition timing, sleep quality, or weather conditions. Focus on consistent effort rather than pace - some days will naturally feel harder. Ensure you're getting adequate rest and fueling properly before workouts.`
    }
    
    return `Pace can vary due to many factors including fatigue, nutrition, weather, and training load. Focus on effort level rather than exact pace. Easy runs should feel conversational, while tempo runs should feel comfortably hard.`
  }

  // Default response
  return `Thanks for your question! Based on your current progress with ${recentMetrics.filter((m: any) => m.type === 'activities').length} activities this week and ${recentMeals.length} meals logged recently, you're doing great with tracking. ${activePlan ? `Keep following your ${activePlan.name} plan.` : 'Consider creating a training plan to structure your workouts.'} Feel free to ask me about nutrition, workouts, or your progress anytime!`
}