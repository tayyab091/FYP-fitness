import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Conversation } from '@/models'

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    await connectDB()

    const userId = authResult.userId
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'active'
    const skip = Number(searchParams.get('skip') || 0)
    const limit = Number(searchParams.get('limit') || 20)

    const conversations = await Conversation.find({
      'participants.userId': userId,
      status: status || 'active',
    })
      .populate('participants.userId', 'fullName profileImage')
      .populate('trainerId', 'name specialty rating')
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })

    const total = await Conversation.countDocuments({
      'participants.userId': userId,
      status: status || 'active',
    })

    return NextResponse.json({
      success: true,
      data: conversations,
      pagination: { skip, limit, total },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('Get conversations error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
