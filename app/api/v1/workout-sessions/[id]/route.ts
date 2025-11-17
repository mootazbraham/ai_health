import { NextRequest, NextResponse } from 'next/server'
import { markWorkoutComplete, markWorkoutIncomplete } from '@/lib/workout-state'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get userId from cookies or fallback
    const { getUserIdFromCookies } = await import('@/lib/cookie-auth')
    const cookieUserId = getUserIdFromCookies(request)
    const userId = cookieUserId || 1 // Fallback to user 1
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const { id } = await params
    const sessionId = parseInt(id)
    const { completed, completedAt } = await request.json()
    
    console.log('[DEBUG] PATCH workout session - sessionId:', sessionId, 'userId:', userId, 'completed:', completed)
    
    // Store completion status in shared state
    if (completed) {
      markWorkoutComplete(sessionId)
      
      // Add workout completion to dashboard metrics
      try {
        const { prisma } = await import('@/lib/prisma')
        await prisma.metric.create({
          data: {
            userId,
            type: 'activities',
            value: 1,
            unit: 'count',
            recordedAt: new Date()
          }
        })
        
        // Also add exercise calories (estimated)
        await prisma.metric.create({
          data: {
            userId,
            type: 'calories',
            value: 300, // Estimated calories burned
            unit: 'kcal',
            recordedAt: new Date()
          }
        })
        
        console.log('Added workout completion metrics to dashboard')
      } catch (error) {
        console.error('Failed to add workout metrics:', error)
      }
    } else {
      markWorkoutIncomplete(sessionId)
    }
    
    return NextResponse.json({ 
      success: true, 
      session: { 
        id: sessionId, 
        completed, 
        completedAt: completedAt || new Date() 
      } 
    })
  } catch (error) {
    console.error('Update workout session error:', error)
    return NextResponse.json({ error: 'Failed to update workout session' }, { status: 500 })
  }
}