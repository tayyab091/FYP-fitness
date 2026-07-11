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

    const userId = authResult.userId

    const requests = await TrainerClientRelationship.find({
      userId,
    })
      .populate('trainerId', '-password')
      .sort({ requestedAt: -1 })

    return NextResponse.json({
      success: true,
      data: requests,
    })
  } catch (err: unknown) {
    console.error('❌ Error fetching requests:', err)
    const message = err instanceof Error ? err.message : 'Failed to fetch requests'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch requests',
        message,
      },
      { status: 500 }
    )
  }
}
