import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getFreeChatLimit } from '@/lib/chatHelpers'
import { isNextResponse } from '@/lib/middleware/auth'
import { checkAccessFlag, requireActiveRelationship } from '@/lib/middleware/relationships'
import { Conversation, Trainer, User } from '@/models'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trainerId: string }> }
) {
  try {
    await connectDB()

    const { trainerId } = await params
    const relResult = await requireActiveRelationship(req, { trainerId })
    if (isNextResponse(relResult)) {
      return relResult
    }

    const accessDenied = await checkAccessFlag(relResult.relationship, 'canChat')
    if (accessDenied) {
      return accessDenied
    }

    const userId = relResult.userId

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const isPaidUser =
      user.subscription &&
      user.subscription.status === 'active' &&
      ['pro', 'elite'].includes(user.subscription.plan || '')

    const freeChatLimit = await getFreeChatLimit()
    if (!isPaidUser && user.freeChatsUsed >= freeChatLimit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Free chat limit reached',
          code: 'FREE_LIMIT_REACHED',
          limit: freeChatLimit,
          used: user.freeChatsUsed,
          upgradeUrl: '/subscription',
        },
        { status: 403 }
      )
    }

    const trainer = await Trainer.findById(trainerId)
    if (!trainer || !trainer.isFullyVerified) {
      return NextResponse.json(
        { success: false, error: 'Trainer not found or not verified' },
        { status: 404 }
      )
    }

    let conversation = await Conversation.findOne({
      'participants.userId': userId,
      trainerId,
    })

    if (conversation) {
      return NextResponse.json({
        success: true,
        data: conversation,
        message: 'Existing conversation opened',
      })
    }

    const isFreeChat = !isPaidUser

    conversation = await Conversation.create({
      participants: [
        { userId, role: 'user', lastSeen: new Date(), isTyping: false },
        {
          userId: trainer.userId,
          role: 'trainer',
          lastSeen: new Date(),
          isTyping: false,
        },
      ],
      trainerId,
      isFreeChat,
      freeMessageCount: 0,
      status: 'active',
      unreadCount: { user: 0, trainer: 0 },
    })

    if (isFreeChat) {
      user.freeChatsUsed += 1
      await user.save()
    }

    return NextResponse.json(
      {
        success: true,
        data: conversation,
        message: 'Conversation started',
        isFreeChat,
        freeChatsRemaining: isFreeChat ? freeChatLimit - user.freeChatsUsed : undefined,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('Start conversation error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
