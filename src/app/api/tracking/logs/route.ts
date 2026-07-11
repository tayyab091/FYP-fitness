import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { WorkoutLog } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const userId = authResult.userId
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const logs = await WorkoutLog.find({ userId })
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('planId', 'title goal')

    const total = await WorkoutLog.countDocuments({ userId })

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch logs'
    console.error('Error fetching workout logs:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs', message },
      { status: 500 }
    )
  }
}
