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

    const relationship = await TrainerClientRelationship.findOne({
      userId,
      status: 'active',
    })
      .populate('trainerId', '-password')
      .populate('assignedPlanId')
      .populate('conversationId')

    if (!relationship) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active trainer relationship found',
      })
    }

    return NextResponse.json({
      success: true,
      data: relationship,
    })
  } catch (err: unknown) {
    console.error("❌ Error fetching user's trainer:", err)
    const message = err instanceof Error ? err.message : "Failed to fetch trainer relationship"
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trainer relationship',
        message,
      },
      { status: 500 }
    )
  }
}
