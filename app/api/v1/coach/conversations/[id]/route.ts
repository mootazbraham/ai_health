import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conversationId = parseInt(id)
    const { title, userId } = await request.json()
    const finalUserId = userId || 2

    const conversation = await prisma.conversation.update({
      where: { id: conversationId, userId: finalUserId },
      data: { title }
    })

    return NextResponse.json({ success: true, conversation })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conversationId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const userId = parseInt(searchParams.get('userId') || '2')

    await prisma.conversation.delete({
      where: { id: conversationId, userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
  }
}