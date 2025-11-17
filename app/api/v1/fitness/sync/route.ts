import { NextRequest, NextResponse } from 'next/server'
import { getFitnessData, refreshAccessToken } from '@/lib/google-fitness'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get user's Google tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleAccessToken: true, googleRefreshToken: true }
    })

    if (!user?.googleAccessToken) {
      return NextResponse.json({ error: 'Google Fit not connected' }, { status: 400 })
    }

    let accessToken = user.googleAccessToken

    // Try to fetch fitness data
    let fitnessData = await getFitnessData(accessToken)
    
    // If data fetch failed and we have refresh token, try refreshing
    if (fitnessData.steps === 0 && user.googleRefreshToken) {
      try {
        const newTokens = await refreshAccessToken(user.googleRefreshToken)
        if (newTokens.access_token) {
          accessToken = newTokens.access_token
          
          // Update stored token
          await prisma.user.update({
            where: { id: userId },
            data: { googleAccessToken: accessToken }
          })
          
          // Retry fitness data fetch
          fitnessData = await getFitnessData(accessToken)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      }
    }

    // Store fitness data as health metrics
    const today = new Date().toISOString().split('T')[0]
    
    if (fitnessData.steps > 0) {
      await prisma.healthMetric.upsert({
        where: {
          userId_type_date: {
            userId,
            type: 'steps',
            date: today
          }
        },
        update: { value: fitnessData.steps },
        create: {
          userId,
          type: 'steps',
          value: fitnessData.steps,
          unit: 'steps',
          date: today
        }
      })
    }

    if (fitnessData.heartRate > 0) {
      await prisma.healthMetric.upsert({
        where: {
          userId_type_date: {
            userId,
            type: 'heart_rate',
            date: today
          }
        },
        update: { value: fitnessData.heartRate },
        create: {
          userId,
          type: 'heart_rate',
          value: fitnessData.heartRate,
          unit: 'bpm',
          date: today
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: fitnessData,
      message: 'Fitness data synced successfully'
    })
  } catch (error) {
    console.error('Fitness sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}