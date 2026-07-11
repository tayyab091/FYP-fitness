import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getFreeChatLimit } from '@/lib/chatHelpers'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { checkAccessFlag, requireActiveRelationship } from '@/lib/middleware/relationships'
import { Conversation, Message, Notification, User, type IConversation } from '@/models'

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
      return NextResponse.json(
        { success: false, error: 'Not authorized to view this conversation' },
        { status: 403 }
      )
    }

    const messages = await Message.find({ conversationId: id })
      .populate('senderId', 'fullName profileImage')
      .sort({ createdAt: 1 })

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('Get messages error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params
    const body = await req.json()

    const relResult = await requireActiveRelationship(req, { id }, body)
    if (isNextResponse(relResult)) {
      return relResult
    }

    const accessDenied = await checkAccessFlag(relResult.relationship, 'canChat')
    if (accessDenied) {
      return accessDenied
    }

    const userId = relResult.userId
    const { content, type = 'text', attachedPlan } = body

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      )
    }

    const conversation = await Conversation.findById(id)
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const userParticipant = conversation.participants.find(
      (p: Participant) => p.userId.toString() === userId
    )
    if (!userParticipant) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to send messages in this conversation' },
        { status: 403 }
      )
    }

    const receiverId = conversation.participants.find(
      (p: Participant) => p.userId.toString() !== userId
    )?.userId

    if (!receiverId) {
      return NextResponse.json(
        { success: false, error: 'Invalid conversation participants' },
        { status: 400 }
      )
    }

    const user = await User.findById(userId)
    const isPaidUser =
      user?.subscription &&
      user.subscription.status === 'active' &&
      ['pro', 'elite'].includes(user.subscription.plan || '')

    let isFreeMessage = false
    if (conversation.isFreeChat && !isPaidUser) {
      const freeChatLimit = await getFreeChatLimit()
      if (conversation.freeMessageCount >= freeChatLimit) {
        return NextResponse.json(
          {
            success: false,
            error: 'Free chat message limit reached for this conversation',
            code: 'FREE_LIMIT_REACHED',
            limit: freeChatLimit,
            used: conversation.freeMessageCount,
          },
          { status: 403 }
        )
      }
      isFreeMessage = true
      conversation.freeMessageCount += 1
    }

    const message = await Message.create({
      conversationId: id,
      senderId: userId,
      receiverId,
      content,
      type,
      attachedPlan: attachedPlan || undefined,
      isFreeMessage,
      isRead: false,
    })

    conversation.lastMessage = {
      content,
      sentAt: new Date(),
      sentBy: userId,
    }
    conversation.unreadCount.trainer += 1
    await conversation.save()

    await message.populate('senderId', 'fullName profileImage')

    await Notification.create({
      userId: receiverId,
      type: 'new_message',
      title: 'New message',
      message: `${user?.fullName || 'User'} sent you a message`,
      link: `/chat/${id}`,
      metadata: {
        conversationId: id,
        senderId: userId,
        senderName: user?.fullName,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: message,
        isFreeMessage,
        freeMessagesUsed: conversation.freeMessageCount,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('Send message error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
