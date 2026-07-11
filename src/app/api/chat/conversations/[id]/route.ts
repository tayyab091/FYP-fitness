import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Conversation, Message, type IConversation } from '@/models'

type Participant = IConversation['participants'][number]

export async function GET(
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
      .populate('participants.userId', 'fullName profileImage')
      .populate('trainerId', '_id name specialty rating')

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const isParticipant = conversation.participants.some((p: Participant) => {
      const uid = p.userId as unknown as { _id?: { toString(): string } }
      return (uid._id ? uid._id.toString() : String(p.userId)) === userId
    })
    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view this conversation' },
        { status: 403 }
      )
    }

    const messages = await Message.find({ conversationId: id })
      .populate('senderId', 'fullName profileImage')
      .sort({ createdAt: 1 })

    await Message.updateMany(
      {
        conversationId: id,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    )

    conversation.unreadCount.user = 0
    await conversation.save()

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages,
        currentUserId: userId,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('Get conversation error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(
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

    conversation.status = 'archived'
    await conversation.save()

    return NextResponse.json({
      success: true,
      message: 'Conversation archived',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('Archive conversation error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
