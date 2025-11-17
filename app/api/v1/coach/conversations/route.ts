import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Get userId from cookies (fallback to query params)
    const { getUserIdFromCookies } = await import('@/lib/cookie-auth')
    const cookieUserId = getUserIdFromCookies(request)
    const { searchParams } = new URL(request.url)
    const queryUserId = parseInt(searchParams.get('userId') || '0')
    const userId = cookieUserId || queryUserId
    
    console.log('[DEBUG] GET conversations - userId:', userId, 'cookieUserId:', cookieUserId)
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: typeof userId === 'string' ? parseInt(userId) : userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ success: true, conversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, userId } = body
    
    // Get userId from cookies (fallback to request body)
    const { getUserIdFromCookies } = await import('@/lib/cookie-auth')
    const cookieUserId = getUserIdFromCookies(request)
    const finalUserId = cookieUserId || userId || 2
    
    console.log('[DEBUG] POST conversation - finalUserId:', finalUserId, 'cookieUserId:', cookieUserId)

    const conversation = await prisma.conversation.create({
      data: {
        userId: finalUserId,
        title: title || 'New Chat'
      }
    })

    return NextResponse.json({ success: true, conversation })
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}