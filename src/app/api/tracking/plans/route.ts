import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse } from '@/lib/middleware/auth'
import { checkAccessFlag, requireActiveRelationship } from '@/lib/middleware/relationships'
import { enrichBodyWithTrainerId } from '@/lib/trackingHelpers'
import { WorkoutPlan } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body = await enrichBodyWithTrainerId(await req.json())
    const relResult = await requireActiveRelationship(req, undefined, body)
    if (isNextResponse(relResult)) {
      return relResult
    }

    const accessDenied = await checkAccessFlag(relResult.relationship, 'canEditSchedule')
    if (accessDenied) {
      return accessDenied
    }

    const trainerId = relResult.userId
    const { userId, relationshipId, title, goal, level, durationWeeks, weeklySchedule } = body

    if (!title || !goal || !durationWeeks) {
      return NextResponse.json(
        { success: false, error: 'Title, goal, and durationWeeks are required' },
        { status: 400 }
      )
    }

    const plan = await WorkoutPlan.create({
      trainerId,
      userId,
      relationshipId,
      title,
      goal,
      level: level || 'beginner',
      durationWeeks,
      weeklySchedule: weeklySchedule || [],
      status: 'draft',
      isActive: true,
    })

    return NextResponse.json(
      {
        success: true,
        data: plan,
        message: 'Workout plan created',
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create workout plan'
    console.error('Error creating workout plan:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to create workout plan', message },
      { status: 500 }
    )
  }
}
