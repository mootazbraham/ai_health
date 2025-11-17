import { NextRequest, NextResponse } from 'next/server'
import { getStravaActivities, getStravaAthlete } from '@/lib/strava'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    console.log('Strava sync started')
    
    // Temporarily bypass auth for testing
    const userId = 1 // Your user ID
    console.log('User ID:', userId)

    if (!prisma) {
      console.log('No prisma')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Check current tokens
    console.log('Checking for existing tokens...')
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stravaAccessToken: true, stravaRefreshToken: true }
    })
    console.log('User found:', !!user, 'Has token:', !!user?.stravaAccessToken)

    if (!user?.stravaAccessToken) {
      return NextResponse.json({ 
        error: 'Strava not connected. Please connect with activity:read_all permissions.',
        needsAuth: true,
        authUrl: 'Click Connect Strava button'
      }, { status: 400 })
    }

    console.log('Fetching Strava data...')
    const [stravaData, athleteData] = await Promise.all([
      getStravaActivities(user.stravaAccessToken, user.stravaRefreshToken!),
      getStravaAthlete(user.stravaAccessToken)
    ])
    console.log('Strava data:', stravaData)
    console.log('Athlete data:', athleteData)
    
    // If we got a new access token, update it
    if (stravaData.newAccessToken) {
      await prisma.user.update({
        where: { id: userId },
        data: { stravaAccessToken: stravaData.newAccessToken }
      })
      console.log('Updated access token')
    }
    
    const today = new Date().toISOString().split('T')[0]

    // Store in Metric table (same as dashboard reads from)
    const now = new Date()
    
    if (stravaData.activities > 0) {
      await prisma.metric.create({
        data: {
          userId, 
          type: 'activities', 
          value: stravaData.activities, 
          unit: 'count',
          recordedAt: now
        }
      })
    }
    
    if (stravaData.distance > 0) {
      await prisma.metric.create({
        data: {
          userId, 
          type: 'distance', 
          value: stravaData.distance, 
          unit: 'meters',
          recordedAt: now
        }
      })
    }
    
    if (stravaData.totalTime > 0) {
      await prisma.metric.create({
        data: {
          userId, 
          type: 'exercise_time', 
          value: stravaData.totalTime, 
          unit: 'minutes',
          recordedAt: now
        }
      })
    }
    
    if (stravaData.elevation > 0) {
      await prisma.metric.create({
        data: {
          userId, 
          type: 'elevation', 
          value: stravaData.elevation, 
          unit: 'meters',
          recordedAt: now
        }
      })
    }
    
    if (stravaData.avgSpeed > 0) {
      await prisma.metric.create({
        data: {
          userId, 
          type: 'avg_speed', 
          value: stravaData.avgSpeed, 
          unit: 'km/h',
          recordedAt: now
        }
      })
    }
    
    if (stravaData.steps > 0) {
      await prisma.metric.create({
        data: {
          userId, 
          type: 'steps', 
          value: stravaData.steps, 
          unit: 'steps',
          recordedAt: now
        }
      })
    }
    
    if (stravaData.calories > 0) {
      await prisma.metric.create({
        data: {
          userId, 
          type: 'calories', 
          value: stravaData.calories, 
          unit: 'kcal',
          recordedAt: now
        }
      })
    }

    // Store GPS data as JSON string
    if (stravaData.gpsData && stravaData.gpsData.length > 0) {
      await prisma.metric.create({
        data: {
          userId,
          type: 'gps_data',
          value: stravaData.gpsData.length,
          unit: JSON.stringify(stravaData.gpsData), // Store GPS data in unit field
          recordedAt: now
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...stravaData,
        athlete: {
          city: athleteData.city,
          state: athleteData.state,
          country: athleteData.country,
          profile: athleteData.profile
        }
      },
      message: 'Strava data synced successfully'
    })
  } catch (error) {
    console.error('Strava sync error:', error)
    return NextResponse.json({ 
      error: 'Sync failed', 
      details: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error'
    }, { status: 500 })
  }
}