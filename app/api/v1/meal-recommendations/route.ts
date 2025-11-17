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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const userId = parseInt(payload.userId)

    // Get today's consumed calories
    const todaysMeals = await prisma.meal.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
        }
      }
    })

    const consumedCalories = todaysMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
    const consumedProtein = todaysMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0)
    const consumedCarbs = todaysMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0)
    const consumedFat = todaysMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0)

    // Get user's daily targets
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { goalCalories: true, weightKg: true, heightCm: true, age: true, gender: true }
    })

    const dailyCalories = user?.goalCalories || calculateDailyCalories(user)
    const remainingCalories = Math.max(0, dailyCalories - consumedCalories)

    // Calculate remaining macros (40% carbs, 30% protein, 30% fat)
    const remainingProtein = Math.max(0, (dailyCalories * 0.3 / 4) - consumedProtein)
    const remainingCarbs = Math.max(0, (dailyCalories * 0.4 / 4) - consumedCarbs)
    const remainingFat = Math.max(0, (dailyCalories * 0.3 / 9) - consumedFat)

    // Generate meal recommendations
    const recommendations = await generateMealRecommendations(
      userId, 
      date, 
      remainingCalories, 
      remainingProtein, 
      remainingCarbs, 
      remainingFat
    )

    return NextResponse.json({
      success: true,
      data: {
        consumed: { calories: consumedCalories, protein: consumedProtein, carbs: consumedCarbs, fat: consumedFat },
        targets: { calories: dailyCalories, protein: dailyCalories * 0.3 / 4, carbs: dailyCalories * 0.4 / 4, fat: dailyCalories * 0.3 / 9 },
        remaining: { calories: remainingCalories, protein: remainingProtein, carbs: remainingCarbs, fat: remainingFat },
        recommendations
      }
    })
  } catch (error) {
    console.error('Meal recommendations error:', error)
    return NextResponse.json({ error: 'Failed to get meal recommendations' }, { status: 500 })
  }
}

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

    const { recommendationId } = await request.json()
    const userId = parseInt(payload.userId)

    // Mark recommendation as selected
    await prisma.mealRecommendation.update({
      where: { id: recommendationId },
      data: { selected: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Select meal recommendation error:', error)
    return NextResponse.json({ error: 'Failed to select meal recommendation' }, { status: 500 })
  }
}

function calculateDailyCalories(user: any): number {
  if (!user?.weightKg || !user?.heightCm || !user?.age) return 2000

  // Mifflin-St Jeor Equation
  const bmr = user.gender === 'male' 
    ? (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * user.age) + 5
    : (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * user.age) - 161

  return Math.round(bmr * 1.4) // Lightly active
}

async function generateMealRecommendations(
  userId: number, 
  date: string, 
  remainingCalories: number, 
  remainingProtein: number, 
  remainingCarbs: number, 
  remainingFat: number
) {
  // Clear existing recommendations for the date
  await prisma.mealRecommendation.deleteMany({
    where: { userId, date }
  })

  const mealTypes = ['breakfast', 'lunch', 'dinner']
  const recommendations = []

  for (const mealType of mealTypes) {
    const targetCalories = Math.round(remainingCalories / 3)
    const meals = getMealSuggestions(mealType, targetCalories, remainingProtein / 3, remainingCarbs / 3, remainingFat / 3)
    
    for (const meal of meals) {
      const recommendation = await prisma.mealRecommendation.create({
        data: {
          userId,
          mealType,
          date,
          ...meal
        }
      })
      recommendations.push(recommendation)
    }
  }

  return recommendations
}

function getMealSuggestions(mealType: string, calories: number, protein: number, carbs: number, fat: number) {
  const meals = {
    breakfast: [
      {
        name: 'Protein Oatmeal Bowl',
        description: 'Oats with protein powder, berries, and nuts',
        calories: Math.round(calories * 0.9),
        protein: Math.round(protein * 1.2),
        carbs: Math.round(carbs * 1.1),
        fat: Math.round(fat * 0.8),
        ingredients: 'Rolled oats, protein powder, mixed berries, almonds, honey',
        instructions: 'Cook oats, mix in protein powder, top with berries and nuts'
      },
      {
        name: 'Avocado Toast & Eggs',
        description: 'Whole grain toast with avocado and scrambled eggs',
        calories: Math.round(calories * 1.1),
        protein: Math.round(protein * 1.3),
        carbs: Math.round(carbs * 0.9),
        fat: Math.round(fat * 1.2),
        ingredients: 'Whole grain bread, avocado, eggs, tomato, salt, pepper',
        instructions: 'Toast bread, mash avocado, scramble eggs, assemble'
      },
      {
        name: 'Greek Yogurt Parfait',
        description: 'Greek yogurt with granola and fresh fruit',
        calories: Math.round(calories * 0.8),
        protein: Math.round(protein * 1.4),
        carbs: Math.round(carbs * 1.0),
        fat: Math.round(fat * 0.7),
        ingredients: 'Greek yogurt, granola, strawberries, blueberries, honey',
        instructions: 'Layer yogurt, granola, and fruit in a bowl'
      }
    ],
    lunch: [
      {
        name: 'Grilled Chicken Salad',
        description: 'Mixed greens with grilled chicken and vinaigrette',
        calories: Math.round(calories * 0.9),
        protein: Math.round(protein * 1.5),
        carbs: Math.round(carbs * 0.6),
        fat: Math.round(fat * 1.1),
        ingredients: 'Chicken breast, mixed greens, cherry tomatoes, cucumber, olive oil',
        instructions: 'Grill chicken, toss salad, add dressing'
      },
      {
        name: 'Quinoa Buddha Bowl',
        description: 'Quinoa with roasted vegetables and tahini dressing',
        calories: Math.round(calories * 1.0),
        protein: Math.round(protein * 1.0),
        carbs: Math.round(carbs * 1.2),
        fat: Math.round(fat * 1.0),
        ingredients: 'Quinoa, sweet potato, broccoli, chickpeas, tahini',
        instructions: 'Cook quinoa, roast vegetables, combine with dressing'
      },
      {
        name: 'Turkey & Hummus Wrap',
        description: 'Whole wheat wrap with turkey, hummus, and vegetables',
        calories: Math.round(calories * 1.1),
        protein: Math.round(protein * 1.3),
        carbs: Math.round(carbs * 1.1),
        fat: Math.round(fat * 0.9),
        ingredients: 'Whole wheat tortilla, turkey, hummus, lettuce, tomato',
        instructions: 'Spread hummus, add turkey and vegetables, wrap tightly'
      }
    ],
    dinner: [
      {
        name: 'Baked Salmon & Vegetables',
        description: 'Herb-crusted salmon with roasted vegetables',
        calories: Math.round(calories * 1.0),
        protein: Math.round(protein * 1.4),
        carbs: Math.round(carbs * 0.8),
        fat: Math.round(fat * 1.3),
        ingredients: 'Salmon fillet, asparagus, bell peppers, olive oil, herbs',
        instructions: 'Season salmon, roast with vegetables at 400°F for 20 min'
      },
      {
        name: 'Lean Beef Stir-fry',
        description: 'Lean beef with mixed vegetables over brown rice',
        calories: Math.round(calories * 1.1),
        protein: Math.round(protein * 1.5),
        carbs: Math.round(carbs * 1.0),
        fat: Math.round(fat * 0.9),
        ingredients: 'Lean beef, broccoli, carrots, brown rice, soy sauce',
        instructions: 'Stir-fry beef and vegetables, serve over rice'
      },
      {
        name: 'Vegetarian Lentil Curry',
        description: 'Protein-rich lentil curry with vegetables',
        calories: Math.round(calories * 0.9),
        protein: Math.round(protein * 1.2),
        carbs: Math.round(carbs * 1.3),
        fat: Math.round(fat * 0.8),
        ingredients: 'Red lentils, coconut milk, spinach, tomatoes, spices',
        instructions: 'Simmer lentils with vegetables and spices for 25 min'
      }
    ]
  }

  return meals[mealType as keyof typeof meals] || []
}