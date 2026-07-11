import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Conversation } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const userId = authResult.userId

    const conversations = await Conversation.find({
      'participants.userId': userId,
      status: 'active',
    })

    let totalUnread = 0
    conversations.forEach((conv) => {
      totalUnread +=
        conv.unreadCount.user > 0 ? conv.unreadCount.user : conv.unreadCount.trainer
    })

    return NextResponse.json({
      success: true,
      data: {
        unreadCount: totalUnread,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('Get unread count error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
