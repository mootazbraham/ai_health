import { NextRequest, NextResponse } from 'next/server'
import { getStravaTokens } from '@/lib/strava'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/?error=no_code`)
    }

    const tokens = await getStravaTokens(code)
    
    if (!tokens.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/?error=token_failed`)
    }

    // Store tokens - get user from session/cookie instead of auth header
    if (prisma && tokens.access_token) {
      // For now, store for the logged-in user (you'll need to get user ID from session)
      // This is a simplified approach - in production, use proper session management
      console.log('Strava tokens received:', { access_token: tokens.access_token.substring(0, 10) + '...' })
      
      // Store tokens for user ID 2 (your current user)
      try {
        await prisma.user.update({
          where: { id: 1 }, // Replace with proper user session lookup
          data: {
            stravaAccessToken: tokens.access_token,
            stravaRefreshToken: tokens.refresh_token
          }
        })
        console.log('Strava tokens stored successfully')
      } catch (e) {
        console.error('Failed to store Strava tokens:', e)
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/?strava_connected=true`)
  } catch (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/?error=callback_failed`)
  }
}