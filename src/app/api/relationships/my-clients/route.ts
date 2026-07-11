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

    const clients = await TrainerClientRelationship.find({
      trainerId,
      status: 'active',
    })
      .populate('userId', '-password -freeChatsUsed')
      .populate('assignedPlanId')
      .sort({ acceptedAt: -1 })

    return NextResponse.json({
      success: true,
      data: clients,
      count: clients.length,
    })
  } catch (err: unknown) {
    console.error("❌ Error fetching trainer's clients:", err)
    const message = err instanceof Error ? err.message : 'Failed to fetch clients'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch clients',
        message,
      },
      { status: 500 }
    )
  }
}
