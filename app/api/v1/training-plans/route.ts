import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/security'
import { isWorkoutComplete, setLatestPlan } from '@/lib/workout-state'

export async function GET(request: NextRequest) {
  try {
    // Get userId from cookies or query params
    const { getUserIdFromCookies } = await import('@/lib/cookie-auth')
    const cookieUserId = getUserIdFromCookies(request)
    const { searchParams } = new URL(request.url)
    const queryUserId = parseInt(searchParams.get('userId') || '1')
    const userId = cookieUserId || queryUserId
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.log('[DEBUG] GET training plans - userId:', userId)

    // Check if there's a recently created plan in memory
    const { getLatestPlan } = await import('@/lib/workout-state')
    const latestPlan = getLatestPlan()
    
    if (latestPlan) {
      return NextResponse.json({ success: true, plans: [latestPlan] })
    }
    
    // Return default mock data with completion status
    const plans = [{
      id: 1,
      name: 'Weight Loss Plan',
      description: 'AI-generated weight loss program',
      goal: 'weight_loss',
      duration: 12,
      difficulty: 'intermediate',
      isActive: true,
      createdAt: new Date(),
      workoutSessions: [
        {
          id: 1,
          name: 'HIIT Cardio',
          type: 'cardio',
          duration: 45,
          calories: 350,
          scheduledDate: new Date(),
          notes: 'High intensity interval training',
          completed: isWorkoutComplete(1)
        },
        {
          id: 2,
          name: 'Strength Circuit',
          type: 'strength',
          duration: 40,
          calories: 280,
          scheduledDate: new Date(Date.now() + 24*60*60*1000),
          notes: 'Full body strength training',
          completed: isWorkoutComplete(2)
        },
        {
          id: 3,
          name: 'Active Recovery',
          type: 'flexibility',
          duration: 30,
          calories: 150,
          scheduledDate: new Date(Date.now() + 2*24*60*60*1000),
          notes: 'Light stretching and mobility',
          completed: isWorkoutComplete(3)
        }
      ]
    }]

    return NextResponse.json({ success: true, plans })
  } catch (error) {
    console.error('Training plans error:', error)
    return NextResponse.json({ error: 'Failed to get training plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get userId from cookies or fallback
    const { getUserIdFromCookies } = await import('@/lib/cookie-auth')
    const cookieUserId = getUserIdFromCookies(request)
    const userId = cookieUserId || 1 // Fallback to user 1
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.log('[DEBUG] POST training plan - userId:', userId)
    const { goal, availableTime, fitnessLevel } = await request.json()

    // Generate training plan (using fallback for speed)
    const aiPlan = {
      name: `${goal.charAt(0).toUpperCase() + goal.slice(1)} Plan`,
      description: `Personalized ${goal} plan for ${fitnessLevel} level`,
      workouts: Array.from({ length: Math.min(availableTime * 4, 8) }, (_, i) => ({
        id: i + 1,
        name: getWorkoutName(goal, i),
        type: getWorkoutType(goal, i),
        duration: 45,
        calories: 300,
        scheduledDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        notes: `${fitnessLevel} level workout`
      }))
    }
    
    const plan = {
      id: Date.now(),
      userId,
      name: aiPlan.name,
      description: aiPlan.description,
      goal,
      duration: 12,
      difficulty: fitnessLevel,
      isActive: true,
      createdAt: new Date(),
      workoutSessions: aiPlan.workouts,
      workouts: aiPlan.workouts // Add both for compatibility
    }
    
    // Store the plan so it shows up in GET requests
    setLatestPlan(plan)
    
    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('Create training plan error:', error)
    return NextResponse.json({ error: 'Failed to create training plan' }, { status: 500 })
  }
}



async function generateAIPlan(goal: string, availableTime: number, fitnessLevel: string, metrics: any[]) {
  const models = [
    "deepseek/deepseek-chat-v3.1:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemini-flash-1.5:free"
  ]

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: `Create a ${goal} fitness plan for ${fitnessLevel} level, ${availableTime} sessions/week. Return only JSON:
{"name":"Plan Name","description":"Brief description","workouts":[{"name":"Workout","type":"cardio","duration":45,"calories":300,"notes":"Details"}]}`
          }],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.choices?.[0]?.message?.content) {
          const content = data.choices[0].message.content
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
          }
        }
      } else {
        console.warn(`Model ${model} failed:`, response.status)
      }
    } catch (error) {
      console.warn(`Model ${model} error:`, error instanceof Error ? error.message : 'Unknown error')
    }
  }
  
  console.log('All AI models failed, using fallback plan')

  // Fallback plan
  return {
    name: `${goal.charAt(0).toUpperCase() + goal.slice(1)} Plan`,
    description: `Personalized ${goal} plan`,
    workouts: Array.from({ length: availableTime * 4 }, (_, i) => ({
      name: getWorkoutName(goal, i),
      type: getWorkoutType(goal, i),
      duration: 45,
      calories: 300,
      notes: `${fitnessLevel} level workout`
    }))
  }
}

function getWorkoutName(goal: string, day: number): string {
  const workouts = {
    weight_loss: ['HIIT Cardio', 'Strength Circuit', 'Active Recovery', 'Endurance Run'],
    muscle_gain: ['Upper Body Strength', 'Lower Body Power', 'Core & Stability', 'Full Body'],
    endurance: ['Long Run', 'Tempo Training', 'Interval Training', 'Recovery Jog']
  }
  return workouts[goal as keyof typeof workouts]?.[day % 4] || 'General Fitness'
}

function getWorkoutType(goal: string, day: number): string {
  const types = {
    weight_loss: ['cardio', 'strength', 'flexibility', 'cardio'],
    muscle_gain: ['strength', 'strength', 'flexibility', 'strength'],
    endurance: ['cardio', 'cardio', 'cardio', 'flexibility']
  }
  return types[goal as keyof typeof types]?.[day % 4] || 'cardio'
}

function getWorkoutNotes(goal: string, level: string, progression: number): string {
  const intensity = level === 'beginner' ? 'moderate' : level === 'intermediate' ? 'high' : 'very high'
  return `${intensity} intensity workout. Week ${Math.floor(progression)} progression. Focus on proper form.`
}