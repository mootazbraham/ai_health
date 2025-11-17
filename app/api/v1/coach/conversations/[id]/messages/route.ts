import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get userId from cookies (fallback to query params)
    const { getUserIdFromCookies } = await import('@/lib/cookie-auth')
    const cookieUserId = getUserIdFromCookies(request)
    const { searchParams } = new URL(request.url)
    const queryUserId = parseInt(searchParams.get('userId') || '1')
    const userId = cookieUserId || queryUserId
    const { id } = await params
    const conversationId = parseInt(id)
    
    console.log('[DEBUG] GET messages - userId:', userId, 'cookieUserId:', cookieUserId, 'conversationId:', conversationId)

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true
      }
    })

    return NextResponse.json({ success: true, messages })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conversationId = parseInt(id)
    
    const { role, content, userId } = await request.json()
    
    // Get userId from cookies (fallback to request body)
    const { getUserIdFromCookies } = await import('@/lib/cookie-auth')
    const cookieUserId = getUserIdFromCookies(request)
    const finalUserId = cookieUserId || userId || 1
    
    console.log('[DEBUG] POST message - conversationId:', conversationId, 'finalUserId:', finalUserId, 'cookieUserId:', cookieUserId)

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: finalUserId }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        userId: finalUserId,
        role,
        content
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Create message error:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}