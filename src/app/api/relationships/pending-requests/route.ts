import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { TrainerClientRelationship } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const trainerId = authResult.userId

    const pendingRequests = await TrainerClientRelationship.find({
      trainerId,
      status: 'pending',
    })
      .populate('userId', '-password -freeChatsUsed')
      .sort({ requestedAt: -1 })

    return NextResponse.json({
      success: true,
      data: pendingRequests,
      count: pendingRequests.length,
    })
  } catch (err: unknown) {
    console.error('❌ Error fetching pending requests:', err)
    const message = err instanceof Error ? err.message : 'Failed to fetch pending requests'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pending requests',
        message,
      },
      { status: 500 }
    )
  }
}
