import { NextRequest, NextResponse } from 'next/server'
import { getTokens } from '@/lib/google-fitness'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/?error=access_denied`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/?error=no_code`)
    }

    // Get tokens from Google
    const tokens = await getTokens(code)
    
    if (!tokens.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/?error=token_failed`)
    }

    // Get user from JWT token (if available)
    const authHeader = request.headers.get('authorization')
    let userId = null
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        userId = decoded.userId
      } catch (e) {
        // Token invalid, continue without user
      }
    }

    // Store tokens in database if user is logged in
    if (userId && prisma) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token
        }
      })
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/?google_connected=true`)
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/?error=callback_failed`)
  }
}