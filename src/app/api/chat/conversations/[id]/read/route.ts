import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Conversation, type IConversation } from '@/models'

type Participant = IConversation['participants'][number]

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const userId = authResult.userId
    const { id } = await params

    const conversation = await Conversation.findById(id)
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const isParticipant = conversation.participants.some(
      (p: Participant) => p.userId.toString() === userId
    )
    if (!isParticipant) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    const userParticipant = conversation.participants.find(
      (p: Participant) => p.userId.toString() === userId
    )
    if (userParticipant) {
      conversation.unreadCount.user = 0
    } else {
      conversation.unreadCount.trainer = 0
    }

    await conversation.save()

    return NextResponse.json({
      success: true,
      message: 'Conversation marked as read',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('Mark read error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
