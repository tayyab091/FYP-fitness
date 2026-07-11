import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse } from '@/lib/middleware/auth'
import { requireActiveRelationship } from '@/lib/middleware/relationships'
import { enrichBodyWithTrainerId } from '@/lib/trackingHelpers'
import { WorkoutLog } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body = await enrichBodyWithTrainerId(await req.json())
    const relResult = await requireActiveRelationship(req, undefined, body)
    if (isNextResponse(relResult)) {
      return relResult
    }

    const userId = relResult.userId
    const { planId, dayOfWeek, sessionName } = body

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'planId is required' },
        { status: 400 }
      )
    }

    const log = await WorkoutLog.create({
      userId,
      planId,
      relationshipId: relResult.relationship._id,
      scheduledDate: new Date(),
      dayOfWeek,
      sessionName,
      status: 'in_progress',
      startedAt: new Date(),
      exercises: [],
    })

    return NextResponse.json(
      {
        success: true,
        data: log,
        message: 'Workout started',
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start workout'
    console.error('Error starting workout:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to start workout', message },
      { status: 500 }
    )
  }
}
